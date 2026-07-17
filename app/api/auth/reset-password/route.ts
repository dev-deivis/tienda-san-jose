import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = typeof body?.token === 'string' ? body.token.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token y nueva contraseña son obligatorios.' },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres.' },
        { status: 400 },
      );
    }

    // Buscar el token en base de datos
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    // Validar: existe, no está usado, no expiró
    if (
      !resetToken ||
      resetToken.usedAt !== null ||
      resetToken.expiresAt < new Date()
    ) {
      return NextResponse.json(
        { error: 'El link de recuperación es inválido, ya fue usado o expiró.' },
        { status: 400 },
      );
    }

    const hashed = await hashPassword(password);

    // Actualizar contraseña y marcar token como usado en una transacción
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashed },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ message: 'Contraseña actualizada correctamente.' });
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 },
    );
  }
}
