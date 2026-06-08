// Aurora Orchestration Layer (server-only)
// Providers:
//   - lovable     → Lovable AI Gateway (Gemini image/text)
//   - replicate   → Replicate via Lovable connector gateway (Seedream, Seedance, Kling, Flux, Wav2Lip)
//   - huggingface → HF Inference (flux-schnell, sdxl)
//   - sync        → Sync.so direct API (lipsync)
//   - gpuWorker   → admin-registered HTTP workers (RunPod / vast / salad / self-hosted)

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { replicateRun, pickReplicateUrl, getReplicateKey } from "./replicate.server";
import { syncLipsync } from "./sync.server";
import { hfTextToImage } from "./hf.server";

export type GenerateKind = "image" | "video" | "lipsync" | "upscale";

export type GenerateRequest = {
  kind: GenerateKind;
  prompt?: string;
  imageUrls?: string[];
  audioUrl?: string;
  videoUrl?: string;
  duration?: number;
  resolution?: "480p" | "720p" | "1080p";
  model?: string;
  userId?: string | null;
  refId?: string | null;
};

export type GenerateResult = {
  url: string;
  provider: string;
  endpoint: string;
  latencyMs: number;
  costUsd: number;
};

type ProviderAdapter = {
  name: "lovable" | "replicate" | "huggingface" | "sync" | "runpod";
  supports: (req: GenerateRequest) => boolean;
  estimateCost: (req: GenerateRequest) => number;
  run: (req: GenerateRequest) => Promise<{ url: string; endpoint: string }>;
};

// ─── Health tracking ───────────────────────────────────────────────────────
const HEALTH = new Map<string, { failures: number; cooldownUntil: number }>();
function isHealthy(p: string) {
  const h = HEALTH.get(p);
  return !h || Date.now() > h.cooldownUntil;
}
function markFailure(p: string) {
  const h = HEALTH.get(p) ?? { failures: 0, cooldownUntil: 0 };
  h.failures += 1;
  h.cooldownUntil = Date.now() + Math.min(120, 5 * Math.pow(3, h.failures - 1)) * 1000;
  HEALTH.set(p, h);
}
function markSuccess(p: string) { HEALTH.set(p, { failures: 0, cooldownUntil: 0 }); }

// ─── Lovable (Gemini) ───────────────────────────────────────────────────────
const lovable: ProviderAdapter = {
  name: "lovable",
  supports: (r) => r.kind === "image",
  estimateCost: () => 0.002,
  async run(r) {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");
    const endpoint = r.model && r.model.startsWith("google/") ? r.model : "google/gemini-2.5-flash-image";
    const content: Array<Record<string, unknown>> = [{ type: "text", text: r.prompt ?? "" }];
    for (const url of r.imageUrls ?? []) content.push({ type: "image_url", image_url: { url } });
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({ model: endpoint, messages: [{ role: "user", content }], modalities: ["image", "text"] }),
    });
    if (!res.ok) throw new Error(`Lovable AI ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const json = await res.json();
    const msg = json?.choices?.[0]?.message;
    const url: string | undefined = msg?.images?.[0]?.image_url?.url ?? msg?.images?.[0]?.url;
    if (!url) throw new Error("Lovable AI returned no image");
    return { url, endpoint };
  },
};

// ─── Replicate ─────────────────────────────────────────────────────────
// Map our model keys → Replicate official model slugs (owner/name).
const REPLICATE_MAP: Record<string, { slug: string; kind: GenerateKind; cost: number }> = {
  // images
  "fal-ai/seedream-4":      { slug: "bytedance/seedream-4",        kind: "image", cost: 0.04 },
  "fal-ai/seedream-4.5":    { slug: "bytedance/seedream-4",        kind: "image", cost: 0.05 },
  "replicate/flux-schnell": { slug: "black-forest-labs/flux-schnell", kind: "image", cost: 0.003 },
  // video (image-to-video)
  "seedance-2.0":           { slug: "bytedance/seedance-1-pro",    kind: "video", cost: 0.40 },
  "seedance-2.0-fast":      { slug: "bytedance/seedance-1-lite",   kind: "video", cost: 0.20 },
  "kling-3.0":              { slug: "kwaivgi/kling-v2.1",          kind: "video", cost: 0.60 },
  "kling-3.0-omni":         { slug: "kwaivgi/kling-v2.1-master",   kind: "video", cost: 0.70 },
  // lipsync (fallback after sync.so direct)
  "fal-ai/sync-lipsync/v2": { slug: "sync/sync-1.6.0",             kind: "lipsync", cost: 0.30 },
  "fal-ai/wav2lip":         { slug: "cudanexus/wav2lip",           kind: "lipsync", cost: 0.10 },
};

const replicate: ProviderAdapter = {
  name: "replicate",
  supports: (r) => {
    if (!getReplicateKey()) return false;
    if (!r.model) return false;
    const m = REPLICATE_MAP[r.model];
    return !!m && m.kind === r.kind;
  },
  estimateCost: (r) => (r.model && REPLICATE_MAP[r.model]?.cost) || 0.10,
  async run(r) {
    const m = r.model ? REPLICATE_MAP[r.model] : null;
    if (!m) throw new Error(`No Replicate mapping for model: ${r.model}`);

    const input: Record<string, unknown> = {};
    if (r.prompt) input.prompt = r.prompt;

    if (m.kind === "image") {
      // Seedream-4 takes image_input (array). Flux-schnell takes only prompt.
      if (m.slug.startsWith("bytedance/seedream") && r.imageUrls?.length) {
        input.image_input = r.imageUrls;
      }
    } else if (m.kind === "video") {
      if (r.imageUrls?.[0]) {
        if (m.slug.startsWith("bytedance/seedance")) {
          input.image = r.imageUrls[0];
        } else if (m.slug.startsWith("kwaivgi/kling")) {
          // Kling: start_image is required, end_image is optional for motion control
          input.start_image = r.imageUrls[0];
          // If we have a second image URL (end frame), pass it as end_image for motion control
          if (r.imageUrls[1]) {
            input.end_image = r.imageUrls[1];
          }
        }
      }
      if (r.duration) input.duration = r.duration;
      if (m.slug.startsWith("kwaivgi/kling")) {
        input.mode = "standard";
        input.aspect_ratio = "16:9";
      }
    } else if (m.kind === "lipsync") {
      input.video = r.videoUrl;
      input.audio = r.audioUrl;
    }

    const result = await replicateRun(m.slug, input, 600_000);
    const url = pickReplicateUrl(result.output);
    return { url, endpoint: `replicate:${m.slug}` };
  },
};

// ─── Sync.so direct ───────────────────────────────────────────────────────
const sync: ProviderAdapter = {
  name: "sync",
  supports: (r) => r.kind === "lipsync" && !!process.env.SYNC_API_KEY,
  estimateCost: () => 0.25,
  async run(r) {
    if (!r.videoUrl || !r.audioUrl) throw new Error("sync: video+audio required");
    // Validate audio URL is accessible before attempting sync
    try {
      const audioRes = await fetch(r.audioUrl, { method: "HEAD", signal: AbortSignal.timeout(5000) });
      if (!audioRes.ok) throw new Error(`Audio URL returned ${audioRes.status}`);
    } catch (e) {
      throw new Error(`Audio validation failed: ${e instanceof Error ? e.message : String(e)}`);
    }
    const url = await syncLipsync({ videoUrl: r.videoUrl, audioUrl: r.audioUrl, model: "lipsync-2" });
    return { url, endpoint: "sync:lipsync-2" };
  },
};

// ─── Hugging Face ────────────────────────────────────────────────────────
const HF_ENDPOINTS: Record<string, { endpoint: string; kind: GenerateKind; cost: number }> = {
  "hf/flux-schnell": { endpoint: "black-forest-labs/FLUX.1-schnell", kind: "image", cost: 0.003 },
  "hf/sdxl":         { endpoint: "stabilityai/stable-diffusion-xl-base-1.0", kind: "image", cost: 0.004 },
};
const huggingface: ProviderAdapter = {
  name: "huggingface",
  supports: (r) => {
    if (!process.env.HF_TOKEN) return false;
    if (!r.model) return false;
    const m = HF_ENDPOINTS[r.model];
    return !!m && m.kind === r.kind;
  },
  estimateCost: (r) => (r.model && HF_ENDPOINTS[r.model]?.cost) || 0.005,
  async run(r) {
    const m = r.model ? HF_ENDPOINTS[r.model] : null;
    if (!m) throw new Error(`Unsupported HF model: ${r.model}`);
    const { bytes, contentType } = await hfTextToImage(m.endpoint, r.prompt ?? "");
    const ext = contentType.split("/")[1] || "png";
    const path = `${r.userId ?? "system"}/hf/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabaseAdmin.storage
      .from("studio")
      .upload(path, new Uint8Array(bytes), { contentType, upsert: false });
    if (error) throw new Error(`HF upload failed: ${error.message}`);
    const { data } = supabaseAdmin.storage.from("studio").getPublicUrl(path);
    return { url: data.publicUrl, endpoint: m.endpoint };
  },
};

// ─── GPU worker pool ───────────────────────────────────────────────────────
const gpuWorker: ProviderAdapter = {
  name: "runpod",
  supports: (r) => ["image", "video", "lipsync", "upscale"].includes(r.kind),
  estimateCost: (r) => (r.kind === "video" ? 0.05 : 0.01),
  async run(r) {
    const { data: workers } = await supabaseAdmin
      .from("gpu_workers")
      .select("*")
      .eq("status", "active")
      .contains("capabilities", [r.kind])
      .order("priority", { ascending: true })
      .order("in_flight", { ascending: true })
      .limit(5);
    if (!workers || workers.length === 0) throw new Error("No GPU workers available");
    let lastErr: Error | null = null;
    for (const w of workers) {
      if (w.in_flight >= w.max_concurrency) continue;
      const started = Date.now();
      try {
        await supabaseAdmin.from("gpu_workers").update({ in_flight: w.in_flight + 1 }).eq("id", w.id);
        const res = await fetch(w.endpoint_url.replace(/\/$/, "") + "/generate", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(w.auth_token ? { authorization: `Bearer ${w.auth_token}` } : {}),
          },
          body: JSON.stringify({
            kind: r.kind, prompt: r.prompt, image_urls: r.imageUrls,
            audio_url: r.audioUrl, video_url: r.videoUrl,
            model: r.model, duration: r.duration, resolution: r.resolution,
          }),
          signal: AbortSignal.timeout(300_000),
        });
        if (!res.ok) throw new Error(`worker ${w.name} -> ${res.status}`);
        const json = (await res.json()) as { url?: string; output_url?: string };
        const url = json.url ?? json.output_url;
        if (!url) throw new Error(`worker ${w.name} returned no url`);
        await supabaseAdmin.from("worker_jobs").insert({
          worker_id: w.id, user_id: r.userId ?? null, kind: r.kind,
          status: "ok", latency_ms: Date.now() - started, ref_id: r.refId ?? null,
        });
        return { url, endpoint: `gpu:${w.name}` };
      } catch (e) {
        lastErr = e instanceof Error ? e : new Error(String(e));
        await supabaseAdmin.from("worker_jobs").insert({
          worker_id: w.id, user_id: r.userId ?? null, kind: r.kind,
          status: "error", latency_ms: Date.now() - started, error: lastErr.message.slice(0, 500),
        });
      } finally {
        await supabaseAdmin.from("gpu_workers")
          .update({ in_flight: Math.max(0, w.in_flight), last_heartbeat: new Date().toISOString() })
          .eq("id", w.id);
      }
    }
    throw lastErr ?? new Error("All GPU workers failed");
  },
};

// ─── Priority chain per kind ─────────────────────────────────────────────────
const PRIORITY: Record<GenerateKind, ProviderAdapter[]> = {
  image:   [lovable, replicate, huggingface, gpuWorker],
  video:   [replicate, gpuWorker],
  lipsync: [sync, replicate, gpuWorker],
  upscale: [replicate, gpuWorker],
};

async function log(opts: {
  provider: string; endpoint: string; kind: GenerateKind;
  status: "ok" | "error"; latencyMs: number; costUsd: number;
  error?: string; userId?: string | null; refId?: string | null;
}) {
  try {
    await supabaseAdmin.from("provider_logs").insert({
      provider: opts.provider, endpoint: opts.endpoint, kind: opts.kind,
      status: opts.status, latency_ms: opts.latencyMs, cost_usd: opts.costUsd,
      error: opts.error ?? null, user_id: opts.userId ?? null, ref_id: opts.refId ?? null,
    });
  } catch { /* no-op */ }
}

export async function orchestrate(req: GenerateRequest): Promise<GenerateResult> {
  const all = PRIORITY[req.kind];
  const adapters = all.filter((a) => a.supports(req) && isHealthy(a.name));
  if (adapters.length === 0) {
    const reasons = all.map((a) => {
      if (!a.supports(req)) return `${a.name}: missing config/key for model "${req.model ?? "?"}"`;
      if (!isHealthy(a.name)) return `${a.name}: cooling down after recent failure`;
      return `${a.name}: ok`;
    }).join("; ");
    throw new Error(`No provider available for ${req.kind} → ${reasons}`);
  }
  let lastErr: Error | null = null;
  for (const adapter of adapters) {
    const start = Date.now();
    try {
      const { url, endpoint } = await adapter.run(req);
      const latency = Date.now() - start;
      const cost = adapter.estimateCost(req);
      markSuccess(adapter.name);
      await log({ provider: adapter.name, endpoint, kind: req.kind, status: "ok",
        latencyMs: latency, costUsd: cost, userId: req.userId, refId: req.refId });
      return { url, provider: adapter.name, endpoint, latencyMs: latency, costUsd: cost };
    } catch (e) {
      const latency = Date.now() - start;
      const msg = e instanceof Error ? e.message : String(e);
      lastErr = e instanceof Error ? e : new Error(msg);
      markFailure(adapter.name);
      await log({ provider: adapter.name, endpoint: req.model ?? "unknown", kind: req.kind,
        status: "error", latencyMs: latency, costUsd: 0, error: msg.slice(0, 500),
        userId: req.userId, refId: req.refId });
    }
  }
  throw lastErr ?? new Error("All providers failed");
}
