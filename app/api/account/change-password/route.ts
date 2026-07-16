import { NextResponse } from 'next/server';
import { getSessionUser, comparePassword, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 });
  }

  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'PASSWORD_TOO_SHORT' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { password: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });
  }

  const matches = await comparePassword(currentPassword, user.password);
  if (!matches) {
    return NextResponse.json({ error: 'WRONG_PASSWORD' }, { status: 400 });
  }

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: session.userId },
    data: { password: hashed },
  });

  return NextResponse.json({ ok: true });
}
