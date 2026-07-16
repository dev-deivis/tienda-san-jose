import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const addressId = parseInt(id, 10);
  if (isNaN(addressId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  // Verificar que la dirección pertenece al usuario
  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId: session.userId },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Dirección no encontrada' }, { status: 404 });
  }

  const body = await req.json() as {
    nombre?: string;
    apellido?: string;
    telefono?: string;
    direccion1?: string;
    direccion2?: string | null;
    ciudad?: string;
    estado?: string;
    codigoPostal?: string;
    isDefault?: boolean;
  };

  if (body.codigoPostal !== undefined && !/^\d{5}$/.test(body.codigoPostal.trim())) {
    return NextResponse.json({ error: 'El código postal debe tener 5 dígitos' }, { status: 400 });
  }

  const address = await prisma.$transaction(async (tx) => {
    // Si se marca como default, desmarcar las demás
    if (body.isDefault === true) {
      await tx.address.updateMany({
        where: { userId: session.userId, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    return tx.address.update({
      where: { id: addressId },
      data: {
        ...(body.nombre !== undefined && { nombre: body.nombre.trim() }),
        ...(body.apellido !== undefined && { apellido: body.apellido.trim() }),
        ...(body.telefono !== undefined && { telefono: body.telefono.trim() }),
        ...(body.direccion1 !== undefined && { direccion1: body.direccion1.trim() }),
        ...(body.direccion2 !== undefined && { direccion2: body.direccion2?.trim() || null }),
        ...(body.ciudad !== undefined && { ciudad: body.ciudad.trim() }),
        ...(body.estado !== undefined && { estado: body.estado.trim() }),
        ...(body.codigoPostal !== undefined && { codigoPostal: body.codigoPostal.trim() }),
        ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
      },
    });
  });

  return NextResponse.json(address);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const addressId = parseInt(id, 10);
  if (isNaN(addressId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId: session.userId },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Dirección no encontrada' }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.address.delete({ where: { id: addressId } });

    // Si era la default, promover la más reciente como nueva default
    if (existing.isDefault) {
      const next = await tx.address.findFirst({
        where: { userId: session.userId },
        orderBy: { createdAt: 'asc' },
      });
      if (next) {
        await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    }
  });

  return NextResponse.json({ ok: true });
}
