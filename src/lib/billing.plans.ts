// USD-only pricing. amount_minor = cents.
// 60/40 split: 40% of paid value returns to the user as credits at $0.05/credit list price.
export const PLANS: Record<string, { credits: number; amount_minor: number; currency: "USD"; label: string; usd: number }> = {
  starter: { credits: 80,  amount_minor: 10_00, currency: "USD", usd: 10, label: "Starter — 80 credits" },
  creator: { credits: 240, amount_minor: 30_00, currency: "USD", usd: 30, label: "Creator — 240 credits" },
  studio:  { credits: 640, amount_minor: 80_00, currency: "USD", usd: 80, label: "Studio — 640 credits" },
};