import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json() as { nombre?: string; phone?: string };

  const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : undefined;
  const phone = typeof body.phone === 'string' ? body.phone.trim() : undefined;

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: {
      ...(nombre !== undefined && { nombre: nombre || null }),
      ...(phone !== undefined && { phone: phone || null }),
    },
    select: { id: true, email: true, nombre: true, phone: true },
  });

  return NextResponse.json({ user });
}
