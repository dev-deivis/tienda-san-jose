import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';
import { cookies } from 'next/headers';

const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 días en segundos

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, nombre } = body as {
      email?: string;
      password?: string;
      nombre?: string;
    };

    if (!email || !password || !nombre) {
      return NextResponse.json(
        { error: 'email, password y nombre son obligatorios' },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con ese email' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nombre,
        role: 'CUSTOMER',
      },
      select: { id: true, email: true, nombre: true, role: true, createdAt: true },
    });

    const token = generateToken(user.id, user.role);

    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
