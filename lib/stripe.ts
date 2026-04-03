import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn(
    "[stripe] STRIPE_SECRET_KEY is not set — Stripe calls will fail. Add it to .env"
  );
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2025-01-27.acacia",
  typescript: true,
});

/** Convert dollars → Stripe cents (integer) */
export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Stripe line-item label per vehicle */
export const VEHICLE_DISPLAY: Record<string, string> = {
  SEDAN: "Sedan",
  SUV: "SUV",
  SPRINTER: "Sprinter Van",
  LIMO: "Limousine",
};
