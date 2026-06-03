// Geo-priced. USD globally, NGN locally (Nigeria).
// amount_minor is in the smallest currency unit (cents for USD, kobo for NGN).
export type Currency = "USD" | "NGN";

// Effective rate ~$0.125 / credit. NGN priced at ₦200 / credit (≈ ₦1,600/USD).
export const PLANS = {
  starter: {
    credits: 80,
    label: "Starter — 80 credits",
    usd: 10,
    ngn: 16000,
    prices: {
      USD: { amount_minor: 10_00,     display: "$10" },
      NGN: { amount_minor: 16_000_00, display: "₦16,000" },
    },
  },
  creator: {
    credits: 240,
    label: "Creator — 240 credits",
    usd: 30,
    ngn: 48000,
    prices: {
      USD: { amount_minor: 30_00,     display: "$30" },
      NGN: { amount_minor: 48_000_00, display: "₦48,000" },
    },
  },
  studio: {
    credits: 640,
    label: "Studio — 640 credits",
    usd: 80,
    ngn: 128000,
    prices: {
      USD: { amount_minor: 80_00,      display: "$80" },
      NGN: { amount_minor: 128_000_00, display: "₦128,000" },
    },
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function perCreditDisplay(plan: PlanKey, currency: Currency): string {
  const p = PLANS[plan];
  if (currency === "USD") return `$${(p.usd / p.credits).toFixed(3)} / credit`;
  return `₦${Math.round(p.ngn / p.credits)} / credit`;
}
