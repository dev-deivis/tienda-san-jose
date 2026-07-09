import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  const products = await prisma.product.findMany({
    include: { category: { select: { id: true, nombre: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const serialized = products.map((p) => ({
    ...p,
    precio: parseFloat(p.precio.toString()),
  }));

  return NextResponse.json(serialized);
}

export async function POST(request: NextRequest) {
  const session = await getSessionUser();
  if (!session || (session.role !== 'STAFF' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const body = await request.json() as {
    nombre: string;
    descripcion?: string;
    precio: number;
    stock?: number;
    categoryId: number;
    imagen?: string;
  };

  const { nombre, descripcion, precio, stock, categoryId, imagen } = body;

  if (!nombre || precio == null || !categoryId) {
    return NextResponse.json(
      { error: 'Campos requeridos: nombre, precio, categoryId' },
      { status: 400 }
    );
  }

  const product = await prisma.product.create({
    data: {
      nombre,
      descripcion: descripcion ?? null,
      precio,
      stock: stock ?? 0,
      categoryId: Number(categoryId),
      imagen: imagen ?? null,
    },
    include: { category: { select: { id: true, nombre: true, slug: true } } },
  });

  return NextResponse.json(
    { ...product, precio: parseFloat(product.precio.toString()) },
    { status: 201 }
  );
}
