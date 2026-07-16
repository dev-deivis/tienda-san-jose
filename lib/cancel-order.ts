/**
 * cancel-order.ts
 *
 * Lógica compartida entre el endpoint PATCH /api/orders/[id] (staff/admin)
 * y el endpoint POST /api/orders/[id]/cancel (cliente).
 *
 * Ejecuta en este orden:
 *   1. Verifica que la orden sea cancelable (no cancelada, sin guía generada)
 *   2. Emite el reembolso en Stripe — si falla, aborta sin tocar la BD
 *   3. Actualiza el status y restaura el stock en una transacción atómica
 */
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export type CancelResult =
  | { ok: true }
  | { ok: false; code: 'ALREADY_CANCELLED' }
  | { ok: false; code: 'LABEL_EXISTS' }
  | { ok: false; code: 'NOT_FOUND' }
  | { ok: false; code: 'STRIPE_REFUND_FAILED'; cause: unknown };

/**
 * Cancela una orden, emite el reembolso de Stripe y restaura el stock.
 *
 * El llamante debe haber verificado permisos (rol o pertenencia al usuario)
 * antes de invocar esta función.
 */
export async function cancelOrderWithRefund(orderId: number): Promise<CancelResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      status: true,
      shippingAddress: true,
      labelUrl: true,
      trackingNumber: true,
      items: { select: { productId: true, cantidad: true } },
    },
  });

  if (!order) return { ok: false, code: 'NOT_FOUND' };
  if (order.status === 'cancelled') return { ok: false, code: 'ALREADY_CANCELLED' };
  if (order.labelUrl || order.trackingNumber) return { ok: false, code: 'LABEL_EXISTS' };

  // Extraer paymentIntentId almacenado como JSON dentro de shippingAddress
  let paymentIntentId: string | undefined;
  try {
    const parsed = JSON.parse(order.shippingAddress ?? '{}') as { paymentIntentId?: string };
    paymentIntentId = parsed.paymentIntentId;
  } catch {
    // shippingAddress no es JSON — continuar sin reembolso Stripe
  }

  // Emitir reembolso en Stripe antes de modificar la BD.
  // Si el reembolso falla, devolvemos error y la BD no se toca.
  if (paymentIntentId) {
    try {
      // Idempotencia: verificar si ya existe un reembolso para este PI
      const existing = await stripe.refunds.list({
        payment_intent: paymentIntentId,
        limit: 1,
      });
      if (existing.data.length === 0) {
        await stripe.refunds.create({ payment_intent: paymentIntentId });
        console.log(`[cancel-order] Reembolso emitido — orden #${orderId} PI: ${paymentIntentId}`);
      } else {
        console.log(`[cancel-order] Reembolso ya existía — orden #${orderId} PI: ${paymentIntentId}`);
      }
    } catch (cause) {
      console.error(`[cancel-order] Stripe refund FALLÓ — orden #${orderId}:`, cause);
      return { ok: false, code: 'STRIPE_REFUND_FAILED', cause };
    }
  }

  // Transacción atómica: actualizar status + restaurar stock de todos los items
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'cancelled' },
    });

    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.cantidad } },
      });
    }
  });

  console.log(
    `[cancel-order] Orden #${orderId} cancelada — stock restaurado (${order.items.length} producto(s))`
  );

  return { ok: true };
}
