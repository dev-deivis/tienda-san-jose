import Stripe from "stripe";
import { loadStripe } from "@stripe/stripe-js";

// Cliente Stripe server-side (solo usar en Server Components / API Routes)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-06-24.dahlia",
});

// Cliente Stripe client-side (singleton para evitar múltiples instancias)
let stripePromise: ReturnType<typeof loadStripe> | null = null;

export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");
  }
  return stripePromise;
}
