import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { orchestrate } from "@/lib/orchestrator.server";

/**
 * UGC video generation — create avatar-based product ads from user input.
 * Workflow: avatar + preset + product prompt → script → TTS → lipsync → composite
 */

export type UGCRequest = {
  avatarId: string;
  presetId: string;
  productPrompt: string; // e.g. "holding iPhone 16 Pro in rose gold"
  voiceId?: string;
};

/**
 * Generate a UGC ad video.
 * Steps:
 * 1. Generate avatar video (HeyGen)
 * 2. Generate product-focused script via LLM
 * 3. Synthesize voice (Hugging Face TTS or similar)
 * 4. Apply lipsync if needed
 */
export const generateUGCAd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { avatarId, presetId, productPrompt, voiceId } = data as UGCRequest;
    const { userId } = context;

    // For now: return a stub indicating the workflow
    // In production:
    // 1. Submit to HeyGen for avatar video
    // 2. Generate script from productPrompt via LLM
    // 3. Synthesize voice
    // 4. Composite and return

    const { data: gen, error } = await supabaseAdmin
      .from("generations")
      .insert({
        user_id: userId,
        kind: "video",
        prompt: `UGC Ad: ${presetId} with ${productPrompt}`,
        status: "processing",
        model: `heygen:${avatarId}`,
        input_videos: [presetId],
      })
      .select()
      .single();

    if (error || !gen) throw new Error("Failed to create UGC generation");

    return {
      generationId: gen.id,
      status: "processing",
      estimatedDuration: "2-3 minutes",
    };
  });
