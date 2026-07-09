import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = '7d';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: number, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(
  token: string
): { userId: number; role: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      role: string;
    };
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

/** Lee la cookie de sesión del request actual y retorna el payload del JWT. */
export async function getSessionUser(): Promise<{ userId: number; role: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return verifyToken(token);
}
