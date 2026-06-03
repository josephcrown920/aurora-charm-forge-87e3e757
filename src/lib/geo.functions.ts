import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import type { Currency } from "./billing.plans";

// Detect the visitor's billing currency based on edge geo headers.
// Cloudflare sets `cf-ipcountry`; other providers use `x-vercel-ip-country`
// or `x-country`. Defaults to USD when unknown.
export const detectCurrency = createServerFn({ method: "GET" }).handler(async () => {
  const country =
    getRequestHeader("cf-ipcountry") ||
    getRequestHeader("x-vercel-ip-country") ||
    getRequestHeader("x-country") ||
    "";
  const cc = country.toUpperCase();
  const currency: Currency = cc === "NG" ? "NGN" : "USD";
  return { currency, country: cc || null };
});
