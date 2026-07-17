import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import { SITE_URL } from '@/i18n/routing';

// El token expira en 1 hora
const TOKEN_TTL_MS = 60 * 60 * 1000;

// Respuesta genérica de éxito (no revela si el email existe)
const SUCCESS_RESPONSE = NextResponse.json({
  message: 'Si el correo existe, recibirás un link para restablecer tu contraseña.',
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email) {
      return NextResponse.json({ error: 'El email es obligatorio.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Si el usuario no existe respondemos igual de todos modos (seguridad)
    if (!user) return SUCCESS_RESPONSE;

    // Solo aplica a clientes
    if (user.role !== 'CUSTOMER') return SUCCESS_RESPONSE;

    // Generar token criptográficamente seguro
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    // Guardar en base de datos (puede haber múltiples tokens activos; el más
    // reciente es el válido que se usa en el correo)
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    // Construir link de recuperación con el locale predeterminado (es)
    const resetUrl = `${SITE_URL}/es/recuperar-contrasena/${token}`;

    await sendPasswordResetEmail({ to: user.email, resetUrl });

    return SUCCESS_RESPONSE;
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 },
    );
  }
}
