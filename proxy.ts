import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { isValidLocale, detectLocale } from '@/i18n/routing';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('session')?.value ?? null;
  const payload = token ? verifyToken(token) : null;

  // ── Auth: rutas protegidas ────────────────────────────────────────────────

  // /admin/* → solo ADMIN
  if (pathname.startsWith('/admin')) {
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // /staff/* → STAFF o ADMIN
  if (pathname.startsWith('/staff')) {
    if (!payload || (payload.role !== 'STAFF' && payload.role !== 'ADMIN')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // ── i18n: detección de locale ─────────────────────────────────────────────
  // Admin y staff tienen sus propios root layouts — no necesitan prefijo de locale
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/staff')) {
    const firstSegment = pathname.split('/')[1];
    if (!isValidLocale(firstSegment)) {
      // Preferencia manual del usuario (cookie) tiene prioridad sobre Accept-Language
      const preferredCookie = request.cookies.get('preferred_locale')?.value ?? null;
      const locale =
        preferredCookie && isValidLocale(preferredCookie)
          ? preferredCookie
          : detectLocale(request.headers.get('accept-language'));
      request.nextUrl.pathname = `/${locale}${pathname}`;
      return NextResponse.redirect(request.nextUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon|api/|admin|staff|.*\\..*).*)', '/admin/:path*', '/staff/:path*'],
};
