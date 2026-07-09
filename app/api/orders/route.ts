import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  const session = await getSessionUser();
  if (!session || (session.role !== 'STAFF' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const orders = await prisma.order.findMany({
    include: {
      user: { select: { email: true, nombre: true } },
      items: {
        include: {
          product: { select: { nombre: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const serialized = orders.map((o) => ({
    ...o,
    total: parseFloat(o.total.toString()),
    items: o.items.map((item) => ({
      ...item,
      precioUnitario: parseFloat(item.precioUnitario.toString()),
    })),
  }));

  return NextResponse.json(serialized);
}
