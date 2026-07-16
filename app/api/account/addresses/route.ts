import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const addresses = await prisma.address.findMany({
    where: { userId: session.userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  });

  return NextResponse.json(addresses);
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json() as {
    nombre: string;
    apellido: string;
    telefono: string;
    direccion1: string;
    direccion2?: string;
    ciudad: string;
    estado: string;
    codigoPostal: string;
    isDefault?: boolean;
  };

  // Validación básica de campos requeridos
  const required = ['nombre', 'apellido', 'telefono', 'direccion1', 'ciudad', 'estado', 'codigoPostal'] as const;
  for (const field of required) {
    if (!body[field]?.trim()) {
      return NextResponse.json({ error: `El campo "${field}" es obligatorio` }, { status: 400 });
    }
  }

  if (!/^\d{5}$/.test(body.codigoPostal.trim())) {
    return NextResponse.json({ error: 'El código postal debe tener 5 dígitos' }, { status: 400 });
  }

  const shouldBeDefault = body.isDefault ?? false;

  const address = await prisma.$transaction(async (tx) => {
    // Si esta dirección va a ser predeterminada, desmarcar las demás del usuario
    if (shouldBeDefault) {
      await tx.address.updateMany({
        where: { userId: session.userId },
        data: { isDefault: false },
      });
    }

    // Si es la primera dirección del usuario, hacerla default automáticamente
    const count = await tx.address.count({ where: { userId: session.userId } });
    const makeDefault = shouldBeDefault || count === 0;

    return tx.address.create({
      data: {
        userId: session.userId,
        nombre: body.nombre.trim(),
        apellido: body.apellido.trim(),
        telefono: body.telefono.trim(),
        direccion1: body.direccion1.trim(),
        direccion2: body.direccion2?.trim() || null,
        ciudad: body.ciudad.trim(),
        estado: body.estado.trim(),
        codigoPostal: body.codigoPostal.trim(),
        pais: 'US',
        isDefault: makeDefault,
      },
    });
  });

  return NextResponse.json(address, { status: 201 });
}
