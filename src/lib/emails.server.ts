import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Lovable Emails integration — transactional email service.
 * Helpers are plain async functions (not server fns) so they can be called
 * from any server-only module without RPC overhead.
 */

export type EmailTemplate =
  | "welcome-5-credits"
  | "render-complete"
  | "low-credit-nudge"
  | "weekly-digest"
  | "payment-receipt"
  | "gift-redeemed";

export type LifecycleTemplate =
  | "signup_welcome"
  | "onboarding_done"
  | "password_reset_acknowledged";

type EmailPayload = {
  to: string;
  template: EmailTemplate | LifecycleTemplate;
  data: Record<string, unknown>;
  userId?: string;
};

/**
 * Send a transactional email. Logs to email_log table.
 */
export async function sendEmail(payload: EmailPayload) {
  const { to, template, userId } = payload;

  const { data: record, error: insertErr } = await supabaseAdmin
    .from("email_log")
    .insert({
      to_email: to,
      template,
      status: "queued",
      user_id: userId ?? null,
    })
    .select()
    .single();

  if (insertErr) throw new Error(`Failed to log email: ${insertErr.message}`);

  // TODO: integrate with actual email provider (Resend / Lovable Emails) here.
  await supabaseAdmin
    .from("email_log")
    .update({ status: "sent" })
    .eq("id", record.id);

  return { success: true as const, emailId: record.id };
}

/**
 * Lifecycle email entrypoint used by emails.functions.ts.
 */
export async function sendLifecycleEmail(args: {
  userId: string;
  to: string;
  template: LifecycleTemplate;
  vars?: Record<string, unknown>;
}) {
  return sendEmail({
    to: args.to,
    template: args.template,
    data: args.vars ?? {},
    userId: args.userId,
  });
}

export async function sendWelcomeEmail(userId: string, _displayName: string, email: string) {
  return sendEmail({
    to: email,
    template: "welcome-5-credits",
    data: { displayName: _displayName },
    userId,
  });
}

export async function sendRenderCompleteEmail(
  userId: string,
  generationId: string,
  kind: string,
  duration?: number,
) {
  const { data: user } = await supabaseAdmin
    .from("profiles")
    .select("email, display_name")
    .eq("user_id", userId)
    .maybeSingle();
  if (!user?.email) return;
  return sendEmail({
    to: user.email,
    template: "render-complete",
    data: {
      displayName: user.display_name || "Creator",
      kind: kind === "video" ? "Video" : "Image",
      duration,
      generationId,
    },
    userId,
  });
}

export async function sendLowCreditNudge(userId: string) {
  const { data: user } = await supabaseAdmin
    .from("profiles")
    .select("email, display_name, credits")
    .eq("user_id", userId)
    .maybeSingle();
  if (!user?.email || !user.credits || user.credits > 5) return;
  return sendEmail({
    to: user.email,
    template: "low-credit-nudge",
    data: {
      displayName: user.display_name || "Creator",
      creditsRemaining: user.credits,
    },
    userId,
  });
}

export async function sendWeeklyDigest(userId: string) {
  const { data: user } = await supabaseAdmin
    .from("profiles")
    .select("email, display_name")
    .eq("user_id", userId)
    .maybeSingle();
  if (!user?.email) return;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: gens } = await supabaseAdmin
    .from("generations")
    .select("id, kind, status")
    .eq("user_id", userId)
    .gte("created_at", weekAgo);
  const counts = {
    images: gens?.filter((g) => g.kind === "image").length ?? 0,
    videos: gens?.filter((g) => g.kind === "video").length ?? 0,
    lipsyncs: gens?.filter((g) => g.kind === "lipsync").length ?? 0,
  };
  return sendEmail({
    to: user.email,
    template: "weekly-digest",
    data: { displayName: user.display_name || "Creator", ...counts },
    userId,
  });
}

export async function sendPaymentReceipt(
  userId: string,
  paymentId: string,
  amount: number,
  currency: string,
  creditsGranted: number,
) {
  const { data: user } = await supabaseAdmin
    .from("profiles")
    .select("email, display_name")
    .eq("user_id", userId)
    .maybeSingle();
  if (!user?.email) return;
  return sendEmail({
    to: user.email,
    template: "payment-receipt",
    data: {
      displayName: user.display_name || "Creator",
      amount: amount.toFixed(2),
      currency,
      creditsGranted,
      reference: paymentId,
    },
    userId,
  });
}

export async function sendGiftRedeemedEmail(
  userId: string,
  fromUser: string,
  creditsRedeemed: number,
) {
  const { data: user } = await supabaseAdmin
    .from("profiles")
    .select("email, display_name")
    .eq("user_id", userId)
    .maybeSingle();
  if (!user?.email) return;
  return sendEmail({
    to: user.email,
    template: "gift-redeemed",
    data: {
      displayName: user.display_name || "Creator",
      fromUser,
      creditsRedeemed,
    },
    userId,
  });
}
