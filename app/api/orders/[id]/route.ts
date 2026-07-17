import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { cancelOrderWithRefund } from '@/lib/cancel-order';
import { sendOrderShippedEmail, sendOrderDeliveredEmail } from '@/lib/email';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session || (session.role !== 'STAFF' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json() as { status: string };

  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!body.status || !validStatuses.includes(body.status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
  }

  // --- Cancelación: delegar al helper que incluye reembolso Stripe + stock ---
  if (body.status === 'cancelled') {
    const result = await cancelOrderWithRefund(Number(id));

    if (!result.ok) {
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
      }
      if (result.code === 'ALREADY_CANCELLED') {
        // Idempotente: devolvemos el pedido tal cual
        const order = await prisma.order.findUnique({
          where: { id: Number(id) },
          include: { user: { select: { email: true } } },
        });
        return NextResponse.json({ ...order, total: parseFloat(order!.total.toString()) });
      }
      if (result.code === 'LABEL_EXISTS') {
        return NextResponse.json(
          { error: 'LABEL_EXISTS', message: 'No se puede cancelar: ya se generó la guía de envío.' },
          { status: 400 }
        );
      }
      if (result.code === 'STRIPE_REFUND_FAILED') {
        return NextResponse.json(
          { error: 'STRIPE_REFUND_FAILED', message: 'El reembolso de Stripe falló. El pedido NO fue cancelado.' },
          { status: 502 }
        );
      }
    }

    // Éxito: devolver la orden actualizada
    const updated = await prisma.order.findUnique({
      where: { id: Number(id) },
      include: { user: { select: { email: true } } },
    });
    return NextResponse.json({ ...updated, total: parseFloat(updated!.total.toString()) });
  }

  // --- Cambio de status normal (no cancelación) ---
  const currentOrder = await prisma.order.findUnique({
    where: { id: Number(id) },
    select: { status: true },
  });

  if (!currentOrder) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
  }

  // Bloquear "revival": una orden cancelada no puede cambiar a otro estado.
  // Si en el futuro se necesita reactivar una orden, se implementará como
  // un proceso explícito con su propia ruta y lógica de negocio.
  if (currentOrder.status === 'cancelled') {
    return NextResponse.json(
      { error: 'ORDER_ALREADY_CANCELLED', message: 'Una orden cancelada no puede cambiar a otro estado.' },
      { status: 400 }
    );
  }

  const order = await prisma.order.update({
    where: { id: Number(id) },
    data: { status: body.status },
    include: {
      user: { select: { email: true, nombre: true } },
    },
  });

  // ── Emails por cambio manual de estado (solo cuando el estado realmente cambia) ──
  // Se guarda que currentOrder.status ya fue cargado arriba y no era 'cancelled'.
  if (body.status === 'shipped' && currentOrder.status !== 'shipped') {
    void sendOrderShippedEmail({
      to: order.user.email,
      customerName: order.user.nombre ?? null,
      orderId: Number(id),
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
    });
  } else if (body.status === 'delivered' && currentOrder.status !== 'delivered') {
    void sendOrderDeliveredEmail({
      to: order.user.email,
      customerName: order.user.nombre ?? null,
      orderId: Number(id),
    });
  }

  return NextResponse.json({
    ...order,
    total: parseFloat(order.total.toString()),
  });
}
