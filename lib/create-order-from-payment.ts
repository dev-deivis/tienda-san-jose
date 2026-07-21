import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import {
  LOW_STOCK_THRESHOLD,
  sendOrderConfirmationEmail,
  sendNewOrderAdminEmail,
  sendLowStockAdminEmail,
} from '@/lib/email';

export type CreateOrderResult =
  | { created: true; orderId: number }
  | { created: false; orderId: number }
  | { created: false; orderId: null; reason: string };

/** Error interno lanzado cuando un producto no tiene stock suficiente.
 *  Al lanzarse dentro de la $transaction, Prisma hace rollback automático
 *  (ningún cambio de stock ni la orden quedan en la BD). */
class StockInsuficienteError extends Error {
  constructor(
    public readonly productId: number,
    public readonly productName: string,
    public readonly stockDisponible: number,
    public readonly cantidadSolicitada: number,
  ) {
    super(`Stock insuficiente para producto #${productId}`);
    this.name = 'StockInsuficienteError';
  }
}

/**
 * Crea un Order a partir de un PaymentIntent de Stripe.
 *
 * Es idempotente: si ya existe un Order asociado a este PaymentIntent
 * (detectado por `shippingAddress CONTAINS pi.id`), retorna el existente
 * sin crear duplicados.
 *
 * La verificación, el decremento de stock y la creación del Order ocurren
 * dentro de una sola $transaction — si cualquier producto no tiene stock
 * suficiente, toda la transacción hace rollback y se emite un reembolso
 * automático en Stripe para no cobrarle al cliente.
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
  const addressData = customerAddressRaw
    ? (JSON.parse(customerAddressRaw) as Record<string, unknown>)
    : {};

  // ─── Transacción principal ────────────────────────────────────────────────
  // Dentro de esta transacción ocurren en orden:
  //   1. Verificar idempotencia (evitar orden duplicada)
  //   2. Decrementar stock de cada producto (con condición stock >= cantidad)
  //   3. Crear el Order con sus OrderItems
  //   4. Limpiar el carrito del usuario
  //
  // Si el paso 2 falla para cualquier producto, toda la transacción hace
  // rollback: el stock queda intacto y la orden no se crea.
  // ─────────────────────────────────────────────────────────────────────────
  let result: CreateOrderResult;

  try {
    result = await prisma.$transaction(async (tx) => {
      // 1. Idempotencia: si ya existe una orden para este PaymentIntent, retornarla
      const existing = await tx.order.findFirst({
        where: { shippingAddress: { contains: pi.id } },
        select: { id: true },
      });
      if (existing) {
        return { created: false as const, orderId: existing.id };
      }

      // 2. Decrementar stock atómicamente.
      //    updateMany con WHERE stock >= cantidad garantiza que la condición
      //    se evalúa en la misma query SQL, sin ventana de race condition.
      //    Si count === 0, el producto no tenía stock suficiente → rollback.
      for (const item of items) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.cantidad } },
          data: { stock: { decrement: item.cantidad } },
        });

        if (updated.count === 0) {
          // Leer el stock real para incluirlo en el mensaje de error
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { nombre: true, stock: true },
          });
          throw new StockInsuficienteError(
            item.productId,
            product?.nombre ?? `producto #${item.productId}`,
            product?.stock ?? 0,
            item.cantidad,
          );
        }
      }

      // 3. Crear la orden
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

      // 4. Limpiar el carrito del usuario en la BD
      await tx.cartItem.deleteMany({ where: { userId } });

      return { created: true as const, orderId: order.id };
    });
  } catch (err) {
    if (err instanceof StockInsuficienteError) {
      // La transacción ya hizo rollback — el stock quedó intacto, la orden no existe.
      // Emitir reembolso automático para no dejar al cliente cobrado sin pedido.
      // Es idempotente: verifica si ya existe un reembolso antes de crear otro.
      try {
        const existingRefunds = await stripe.refunds.list({
          payment_intent: pi.id,
          limit: 1,
        });
        if (existingRefunds.data.length === 0) {
          await stripe.refunds.create({ payment_intent: pi.id });
          console.warn(
            `[create-order] Reembolso emitido — PI: ${pi.id} — "${err.productName}" ` +
            `(disponible: ${err.stockDisponible}, solicitado: ${err.cantidadSolicitada})`
          );
        } else {
          console.warn(
            `[create-order] Reembolso ya existía para PI: ${pi.id} — no se duplicó`
          );
        }
      } catch (refundErr) {
        // El reembolso falló — se loguea como error crítico para revisión manual
        console.error(
          `[create-order] CRÍTICO: No se pudo emitir reembolso para PI ${pi.id}:`,
          refundErr
        );
      }

      return {
        created: false,
        orderId: null,
        reason:
          `Sin stock suficiente para "${err.productName}" ` +
          `(disponible: ${err.stockDisponible}, solicitado: ${err.cantidadSolicitada})`,
      };
    }

    // Error inesperado — re-lanzar para que el webhook devuelva 500 a Stripe
    // (Stripe reintentará el webhook más tarde)
    throw err;
  }

  if (result.created) {
    console.log(
      `[create-order] Order ${result.orderId} creado para usuario ${userId} (pi: ${pi.id})`
    );

    // ── Registrar Tax Transaction en Stripe (para reportes de impuestos) ─────
    // Se hace DESPUÉS de confirmar que la orden existe en BD, para evitar
    // registros de impuestos huérfanos si el stock falló y se hizo rollback.
    if (taxCalculationId) {
      try {
        await stripe.tax.transactions.createFromCalculation({
          calculation: taxCalculationId,
          reference: pi.id,
        });
      } catch (err) {
        console.error('[create-order] Error creando Tax Transaction:', err);
        // No bloquear — la orden ya fue creada y el pago confirmado
      }
    }

    // ── Emails post-compra (fire-and-forget) ─────────────────────────────────
    // Los errores se manejan dentro de cada función de email — nunca bloquean
    // ni lanzan excepciones que puedan afectar el flujo principal.
    void (async () => {
      try {
        // Obtener datos completos del usuario y la orden para los templates
        const [user, order] = await Promise.all([
          prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, nombre: true },
          }),
          prisma.order.findUnique({
            where: { id: result.orderId },
            select: {
              total: true,
              shippingCost: true,
              taxAmount: true,
              shippingAddress: true,
              items: {
                select: {
                  cantidad: true,
                  precioUnitario: true,
                  product: { select: { nombre: true } },
                },
              },
            },
          }),
        ]);

        if (!user || !order) return;

        // Parsear la dirección de envío guardada como JSON
        let shippingAddress: Record<string, string> = {};
        try {
          shippingAddress = JSON.parse(order.shippingAddress ?? '{}') as Record<string, string>;
        } catch { /* dirección no parseável — continuar sin ella */ }

        const emailItems = order.items.map((i) => ({
          nombre: i.product.nombre,
          cantidad: i.cantidad,
          precioUnitario: parseFloat(i.precioUnitario.toString()),
        }));

        const total = parseFloat(order.total.toString());
        const shippingCost = parseFloat(order.shippingCost.toString());
        const taxAmount = parseFloat(order.taxAmount.toString());
        const subtotal = emailItems.reduce(
          (sum, i) => sum + i.precioUnitario * i.cantidad,
          0,
        );

        // Confirmación al cliente + notificación al admin (en paralelo)
        await Promise.all([
          sendOrderConfirmationEmail({
            to: user.email,
            customerName: user.nombre ?? null,
            orderId: result.orderId,
            items: emailItems,
            subtotal,
            shippingCost,
            taxAmount,
            total,
            shippingAddress,
          }),
          sendNewOrderAdminEmail({
            orderId: result.orderId,
            customerEmail: user.email,
            customerName: user.nombre ?? null,
            total,
            items: emailItems,
          }),
        ]);

        // ── Alerta de stock bajo ──────────────────────────────────────────────
        // Solo notificar cuando el stock CRUZA el umbral hacia abajo en esta
        // venta, no en cada compra si ya estaba bajo desde antes.
        const productIds = items.map((i) => i.productId);
        const products = await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, nombre: true, stock: true },
        });

        for (const item of items) {
          const product = products.find((p) => p.id === item.productId);
          if (!product) continue;
          const stockAfter = product.stock;                    // ya decrementado en la transacción
          const stockBefore = stockAfter + item.cantidad;     // stock antes de esta venta
          if (stockAfter < LOW_STOCK_THRESHOLD && stockBefore >= LOW_STOCK_THRESHOLD) {
            await sendLowStockAdminEmail({
              productId: product.id,
              nombre: product.nombre,
              stock: stockAfter,
            });
          }
        }
      } catch (emailErr) {
        console.error('[create-order] Error en emails post-compra:', emailErr);
      }
    })();
  } else if (result.orderId !== null) {
    console.log(
      `[create-order] Order ${result.orderId} ya existía para pi: ${pi.id} — sin duplicado`
    );
  }

  return result;
}
