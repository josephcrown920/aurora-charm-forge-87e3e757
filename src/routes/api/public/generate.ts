// Unified generation endpoint — POST /api/public/generate
// Authenticates the caller, deducts credits, validates URL hosts to prevent SSRF,
// then delegates to the orchestrator.
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { orchestrate, type GenerateKind } from "@/lib/orchestrator.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const Schema = z.object({
  kind: z.enum(["image", "video", "lipsync", "upscale"]),
  prompt: z.string().max(2000).optional(),
  imageUrls: z.array(z.string().url()).max(6).optional(),
  audioUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  duration: z.number().int().min(3).max(12).optional(),
  resolution: z.enum(["480p", "720p", "1080p"]).optional(),
  model: z.string().max(120).optional(),
});

// SSRF guard: only allow well-known media hosts. Blocks private/loopback/link-local IPs.
const ALLOWED_HOST_SUFFIXES = [
  ".supabase.co",
  ".supabase.in",
  ".lovable.app",
  ".replicate.delivery",
  ".replicate.com",
  "api.sync.so",
  ".sync.so",
  "storage.googleapis.com",
  ".googleusercontent.com",
  ".r2.cloudflarestorage.com",
  ".amazonaws.com",
];

function assertTrustedUrl(raw: string) {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Error("Invalid URL");
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") {
    throw new Error("URL scheme not allowed");
  }
  const host = u.hostname.toLowerCase();
  // Block IP literals and obvious internal ranges
  if (
    /^(?:127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|::1|localhost)/i.test(host) ||
    /^172\.(?:1[6-9]|2\d|3[0-1])\./.test(host) ||
    host === "metadata.google.internal"
  ) {
    throw new Error("URL host not allowed");
  }
  const ok = ALLOWED_HOST_SUFFIXES.some((s) =>
    s.startsWith(".") ? host.endsWith(s) || host === s.slice(1) : host === s,
  );
  if (!ok) throw new Error("URL host not allowed");
}

function creditCost(kind: GenerateKind): number {
  switch (kind) {
    case "image":
      return 1;
    case "upscale":
      return 1;
    case "lipsync":
      return 3;
    case "video":
      return 5;
  }
}

async function authUserId(req: Request): Promise<string | null> {
  const h = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!h?.startsWith("Bearer ")) return null;
  const token = h.slice(7);
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export const Route = createFileRoute("/api/public/generate")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }),
      POST: async ({ request }) => {
        const cors = {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        };
        let charged = false;
        let userId: string | null = null;
        let cost = 0;
        try {
          userId = await authUserId(request);
          if (!userId) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
          }
          const body = await request.json();
          const data = Schema.parse(body);

          // SSRF guard
          for (const url of data.imageUrls ?? []) assertTrustedUrl(url);
          if (data.audioUrl) assertTrustedUrl(data.audioUrl);
          if (data.videoUrl) assertTrustedUrl(data.videoUrl);

          // Deduct credits up front
          cost = creditCost(data.kind as GenerateKind);
          const { data: ok, error: chargeErr } = await supabaseAdmin.rpc("deduct_credits", {
            _user: userId,
            _amount: cost,
            _reason: `public_generate_${data.kind}`,
            _ref: crypto.randomUUID(),
          });
          if (chargeErr) throw new Error(chargeErr.message);
          if (!ok) {
            return new Response(JSON.stringify({ error: "Insufficient credits" }), { status: 402, headers: cors });
          }
          charged = true;

          const result = await orchestrate({
            kind: data.kind as GenerateKind,
            prompt: data.prompt,
            imageUrls: data.imageUrls,
            audioUrl: data.audioUrl,
            videoUrl: data.videoUrl,
            duration: data.duration,
            resolution: data.resolution,
            model: data.model,
            userId,
          });

          // Audit trail
          await supabaseAdmin.from("generations").insert({
            user_id: userId,
            prompt: data.prompt ?? "",
            kind: data.kind,
            mode: "performance",
            status: "succeeded",
            input_images: data.imageUrls ?? [],
            audio_url: data.audioUrl ?? null,
            model: result.provider,
            result_image_url: data.kind === "image" ? result.url : null,
            result_video_url: data.kind === "video" || data.kind === "lipsync" ? result.url : null,
            credits_cost: cost,
          });

          return new Response(
            JSON.stringify({
              ok: true,
              url: result.url,
              provider: result.provider,
              endpoint: result.endpoint,
              latencyMs: result.latencyMs,
              estimatedCostUsd: result.costUsd,
            }),
            { status: 200, headers: cors },
          );
        } catch (e) {
          // Refund on failure
          if (charged && userId && cost > 0) {
            await supabaseAdmin.rpc("grant_credits", {
              _user: userId,
              _amount: cost,
              _reason: "refund_public_generate",
              _ref: crypto.randomUUID(),
            });
          }
          const msg = e instanceof Error ? e.message : "Unknown error";
          return new Response(JSON.stringify({ ok: false, error: msg }), { status: 400, headers: cors });
        }
      },
    },
  },
});
