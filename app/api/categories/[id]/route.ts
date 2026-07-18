import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

// Invalida el caché del home y del listado de categorías en ambos locales.
function revalidateHomePage() {
  revalidatePath('/es');
  revalidatePath('/en');
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const categoryId = parseInt(id, 10);
  if (isNaN(categoryId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { _count: { select: { products: true } } },
  });

  if (!category) {
    return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
  }

  return NextResponse.json(category);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;
  const categoryId = parseInt(id, 10);
  if (isNaN(categoryId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const body = await req.json() as {
    nombre?: string;
    slug?: string;
    descripcion?: string;
    imagen?: string;
  };

  try {
    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(body.nombre !== undefined && { nombre: body.nombre.trim() }),
        ...(body.slug !== undefined && { slug: body.slug.trim() }),
        ...(body.descripcion !== undefined && { descripcion: body.descripcion?.trim() || null }),
        ...(body.imagen !== undefined && { imagen: body.imagen?.trim() || null }),
      },
    });
    revalidateHomePage();
    return NextResponse.json(category);
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'El slug ya existe' }, { status: 409 });
    }
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Error al actualizar categoría' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;
  const categoryId = parseInt(id, 10);
  if (isNaN(categoryId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  // Verificar si tiene productos asociados
  const count = await prisma.product.count({ where: { categoryId } });
  if (count > 0) {
    return NextResponse.json(
      { error: `No se puede eliminar: la categoría tiene ${count} producto(s) asociado(s).`, productCount: count },
      { status: 409 }
    );
  }

  try {
    await prisma.category.delete({ where: { id: categoryId } });
    revalidateHomePage();
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Error al eliminar categoría' }, { status: 500 });
  }
}
