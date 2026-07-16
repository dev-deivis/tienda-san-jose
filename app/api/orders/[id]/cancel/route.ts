import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { cancelOrderWithRefund } from '@/lib/cancel-order';

type Params = { params: Promise<{ id: string }> };

const CANCELLABLE_STATUSES = ['pending', 'processing'];

export async function POST(_req: Request, { params }: Params) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { id } = await params;
  const orderId = Number(id);

  // Cargar lo mínimo necesario para verificar permisos y condición de cancelación
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      userId: true,
      status: true,
      labelUrl: true,
      trackingNumber: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  // Solo el dueño del pedido puede cancelarlo desde esta ruta
  if (order.userId !== session.userId) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  // Validar estado: solo 'pending' o 'processing' son cancelables por el cliente
  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    return NextResponse.json({ error: 'NOT_CANCELLABLE' }, { status: 400 });
  }

  // Bloquear si ya hay guía generada (aunque el status no sea 'shipped')
  if (order.labelUrl || order.trackingNumber) {
    return NextResponse.json({ error: 'LABEL_EXISTS' }, { status: 400 });
  }

  // Delegar la cancelación al helper compartido (reembolso Stripe + transacción BD)
  const result = await cancelOrderWithRefund(orderId);

  if (!result.ok) {
    if (result.code === 'ALREADY_CANCELLED') {
      // El pedido ya estaba cancelado — consideramos esto éxito idempotente
      return NextResponse.json({ ok: true });
    }
    if (result.code === 'STRIPE_REFUND_FAILED') {
      return NextResponse.json({ error: 'STRIPE_REFUND_FAILED' }, { status: 502 });
    }
    // LABEL_EXISTS y NOT_FOUND ya los filtramos arriba; por si acaso:
    return NextResponse.json({ error: result.code }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
