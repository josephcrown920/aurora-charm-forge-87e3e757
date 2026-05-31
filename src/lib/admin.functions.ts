import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden — admin only");
}

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);

    const [usersRes, gensRes, paymentsRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("user_id, email, display_name, credits, lifetime_credits_purchased, created_at").order("created_at", { ascending: false }).limit(500),
      supabaseAdmin.from("generations").select("id, user_id, prompt, status, kind, model, result_image_url, result_video_url, credits_cost, created_at, error").order("created_at", { ascending: false }).limit(200),
      supabaseAdmin.from("payments").select("id, user_id, reference, amount_kobo, currency, credits_granted, status, created_at").order("created_at", { ascending: false }).limit(100),
    ]);

    const users = usersRes.data ?? [];
    const generations = gensRes.data ?? [];
    const payments = paymentsRes.data ?? [];

    const totalRevenueUsd = payments
      .filter((p) => p.status === "succeeded")
      .reduce((acc, p) => acc + (p.currency === "USD" ? p.amount_kobo / 100 : 0), 0);

    const totalGens = generations.length;
    const totalImages = generations.filter((g) => g.kind === "image").length;
    const totalVideos = generations.filter((g) => g.kind === "video").length;

    return { users, generations, payments, stats: { totalRevenueUsd, totalGens, totalImages, totalVideos, totalUsers: users.length } };
  });

export const adminGrantCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const o = input as { userId?: string; amount?: number };
    if (!o.userId || typeof o.amount !== "number") throw new Error("Bad input");
    return { userId: o.userId, amount: Math.floor(o.amount) };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    await supabaseAdmin.rpc("grant_credits", { _user: data.userId, _amount: data.amount, _reason: "admin_grant", _ref: crypto.randomUUID() });
    return { ok: true };
  });