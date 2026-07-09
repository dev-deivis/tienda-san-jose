import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('session')?.value ?? null;
  const payload = token ? verifyToken(token) : null;

  // Rutas protegidas: /admin/* → solo ADMIN
  if (pathname.startsWith('/admin')) {
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Rutas protegidas: /staff/* → STAFF o ADMIN
  if (pathname.startsWith('/staff')) {
    if (!payload || (payload.role !== 'STAFF' && payload.role !== 'ADMIN')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/staff/:path*'],
};
