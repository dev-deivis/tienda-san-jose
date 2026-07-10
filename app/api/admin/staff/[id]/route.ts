import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;
  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const body = await req.json() as {
    nombre?: string;
    email?: string;
    role?: string;
  };

  if (body.role && body.role !== 'STAFF' && body.role !== 'ADMIN') {
    return NextResponse.json({ error: 'role debe ser STAFF o ADMIN' }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(body.nombre !== undefined && { nombre: body.nombre?.trim() || null }),
        ...(body.email !== undefined && { email: body.email.trim().toLowerCase() }),
        ...(body.role !== undefined && { role: body.role as 'STAFF' | 'ADMIN' }),
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ...user, createdAt: user.createdAt.toISOString() });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'El email ya está en uso' }, { status: 409 });
    }
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
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
  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  // No puede eliminarse a sí mismo
  if (userId === session.userId) {
    return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta' }, { status: 403 });
  }

  try {
    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
