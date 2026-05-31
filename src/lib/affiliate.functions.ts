import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

function makeCode(seed: string) {
  return (seed.replace(/[^a-z0-9]/gi, "").slice(0, 6) + Math.random().toString(36).slice(2, 6)).toLowerCase();
}

export const getMyAffiliate = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    let { data } = await supabaseAdmin.from("affiliates").select("*").eq("user_id", context.userId).maybeSingle();
    if (!data) {
      const { data: prof } = await supabaseAdmin.from("profiles").select("email,display_name").eq("user_id", context.userId).maybeSingle();
      const code = makeCode(prof?.display_name || prof?.email || "aurora");
      const ins = await supabaseAdmin.from("affiliates").insert({
        user_id: context.userId, code, payout_email: prof?.email ?? null,
      }).select("*").single();
      data = ins.data;
    }
    const { data: events } = await supabaseAdmin
      .from("affiliate_events").select("*").eq("code", data!.code)
      .order("created_at", { ascending: false }).limit(50);
    const clicks = events?.filter(e => e.kind === "click").length ?? 0;
    const conversions = events?.filter(e => e.kind === "conversion") ?? [];
    const earned = conversions.reduce((s, e) => s + Number(e.amount_usd ?? 0), 0);
    return { affiliate: data, clicks, conversionsCount: conversions.length, earned, events: events ?? [] };
  });

export const updateAffiliate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ payout_email: z.string().email() }).parse(d))
  .handler(async ({ data, context }) => {
    await supabaseAdmin.from("affiliates").update({ payout_email: data.payout_email }).eq("user_id", context.userId);
    return { ok: true };
  });

export const trackAffiliateClick = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ code: z.string().min(2).max(40) }).parse(d))
  .handler(async ({ data }) => {
    await supabaseAdmin.from("affiliate_events").insert({ code: data.code.toLowerCase(), kind: "click" });
    return { ok: true };
  });
