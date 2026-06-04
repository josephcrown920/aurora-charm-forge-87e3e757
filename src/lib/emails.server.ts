// Lifecycle email sender (server-only).
//
// Uses Resend via the Lovable connector gateway when both LOVABLE_API_KEY and
// RESEND_API_KEY are configured; otherwise no-ops gracefully (and logs).
//
// Auth-flow emails (signup confirm, password reset, magic links) are handled
// by Lovable Cloud / Supabase Auth automatically using the project's default
// templates. This module owns:
//   - signup_welcome  → fired after a new profile is created (onboarding)
//   - onboarding_done → fired when a user completes the studio onboarding
//   - password_reset_acknowledged → optional confirmation after a reset
//
// All sends are deduped by (user_id, template) via public.email_log.

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const RESEND_URL = "https://connector-gateway.lovable.dev/resend/emails";
const FROM = "Aurora Studio <onboarding@resend.dev>";

export type LifecycleTemplate =
  | "signup_welcome"
  | "onboarding_done"
  | "password_reset_acknowledged";

type Payload = {
  userId: string | null;
  to: string;
  template: LifecycleTemplate;
  vars?: Record<string, string>;
};

function render(template: LifecycleTemplate, vars: Record<string, string>) {
  const name = vars.name || "creator";
  switch (template) {
    case "signup_welcome":
      return {
        subject: "Welcome to Aurora ✨",
        html: `<div style="font-family:Inter,Arial,sans-serif;background:#0a0717;color:#fff;padding:32px;border-radius:24px">
  <h1 style="margin:0 0 12px;font-size:24px">Hey ${name} — welcome to Aurora.</h1>
  <p style="opacity:.8;line-height:1.6">You've got <b>5 free credits</b> waiting in your wallet. Open the studio, drop a selfie, and your first cinematic render takes under 60 seconds.</p>
  <p><a href="https://aurorastudiostar.lovable.app/studio" style="background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">Open Studio →</a></p>
  <p style="opacity:.5;font-size:12px;margin-top:24px">Reply to this email if you ever get stuck. Aurora Concierge replies fast.</p>
</div>`,
      };
    case "onboarding_done":
      return {
        subject: "First render — you're officially in 🎬",
        html: `<div style="font-family:Inter,Arial,sans-serif;background:#0a0717;color:#fff;padding:32px;border-radius:24px">
  <h1 style="margin:0 0 12px;font-size:22px">Nice one, ${name}.</h1>
  <p style="opacity:.85;line-height:1.6">Your onboarding render is in the studio. Try a different preset — Concert Stage, Neon Street, Editorial Cover — and remix the vibe.</p>
  <p><a href="https://aurorastudiostar.lovable.app/studio" style="background:#ec4899;color:#0a0717;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:700">Make another →</a></p>
</div>`,
      };
    case "password_reset_acknowledged":
      return {
        subject: "Your Aurora password was changed",
        html: `<div style="font-family:Inter,Arial,sans-serif;padding:24px">
  <p>Hi ${name}, your password was just changed. If this wasn't you, <a href="https://aurorastudiostar.lovable.app/contact">contact us</a> right away.</p>
</div>`,
      };
  }
}

export async function sendLifecycleEmail({ userId, to, template, vars = {} }: Payload) {
  const lovKey = process.env.LOVABLE_API_KEY;
  const resKey = process.env.RESEND_API_KEY;

  // Dedupe — never send the same lifecycle email twice for one user.
  if (userId) {
    const { data: prior } = await supabaseAdmin
      .from("email_log")
      .select("id")
      .eq("user_id", userId)
      .eq("template", template)
      .limit(1)
      .maybeSingle();
    if (prior) return { skipped: true, reason: "already-sent" };
  }

  const { subject, html } = render(template, vars);

  if (!lovKey || !resKey) {
    // No provider configured — log only.
    await supabaseAdmin.from("email_log").insert({
      user_id: userId,
      to_email: to,
      template,
      status: "skipped",
      error: "resend_not_configured",
    });
    return { skipped: true, reason: "resend_not_configured" };
  }

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovKey}`,
        "X-Connection-Api-Key": resKey,
      },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      await supabaseAdmin.from("email_log").insert({
        user_id: userId,
        to_email: to,
        template,
        status: "failed",
        error: `${res.status}: ${txt.slice(0, 300)}`,
      });
      return { sent: false, error: `Resend ${res.status}` };
    }
    await supabaseAdmin.from("email_log").insert({
      user_id: userId,
      to_email: to,
      template,
      status: "sent",
    });
    return { sent: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabaseAdmin.from("email_log").insert({
      user_id: userId,
      to_email: to,
      template,
      status: "failed",
      error: msg.slice(0, 300),
    });
    return { sent: false, error: msg };
  }
}
