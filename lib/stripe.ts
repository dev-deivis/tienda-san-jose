import Stripe from "stripe";

// Cliente Stripe server-side — SOLO usar en Server Components / API Routes
// NUNCA importar este archivo desde un Client Component ('use client')
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-06-24.dahlia",
});
