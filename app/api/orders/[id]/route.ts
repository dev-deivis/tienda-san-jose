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

  const order = await prisma.order.update({
    where: { id: Number(id) },
    data: { status: body.status },
    include: { user: { select: { email: true } } },
  });

  return NextResponse.json({
    ...order,
    total: parseFloat(order.total.toString()),
  });
}
