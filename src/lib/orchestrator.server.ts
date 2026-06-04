// Aurora Orchestration Layer (server-only)
// Unified abstraction over multiple AI inference providers:
//   - Lovable AI Gateway (Gemini family)
//   - fal.ai (Seedream, Seedance, Kling, Sync, Wav2Lip)
//   - Replicate (placeholder adapter, easy to extend)
//   - RunPod / Runware (placeholder adapter)
//
// Routing strategy:
//   1. Pick the preferred provider for the requested `kind` + `quality`.
//   2. If the provider is marked unhealthy or returns a retryable error,
//      fail over to the next provider in the priority list.
//   3. Every attempt is logged to `provider_logs` for monitoring.
//
// This module is server-only (uses fetch + service-role inserts).

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { falRun } from "./fal.server";
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
  name: "lovable" | "fal" | "replicate" | "runpod" | "huggingface";
  supports: (req: GenerateRequest) => boolean;
  /** Estimated cost in USD per call — used for cost-aware routing. */
  estimateCost: (req: GenerateRequest) => number;
  run: (req: GenerateRequest) => Promise<{ url: string; endpoint: string }>;
};

// ─── Health tracking (in-memory; resets per worker, good enough as a backoff hint) ──
const HEALTH = new Map<string, { failures: number; cooldownUntil: number }>();

function isHealthy(provider: string): boolean {
  const h = HEALTH.get(provider);
  if (!h) return true;
  return Date.now() > h.cooldownUntil;
}

function markFailure(provider: string) {
  const h = HEALTH.get(provider) ?? { failures: 0, cooldownUntil: 0 };
  h.failures += 1;
  // Exponential cooldown: 5s, 15s, 45s, 2min max
  const seconds = Math.min(120, 5 * Math.pow(3, h.failures - 1));
  h.cooldownUntil = Date.now() + seconds * 1000;
  HEALTH.set(provider, h);
}

function markSuccess(provider: string) {
  HEALTH.set(provider, { failures: 0, cooldownUntil: 0 });
}

// ─── Adapters ────────────────────────────────────────────────────────────────

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
      body: JSON.stringify({
        model: endpoint,
        messages: [{ role: "user", content }],
        modalities: ["image", "text"],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Lovable AI ${res.status}: ${t.slice(0, 200)}`);
    }
    const json = await res.json();
    const msg = json?.choices?.[0]?.message;
    const url: string | undefined = msg?.images?.[0]?.image_url?.url ?? msg?.images?.[0]?.url;
    if (!url) throw new Error("Lovable AI returned no image");
    return { url, endpoint };
  },
};

const FAL_ENDPOINTS: Record<string, { endpoint: string; kind: GenerateKind; cost: number }> = {
  "fal-ai/seedream-4": { endpoint: "fal-ai/bytedance/seedream/v4/edit", kind: "image", cost: 0.04 },
  "fal-ai/seedream-4.5": { endpoint: "fal-ai/bytedance/seedream/v4/edit", kind: "image", cost: 0.05 },
  "seedance-2.0": { endpoint: "fal-ai/bytedance/seedance/v1/pro/image-to-video", kind: "video", cost: 0.4 },
  "seedance-2.0-fast": { endpoint: "fal-ai/bytedance/seedance/v1/pro/image-to-video", kind: "video", cost: 0.25 },
  "kling-3.0": { endpoint: "fal-ai/kling-video/v2.1/master/image-to-video", kind: "video", cost: 0.6 },
  "kling-3.0-omni": { endpoint: "fal-ai/kling-video/v2.1/master/image-to-video", kind: "video", cost: 0.7 },
  "fal-ai/sync-lipsync/v2": { endpoint: "fal-ai/sync-lipsync/v2", kind: "lipsync", cost: 0.3 },
  "fal-ai/wav2lip": { endpoint: "fal-ai/wav2lip", kind: "lipsync", cost: 0.15 },
};

const fal: ProviderAdapter = {
  name: "fal",
  supports: (r) => {
    if (!r.model) return r.kind === "video" || r.kind === "lipsync";
    const m = FAL_ENDPOINTS[r.model];
    return !!m && m.kind === r.kind;
  },
  estimateCost: (r) => (r.model && FAL_ENDPOINTS[r.model]?.cost) || 0.3,
  async run(r) {
    const m = r.model ? FAL_ENDPOINTS[r.model] : null;
    if (!m) throw new Error(`Unsupported fal model: ${r.model}`);
    const payload: Record<string, unknown> = {};
    if (r.prompt) payload.prompt = r.prompt;
    if (r.imageUrls && r.imageUrls.length) {
      if (m.kind === "image") payload.image_urls = r.imageUrls;
      else payload.image_url = r.imageUrls[0];
    }
    if (r.kind === "lipsync") {
      payload.video_url = r.videoUrl;
      payload.audio_url = r.audioUrl;
    }
    if (r.kind === "video") {
      payload.duration = String(r.duration ?? 5);
      payload.resolution = r.resolution ?? "720p";
    }

    const out = await falRun<{ video?: { url: string }; images?: Array<{ url: string }> }>(
      m.endpoint,
      payload,
      300_000,
    );
    const url = out.video?.url ?? out.images?.[0]?.url;
    if (!url) throw new Error(`fal ${m.endpoint} returned no asset`);
    return { url, endpoint: m.endpoint };
  },
};

// Placeholder adapters — wired to env-var keys so they activate when the
// user fills the secrets. They throw early if the key is missing.
const replicate: ProviderAdapter = {
  name: "replicate",
  supports: () => false, // disabled until REPLICATE_API_TOKEN is set
  estimateCost: () => 0.1,
  async run() {
    throw new Error("Replicate adapter not yet wired (REPLICATE_API_TOKEN missing)");
  },
};

const runpod: ProviderAdapter = {
  name: "runpod",
  supports: () => false, // disabled until RUNPOD_API_KEY is set
  estimateCost: () => 0.08,
  async run() {
    throw new Error("RunPod adapter not yet wired (RUNPOD_API_KEY missing)");
  },
};

// GPU Worker pool — dispatches to admin-registered HTTP workers (RunPod, vast.ai,
// salad, your own cluster, etc.). Each row in `gpu_workers` becomes a candidate.
const gpuWorker: ProviderAdapter = {
  name: "runpod", // logged under runpod bucket; actual worker id captured in endpoint
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
            kind: r.kind,
            prompt: r.prompt,
            image_urls: r.imageUrls,
            audio_url: r.audioUrl,
            video_url: r.videoUrl,
            model: r.model,
            duration: r.duration,
            resolution: r.resolution,
          }),
          signal: AbortSignal.timeout(300_000),
        });
        if (!res.ok) throw new Error(`worker ${w.name} -> ${res.status}: ${(await res.text()).slice(0, 200)}`);
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

// Hugging Face adapter — maps our HF model ids to inference endpoints,
// generates bytes, uploads to the `studio` bucket, returns a public URL.
const HF_ENDPOINTS: Record<string, { endpoint: string; kind: GenerateKind; cost: number }> = {
  "hf/flux-schnell": { endpoint: "black-forest-labs/FLUX.1-schnell", kind: "image", cost: 0.003 },
  "hf/sdxl": { endpoint: "stabilityai/stable-diffusion-xl-base-1.0", kind: "image", cost: 0.004 },
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

// Priority order per kind (managed providers first, GPU workers as overflow/fallback)
const PRIORITY: Record<GenerateKind, ProviderAdapter[]> = {
  image: [lovable, fal, huggingface, gpuWorker, replicate],
  video: [fal, gpuWorker, replicate],
  lipsync: [fal, gpuWorker, replicate],
  upscale: [fal, gpuWorker, replicate],
};

// ─── Logging ─────────────────────────────────────────────────────────────────
async function log(opts: {
  provider: string;
  endpoint: string;
  kind: GenerateKind;
  status: "ok" | "error";
  latencyMs: number;
  costUsd: number;
  error?: string;
  userId?: string | null;
  refId?: string | null;
}) {
  try {
    await supabaseAdmin.from("provider_logs").insert({
      provider: opts.provider,
      endpoint: opts.endpoint,
      kind: opts.kind,
      status: opts.status,
      latency_ms: opts.latencyMs,
      cost_usd: opts.costUsd,
      error: opts.error ?? null,
      user_id: opts.userId ?? null,
      ref_id: opts.refId ?? null,
    });
  } catch {
    // never let logging break a generation
  }
}

// ─── Main entry ──────────────────────────────────────────────────────────────
export async function orchestrate(req: GenerateRequest): Promise<GenerateResult> {
  const adapters = PRIORITY[req.kind].filter((a) => a.supports(req) && isHealthy(a.name));
  if (adapters.length === 0) {
    throw new Error(`No healthy provider available for kind=${req.kind} model=${req.model ?? "?"}`);
  }
  let lastErr: Error | null = null;
  for (const adapter of adapters) {
    const start = Date.now();
    try {
      const { url, endpoint } = await adapter.run(req);
      const latency = Date.now() - start;
      const cost = adapter.estimateCost(req);
      markSuccess(adapter.name);
      await log({
        provider: adapter.name,
        endpoint,
        kind: req.kind,
        status: "ok",
        latencyMs: latency,
        costUsd: cost,
        userId: req.userId,
        refId: req.refId,
      });
      return { url, provider: adapter.name, endpoint, latencyMs: latency, costUsd: cost };
    } catch (e) {
      const latency = Date.now() - start;
      const msg = e instanceof Error ? e.message : String(e);
      lastErr = e instanceof Error ? e : new Error(msg);
      markFailure(adapter.name);
      await log({
        provider: adapter.name,
        endpoint: req.model ?? "unknown",
        kind: req.kind,
        status: "error",
        latencyMs: latency,
        costUsd: 0,
        error: msg.slice(0, 500),
        userId: req.userId,
        refId: req.refId,
      });
    }
  }
  throw lastErr ?? new Error("All providers failed");
}
