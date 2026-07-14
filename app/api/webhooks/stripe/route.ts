import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createOrderFromPaymentIntent } from '@/lib/create-order-from-payment';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // IMPORTANTE: leer el body como texto plano para que la firma sea valida
  const body = await req.text();
  const headerStore = await headers();
  const sig = headerStore.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Sin firma Stripe' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Firma invalida';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    await createOrderFromPaymentIntent(pi);
  }

  return NextResponse.json({ ok: true });
}
