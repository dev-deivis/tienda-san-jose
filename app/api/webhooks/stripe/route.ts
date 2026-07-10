import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
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
    const userId = parseInt(pi.metadata.userId ?? '0', 10);
    const itemsRaw = pi.metadata.items;

    if (!userId || !itemsRaw) {
      return NextResponse.json({ ok: true });
    }

    const items: Array<{ productId: number; cantidad: number; precio: number }> =
      JSON.parse(itemsRaw);

    const shippingCost = parseFloat(pi.metadata.shippingCost ?? '0');
    const shippingMethod = pi.metadata.shippingMethod ?? null;
    const taxAmount = parseFloat(pi.metadata.taxAmount ?? '0');
    const taxCalculationId = pi.metadata.taxCalculationId || null;

    // Registrar Tax Transaction en Stripe (para reportes de impuestos)
    if (taxCalculationId) {
      try {
        await stripe.tax.transactions.createFromCalculation({
          calculation: taxCalculationId,
          reference: pi.id,
        });
      } catch (err) {
        console.error('[stripe-tax] Error creando Tax Transaction:', err);
        // No bloquear — el Order se crea igual
      }
    }

    // Idempotencia: verificar si ya existe un Order para este PaymentIntent
    const existing = await prisma.order.findFirst({
      where: { shippingAddress: { contains: pi.id } },
    });
    if (existing) {
      return NextResponse.json({ ok: true });
    }

    const subtotal = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
    const total = subtotal + shippingCost + taxAmount;

    const order = await prisma.order.create({
      data: {
        userId,
        status: 'processing',
        total,
        shippingCost,
        shippingMethod,
        taxAmount,
        shippingAddress: JSON.stringify({ paymentIntentId: pi.id }),
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            cantidad: i.cantidad,
            precioUnitario: i.precio,
          })),
        },
      },
    });

    // Limpiar el carrito del usuario en la BD
    await prisma.cartItem.deleteMany({ where: { userId } });

    console.log(`[webhook] Order ${order.id} creado para usuario ${userId}`);
  }

  return NextResponse.json({ ok: true });
}
