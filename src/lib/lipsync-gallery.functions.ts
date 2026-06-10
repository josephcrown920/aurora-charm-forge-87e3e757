import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Lip sync results gallery — store and retrieve lip-sync generations.
 * Used by /lipsync route to display history of syncs.
 */

export const listLipsyncResults = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;

    const { data, error } = await supabaseAdmin
      .from("generations")
      .select(
        "id, created_at, prompt, status, model, result_video_url, input_videos, kind"
      )
      .eq("user_id", userId)
      .eq("kind", "lipsync")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);

    return (data || []).map((g) => ({
      id: g.id,
      createdAt: g.created_at,
      prompt: g.prompt,
      status: g.status,
      model: g.model,
      resultUrl: g.result_video_url,
      inputVideos: g.input_videos,
    }));
  });

export const getLipsyncResult = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { generationId } = data as { generationId: string };
    const { userId } = context;

    const { data: gen, error } = await supabaseAdmin
      .from("generations")
      .select("*")
      .eq("id", generationId)
      .eq("user_id", userId)
      .eq("kind", "lipsync")
      .maybeSingle();

    if (error || !gen) throw new Error("Generation not found");

    return gen;
  });

export const deleteLipsyncResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { generationId } = data as { generationId: string };
    const { userId } = context;

    // Delete from database
    const { error } = await supabaseAdmin
      .from("generations")
      .delete()
      .eq("id", generationId)
      .eq("user_id", userId)
      .eq("kind", "lipsync");

    if (error) throw new Error(error.message);

    // Delete from storage if result exists
    // (URL is supabase-hosted, so cleanup handled by storage policy)

    return { success: true };
  });
