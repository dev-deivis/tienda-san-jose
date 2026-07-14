import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export type CreateOrderResult =
  | { created: true; orderId: number }
  | { created: false; orderId: number }
  | { created: false; orderId: null; reason: string };

/**
 * Crea un Order a partir de un PaymentIntent de Stripe.
 *
 * Es idempotente: si ya existe un Order asociado a este PaymentIntent
 * (detectado por `shippingAddress CONTAINS pi.id`), retorna el existente
 * sin crear duplicados.
 *
 * La verificación y creación ocurren dentro de una transacción para
 * reducir la ventana de condición de carrera entre el webhook y el
 * fallback de la página de confirmación.
 *
 * Usado por:
 *  - /app/api/webhooks/stripe/route.ts  (camino principal)
 *  - /app/(tienda)/checkout/confirmacion/page.tsx  (red de seguridad)
 */
export async function createOrderFromPaymentIntent(
  pi: Stripe.PaymentIntent
): Promise<CreateOrderResult> {
  const userId = parseInt(pi.metadata.userId ?? '0', 10);
  const itemsRaw = pi.metadata.items;

  if (!userId || !itemsRaw) {
    return {
      created: false,
      orderId: null,
      reason: 'Metadata incompleta en PaymentIntent (userId o items ausentes)',
    };
  }

  const items: Array<{ productId: number; cantidad: number; precio: number }> =
    JSON.parse(itemsRaw);

  const shippingCost = parseFloat(pi.metadata.shippingCost ?? '0');
  const shippingMethod = pi.metadata.shippingMethod ?? null;
  const shippoRateId = pi.metadata.shippoRateId || null;
  const customerAddressRaw = pi.metadata.customerAddress || null;
  const taxAmount = parseFloat(pi.metadata.taxAmount ?? '0');
  const taxCalculationId = pi.metadata.taxCalculationId || null;
  const subtotal = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
  const total = subtotal + shippingCost + taxAmount;
  const addressData = customerAddressRaw ? (JSON.parse(customerAddressRaw) as Record<string, unknown>) : {};

  // Registrar Tax Transaction en Stripe (para reportes de impuestos)
  if (taxCalculationId) {
    try {
      await stripe.tax.transactions.createFromCalculation({
        calculation: taxCalculationId,
        reference: pi.id,
      });
    } catch (err) {
      console.error('[create-order] Error creando Tax Transaction:', err);
      // No bloquear — el Order se crea igual
    }
  }

  // Transacción: verificar idempotencia + crear Order de forma atómica
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.order.findFirst({
      where: { shippingAddress: { contains: pi.id } },
      select: { id: true },
    });

    if (existing) {
      return { created: false as const, orderId: existing.id };
    }

    const order = await tx.order.create({
      data: {
        userId,
        status: 'processing',
        total,
        shippingCost,
        shippingMethod,
        shippoRateId,
        taxAmount,
        shippingAddress: JSON.stringify({ paymentIntentId: pi.id, ...addressData }),
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            cantidad: i.cantidad,
            precioUnitario: i.precio,
          })),
        },
      },
      select: { id: true },
    });

    // Limpiar el carrito del usuario en la BD
    await tx.cartItem.deleteMany({ where: { userId } });

    return { created: true as const, orderId: order.id };
  });

  if (result.created) {
    console.log(
      `[create-order] Order ${result.orderId} creado para usuario ${userId} (pi: ${pi.id})`
    );
  } else {
    console.log(
      `[create-order] Order ${result.orderId} ya existía para pi: ${pi.id} — sin duplicado`
    );
  }

  return result;
}
