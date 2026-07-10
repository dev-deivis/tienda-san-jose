import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  const categories = await prisma.category.findMany({
    select: { id: true, nombre: true, slug: true },
    orderBy: { nombre: 'asc' },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const body = await req.json() as {
    nombre?: string;
    slug?: string;
    descripcion?: string;
    imagen?: string;
  };

  if (!body.nombre || !body.slug) {
    return NextResponse.json({ error: 'nombre y slug son requeridos' }, { status: 400 });
  }

  try {
    const category = await prisma.category.create({
      data: {
        nombre: body.nombre.trim(),
        slug: body.slug.trim(),
        descripcion: body.descripcion?.trim() || null,
        imagen: body.imagen?.trim() || null,
      },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'El slug ya existe' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error al crear categoría' }, { status: 500 });
  }
}
