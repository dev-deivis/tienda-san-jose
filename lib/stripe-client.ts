import { loadStripe } from '@stripe/stripe-js';

// Cliente Stripe solo para el navegador — NUNCA importar STRIPE_SECRET_KEY aquí
let stripePromise: ReturnType<typeof loadStripe> | null = null;

export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''
    );
  }
  return stripePromise;
}
