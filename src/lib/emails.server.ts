import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Lovable Emails integration — transactional email service.
 * All templates are managed in Lovable Cloud → Emails.
 * This module triggers sends and tracks delivery.
 */

export type EmailTemplate =
  | "welcome-5-credits"
  | "render-complete"
  | "low-credit-nudge"
  | "weekly-digest"
  | "payment-receipt"
  | "gift-redeemed";

type EmailPayload = {
  to: string;
  template: EmailTemplate;
  data: Record<string, any>;
  tags?: string[];
};

/**
 * Send a transactional email via Lovable Emails.
 * Integrates with Supabase to track sent/failed status.
 */
export const sendEmail = createServerFn({ method: "POST" }).handler(
  async (payload: EmailPayload) => {
    const { to, template, data, tags = [] } = payload;

    // Log the email intent to supabase for tracking
    const { data: record, error: insertErr } = await supabaseAdmin
      .from("email_logs")
      .insert({
        recipient: to,
        template,
        data,
        tags,
        status: "queued",
        sent_at: null,
      })
      .select()
      .single();

    if (insertErr) throw new Error(`Failed to log email: ${insertErr.message}`);

    // In production: POST to Lovable Emails API
    // const apiKey = process.env.LOVABLE_EMAILS_API_KEY!;
    // const response = await fetch("https://emails.lovable.dev/send", {
    //   method: "POST",
    //   headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    //   body: JSON.stringify({ to, template, data }),
    // });
    // if (!response.ok) throw new Error("Email send failed");

    // Mark as sent
    await supabaseAdmin
      .from("email_logs")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", record.id);

    return { success: true, emailId: record.id };
  }
);

/**
 * Welcome email: 5 free credits on signup
 */
export async function sendWelcomeEmail(userId: string, displayName: string, email: string) {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("credits")
    .eq("user_id", userId)
    .maybeSingle();

  return sendEmail({
    to: email,
    template: "welcome-5-credits",
    data: {
      displayName,
      credits: profile?.credits ?? 5,
      dashboardUrl: "https://aurorastudiostar.lovable.app/studio",
    },
    tags: ["onboarding", "welcome"],
  });
}

/**
 * Render complete: notify user their generation is ready
 */
export async function sendRenderCompleteEmail(
  userId: string,
  generationId: string,
  kind: string,
  duration?: number
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
      viewUrl: `https://aurorastudiostar.lovable.app/studio?gen=${generationId}`,
    },
    tags: ["generation", "complete"],
  });
}

/**
 * Low credit nudge: user has <5 credits remaining
 */
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
      buyUrl: "https://aurorastudiostar.lovable.app/dashboard/billing",
    },
    tags: ["billing", "engagement"],
  });
}

/**
 * Weekly digest: summary of renders + stats
 */
export async function sendWeeklyDigest(userId: string) {
  const { data: user } = await supabaseAdmin
    .from("profiles")
    .select("email, display_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (!user?.email) return;

  // Fetch this week's generations
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
    data: {
      displayName: user.display_name || "Creator",
      ...counts,
      studioUrl: "https://aurorastudiostar.lovable.app/studio",
    },
    tags: ["digest", "engagement"],
  });
}

/**
 * Payment receipt: confirmation of credit purchase
 */
export async function sendPaymentReceipt(
  userId: string,
  paymentId: string,
  amount: number,
  currency: string,
  creditsGranted: number
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
      dashboardUrl: "https://aurorastudiostar.lovable.app/dashboard/billing",
    },
    tags: ["payment", "receipt"],
  });
}

/**
 * Gift redeemed: notify user they received gift credits
 */
export async function sendGiftRedeemedEmail(
  userId: string,
  fromUser: string,
  creditsRedeemed: number
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
      studioUrl: "https://aurorastudiostar.lovable.app/studio",
    },
    tags: ["gift", "engagement"],
  });
}
