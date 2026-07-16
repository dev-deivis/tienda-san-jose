import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

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

  // Cargar la orden actual con su status previo y sus items
  // para poder tomar decisiones sobre el stock antes de modificar nada.
  const currentOrder = await prisma.order.findUnique({
    where: { id: Number(id) },
    select: {
      status: true,
      items: { select: { productId: true, cantidad: true } },
    },
  });

  if (!currentOrder) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
  }

  const isCancelling = body.status === 'cancelled';
  const wasAlreadyCancelled = currentOrder.status === 'cancelled';

  // Ejecutar el cambio de status y (si aplica) la restauración de stock
  // dentro de una sola transacción para que ambas operaciones sean atómicas.
  const order = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: Number(id) },
      data: { status: body.status },
      include: { user: { select: { email: true } } },
    });

    // Restaurar stock SOLO si:
    //   • El nuevo status es 'cancelled' (estamos cancelando la orden)
    //   • El status anterior NO era 'cancelled' (idempotencia: evitar restaurar dos veces)
    if (isCancelling && !wasAlreadyCancelled) {
      for (const item of currentOrder.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.cantidad } },
        });
      }
      console.log(
        `[orders] Stock restaurado — orden #${id} cancelada ` +
        `(${currentOrder.items.length} producto(s))`
      );
    }

    return updated;
  });

  return NextResponse.json({
    ...order,
    total: parseFloat(order.total.toString()),
  });
}
