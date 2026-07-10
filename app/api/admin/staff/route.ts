import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, hashPassword } from '@/lib/auth';

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const staffUsers = await prisma.user.findMany({
    where: { role: { in: ['STAFF', 'ADMIN'] } },
    select: {
      id: true,
      nombre: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const serialized = staffUsers.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return NextResponse.json(serialized);
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const body = await req.json() as {
    nombre?: string;
    email?: string;
    password?: string;
    role?: string;
  };

  if (!body.email || !body.password || !body.role) {
    return NextResponse.json({ error: 'email, password y role son requeridos' }, { status: 400 });
  }

  if (body.role !== 'STAFF' && body.role !== 'ADMIN') {
    return NextResponse.json({ error: 'role debe ser STAFF o ADMIN' }, { status: 400 });
  }

  const hashedPassword = await hashPassword(body.password);

  try {
    const user = await prisma.user.create({
      data: {
        email: body.email.trim().toLowerCase(),
        password: hashedPassword,
        nombre: body.nombre?.trim() || null,
        role: body.role as 'STAFF' | 'ADMIN',
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ...user, createdAt: user.createdAt.toISOString() }, { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'El email ya está en uso' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error al crear el usuario' }, { status: 500 });
  }
}
