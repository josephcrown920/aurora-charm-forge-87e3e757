import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { orchestrate } from "./orchestrator.server";
import { fetchToBytes } from "./replicate.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const COST_IMAGE = 1;
const COST_VIDEO = 5;
const COST_LIPSYNC = 3;

async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

async function trackServer(name: string, userId: string | null, payload?: Record<string, unknown>) {
  try {
    await supabaseAdmin.from("events").insert({
      name,
      user_id: userId,
      path: "server",
      payload: (payload ?? null) as never,
    });
  } catch { /* never break on tracking */ }
}

async function chargeCredits(userId: string, amount: number, reason: string, refId: string) {
  // Admins get unlimited generations — skip the deduction entirely.
  if (await isAdmin(userId)) {
    await trackServer("admin_free_generation", userId, { reason, refId, amount });
    return;
  }
  const { data, error } = await supabaseAdmin.rpc("deduct_credits", {
    _user: userId,
    _amount: amount,
    _reason: reason,
    _ref: refId,
  });
  if (error) throw new Error(error.message);
  if (data === false) throw new Error("Not enough credits. Buy more from the Credits panel.");
}

async function refundCredits(userId: string, amount: number, refId: string) {
  if (await isAdmin(userId)) return; // nothing to refund
  await supabaseAdmin.rpc("grant_credits", {
    _user: userId,
    _amount: amount,
    _reason: "refund_failed_generation",
    _ref: refId,
  });
}

export { trackServer };


const LOVABLE_IMAGE_MODELS = new Set([
  "google/gemini-2.5-flash-image",
  "google/gemini-3.1-flash-image-preview",
  "google/gemini-3-pro-image-preview",
]);

const GenerateSchema = z.object({
  prompt: z.string().min(3).max(2000),
  imageUrls: z.array(z.string().url()).min(1).max(6),
  motionVideoUrl: z.string().url().optional().nullable(),
  model: z.string().default("google/gemini-2.5-flash-image"),
});

async function urlToInlineData(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${url}`);
  const buf = await res.arrayBuffer();
  const b64 = Buffer.from(buf).toString("base64");
  const ct = res.headers.get("content-type") || "image/jpeg";
  return `data:${ct};base64,${b64}`;
}

export const generatePerformanceShot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenerateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: row, error: insErr } = await supabase
      .from("generations")
      .insert({
        user_id: userId,
        prompt: data.prompt,
        status: "processing",
        kind: "image",
        model: data.model,
        input_images: data.imageUrls,
        motion_video_url: data.motionVideoUrl ?? null,
        credits_cost: COST_IMAGE,
      })
      .select()
      .single();
    if (insErr || !row) throw new Error(insErr?.message || "Insert failed");

    await chargeCredits(userId, COST_IMAGE, "image_generation", row.id);

    try {
      let bytes: Buffer;
      let mime: string;
      let ext: string;

      if (LOVABLE_IMAGE_MODELS.has(data.model)) {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) throw new Error("AI gateway not configured");
        const inline = await Promise.all(data.imageUrls.map(urlToInlineData));
        const userContent: Array<Record<string, unknown>> = [
          { type: "text", text: data.prompt },
          ...inline.map((url) => ({ type: "image_url", image_url: { url } })),
        ];
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
          body: JSON.stringify({
            model: data.model,
            messages: [{ role: "user", content: userContent }],
            modalities: ["image", "text"],
          }),
        });
        if (!aiRes.ok) {
          const errText = await aiRes.text();
          if (aiRes.status === 429) throw new Error("Rate limit reached. Please try again in a moment.");
          if (aiRes.status === 402) throw new Error("AI credits exhausted. Add credits in workspace settings.");
          throw new Error(`AI error: ${errText.slice(0, 200)}`);
        }
        const json = await aiRes.json();
        const msgOut = json?.choices?.[0]?.message;
        const imgUrl: string | undefined = msgOut?.images?.[0]?.image_url?.url ?? msgOut?.images?.[0]?.url;
        if (!imgUrl) throw new Error("No image returned from model");
        const m = imgUrl.match(/^data:(.+?);base64,(.+)$/);
        if (!m) throw new Error("Unexpected image format");
        mime = m[1];
        ext = mime.split("/")[1]?.split("+")[0] || "png";
        bytes = Buffer.from(m[2], "base64");
      } else {
        // Route everything else (Seedream, FLUX, etc) through the orchestrator.
        const out = await orchestrate({
          kind: "image",
          model: data.model,
          prompt: data.prompt,
          imageUrls: data.imageUrls,
          userId,
          refId: row.id,
        });
        const got = await fetchToBytes(out.url);
        bytes = got.bytes;
        mime = got.mime || "image/png";
        ext = mime.split("/")[1]?.split("+")[0] || "png";
      }

      const path = `${userId}/results/${row.id}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("studio")
        .upload(path, bytes, { contentType: mime, upsert: true });
      if (upErr) throw new Error(upErr.message);
      const publicUrl = supabase.storage.from("studio").getPublicUrl(path).data.publicUrl;
      await supabase
        .from("generations")
        .update({ status: "complete", result_image_url: publicUrl })
        .eq("id", row.id);
      return { id: row.id, resultUrl: publicUrl };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      await supabase
        .from("generations")
        .update({ status: "failed", error: msg })
        .eq("id", row.id);
      await refundCredits(userId, COST_IMAGE, row.id);
      throw new Error(msg);
    }
  });

const VideoSchema = z.object({
  imageUrl: z.string().url(),
  prompt: z.string().min(2).max(1000),
  duration: z.number().int().min(3).max(12).default(5),
  resolution: z.enum(["480p", "720p", "1080p"]).default("720p"),
  modelKey: z.string().default("seedance-2.0"),
  /** Optional motion / camera control preset (e.g. zoom_in, pan_left, orbit). */
  cameraMovement: z.string().max(40).optional().nullable(),
  /** Optional end-frame image URL (Kling supports start+end frame interpolation). */
  endFrameUrl: z.string().url().optional().nullable(),
});

const CAMERA_HINTS: Record<string, string> = {
  static: "locked-off static camera, no movement",
  zoom_in: "slow smooth dolly zoom in toward the subject",
  zoom_out: "slow smooth dolly zoom out away from the subject",
  pan_left: "smooth horizontal camera pan to the left",
  pan_right: "smooth horizontal camera pan to the right",
  tilt_up: "smooth vertical camera tilt upward",
  tilt_down: "smooth vertical camera tilt downward",
  orbit_cw: "cinematic orbit camera moving clockwise around the subject",
  orbit_ccw: "cinematic orbit camera moving counter-clockwise around the subject",
  push_in: "fast confident push-in toward the subject's face",
  pull_out: "graceful pull-out reveal away from the subject",
};


export const generateVideoFromImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => VideoSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const cameraHint = data.cameraMovement ? CAMERA_HINTS[data.cameraMovement] : null;
    const fullPrompt = cameraHint ? `${data.prompt}. Camera: ${cameraHint}.` : data.prompt;

    const { data: row, error: insErr } = await supabase
      .from("generations")
      .insert({
        user_id: userId,
        prompt: fullPrompt,
        status: "processing",
        kind: "video",
        model: data.modelKey,
        input_images: data.endFrameUrl ? [data.imageUrl, data.endFrameUrl] : [data.imageUrl],
      })
      .select()
      .single();
    if (insErr || !row) throw new Error(insErr?.message || "Insert failed");
    await chargeCredits(userId, COST_VIDEO, "video_generation", row.id);
    try {
      const out = await orchestrate({
        kind: "video",
        model: data.modelKey,
        prompt: fullPrompt,
        imageUrls: data.endFrameUrl ? [data.imageUrl, data.endFrameUrl] : [data.imageUrl],
        duration: data.duration,
        resolution: data.resolution,
        userId,
        refId: row.id,
      });
      const { bytes, mime } = await fetchToBytes(out.url);
      const path = `${userId}/videos/${row.id}.mp4`;
      const { error: upErr } = await supabase.storage
        .from("studio")
        .upload(path, bytes, { contentType: mime || "video/mp4", upsert: true });
      if (upErr) throw new Error(upErr.message);
      const publicUrl = supabase.storage.from("studio").getPublicUrl(path).data.publicUrl;
      await supabase
        .from("generations")
        .update({ status: "complete", result_video_url: publicUrl })
        .eq("id", row.id);
      return { id: row.id, videoUrl: publicUrl };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      await supabase.from("generations").update({ status: "failed", error: msg }).eq("id", row.id);
      await refundCredits(userId, COST_VIDEO, row.id);
      throw new Error(msg);
    }
  });



// ─── Split Reality ────────────────────────────────────────────────────────
// Runs two image generations in parallel from the same input: ultra-realism + cinematic vision.
const SplitRealitySchema = z.object({
  imageUrls: z.array(z.string().url()).min(1).max(3),
  basePrompt: z.string().min(3).max(1000).default(""),
});

const ULTRA_REALISM_PROMPT =
  "Ultra-realistic mirror-selfie style photograph of the subject, taken on a modern smartphone. Preserve exact facial likeness, skin tone, beard, hairstyle, body proportions and outfit. Natural i[...]";

const CINEMATIC_VISION_PROMPT =
  "Dramatic cinematic close-up portrait of the subject, anamorphic lens look, intense emotional expression, mid-action (yelling or singing), windswept hair, moody overcast sky in background, desa[...]";

export const generateSplitReality = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SplitRealitySchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const model = "google/gemini-3.1-flash-image-preview";

    const runOne = async (variant: "ultra" | "cinematic", prompt: string) => {
      const { data: row, error: insErr } = await supabase
        .from("generations")
        .insert({
          user_id: userId,
          prompt: `[Split Reality / ${variant}] ${prompt}`,
          status: "processing",
          kind: "image",
          model,
          input_images: data.imageUrls,
          credits_cost: COST_IMAGE,
        })
        .select()
        .single();
      if (insErr || !row) throw new Error(insErr?.message || "Insert failed");
      await chargeCredits(userId, COST_IMAGE, `split_${variant}`, row.id);

      try {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) throw new Error("AI gateway not configured");
        const inline = await Promise.all(data.imageUrls.map(urlToInlineData));
        const userContent: Array<Record<string, unknown>> = [
          { type: "text", text: prompt + (data.basePrompt ? " " + data.basePrompt : "") },
          ...inline.map((url) => ({ type: "image_url", image_url: { url } })),
        ];
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: userContent }],
            modalities: ["image", "text"],
          }),
        });
        if (!aiRes.ok) {
          const errText = await aiRes.text();
          if (aiRes.status === 429) throw new Error("Rate limit reached.");
          if (aiRes.status === 402) throw new Error("AI credits exhausted.");
          throw new Error(`AI error: ${errText.slice(0, 200)}`);
        }
        const json = await aiRes.json();
        const msgOut = json?.choices?.[0]?.message;
        const imgUrl: string | undefined = msgOut?.images?.[0]?.image_url?.url ?? msgOut?.images?.[0]?.url;
        if (!imgUrl) throw new Error("No image returned");
        const m = imgUrl.match(/^data:(.+?);base64,(.+)$/);
        if (!m) throw new Error("Unexpected image format");
        const mime = m[1];
        const ext = mime.split("/")[1]?.split("+")[0] || "png";
        const bytes = Buffer.from(m[2], "base64");
        const path = `${userId}/results/${row.id}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("studio")
          .upload(path, bytes, { contentType: mime, upsert: true });
        if (upErr) throw new Error(upErr.message);
        const publicUrl = supabase.storage.from("studio").getPublicUrl(path).data.publicUrl;
        await supabase.from("generations").update({ status: "complete", result_image_url: publicUrl }).eq("id", row.id);
        return { id: row.id, url: publicUrl, variant };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        await supabase.from("generations").update({ status: "failed", error: msg }).eq("id", row.id);
        await refundCredits(userId, COST_IMAGE, row.id);
        throw new Error(msg);
      }
    };

    const [ultra, cinematic] = await Promise.all([
      runOne("ultra", ULTRA_REALISM_PROMPT),
      runOne("cinematic", CINEMATIC_VISION_PROMPT),
    ]);
    return { ultra, cinematic };
  });

const LipSyncSchema = z.object({
  videoUrl: z.string().url(),
  audioUrl: z.string().url(),
  model: z.enum(["fal-ai/sync-lipsync/v2", "fal-ai/wav2lip"]).default("fal-ai/sync-lipsync/v2"),
});

export const lipSyncVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => LipSyncSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const model = data.model;
    
    // Validate audio URL is accessible before charging credits
    try {
      const audioRes = await fetch(data.audioUrl, { method: "HEAD", signal: AbortSignal.timeout(5000) });
      if (!audioRes.ok) throw new Error(`Audio URL returned ${audioRes.status}`);
    } catch (e) {
      throw new Error(`Audio validation failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    const { data: row, error: insErr } = await supabase
      .from("generations")
      .insert({
        user_id: userId,
        prompt: model === "fal-ai/wav2lip" ? "lip sync (wav2lip)" : "lip sync (sync 1.9)",
        status: "processing",
        kind: "video",
        model,
        input_images: [data.videoUrl],
        audio_url: data.audioUrl,
      })
      .select()
      .single();
    if (insErr || !row) throw new Error(insErr?.message || "Insert failed");
    await chargeCredits(userId, COST_LIPSYNC, "lipsync", row.id);
    try {
      const out = await orchestrate({
        kind: "lipsync",
        model,
        videoUrl: data.videoUrl,
        audioUrl: data.audioUrl,
        userId,
        refId: row.id,
      });
      const { bytes, mime } = await fetchToBytes(out.url);
      const path = `${userId}/videos/${row.id}.mp4`;
      const { error: upErr } = await supabase.storage
        .from("studio")
        .upload(path, bytes, { contentType: mime || "video/mp4", upsert: true });
      if (upErr) throw new Error(upErr.message);
      const publicUrl = supabase.storage.from("studio").getPublicUrl(path).data.publicUrl;
      await supabase
        .from("generations")
        .update({ status: "complete", result_video_url: publicUrl })
        .eq("id", row.id);
      return { id: row.id, videoUrl: publicUrl };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      await supabase.from("generations").update({ status: "failed", error: msg }).eq("id", row.id);
      await refundCredits(userId, COST_LIPSYNC, row.id);
      throw new Error(msg);
    }
  });

// Toggle favorite flag — used by gallery to "save permanently"
export const toggleFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), favorite: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("generations")
      .update({ is_favorite: data.favorite })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Gallery — favorited + recent completed generations
export const listGallery = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("generations")
      .select("id, prompt, kind, model, result_image_url, result_video_url, is_favorite, tags, created_at")
      .eq("status", "complete")
      .order("is_favorite", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });

export const listGenerations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("generations")
      .select("id, prompt, status, kind, model, result_image_url, result_video_url, input_images, motion_video_url, audio_url, created_at, error")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });
