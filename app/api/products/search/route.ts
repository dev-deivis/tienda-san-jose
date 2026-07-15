import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MAX_RESULTS = 8;

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { nombre: { contains: q } },
        { descripcion: { contains: q } },
      ],
    },
    select: {
      id: true,
      nombre: true,
      precio: true,
      imagen: true,
      images: {
        take: 1,
        orderBy: { orden: 'asc' },
        select: { url: true },
      },
    },
    take: MAX_RESULTS,
    orderBy: { nombre: 'asc' },
  });

  const serialized = products.map((p) => ({
    ...p,
    precio: parseFloat(p.precio.toString()),
  }));

  return NextResponse.json(serialized);
}
