import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id: Number(id) },
    include: { category: { select: { id: true, nombre: true, slug: true } } },
  });

  if (!product) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ ...product, precio: parseFloat(product.precio.toString()) });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session || (session.role !== 'STAFF' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json() as {
    nombre?: string;
    descripcion?: string | null;
    precio?: number;
    stock?: number;
    categoryId?: number;
    imagen?: string;
    attributes?: Record<string, string> | null;
  };

  const data: Record<string, unknown> = {};
  if (body.nombre !== undefined) data.nombre = body.nombre;
  if (body.descripcion !== undefined) data.descripcion = body.descripcion;
  if (body.precio !== undefined) data.precio = body.precio;
  if (body.stock !== undefined) data.stock = body.stock;
  if (body.categoryId !== undefined) data.categoryId = Number(body.categoryId);
  if (body.imagen !== undefined) data.imagen = body.imagen;
  if (body.attributes !== undefined) data.attributes = body.attributes ?? null;

  const product = await prisma.product.update({
    where: { id: Number(id) },
    data,
    include: { category: { select: { id: true, nombre: true, slug: true } } },
  });

  return NextResponse.json({ ...product, precio: parseFloat(product.precio.toString()) });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session || (session.role !== 'STAFF' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;

  await prisma.product.delete({ where: { id: Number(id) } });

  return NextResponse.json({ ok: true });
}
