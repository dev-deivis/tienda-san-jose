import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { isValidLocale, detectLocale } from '@/i18n/routing';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('session')?.value ?? null;
  const payload = token ? verifyToken(token) : null;

  // ── Auth: rutas protegidas ────────────────────────────────────────────────
  // Determinar locale para los redirects de auth (cookie > Accept-Language)
  const preferredCookie = request.cookies.get('preferred_locale')?.value ?? null;
  const locale =
    preferredCookie && isValidLocale(preferredCookie)
      ? preferredCookie
      : detectLocale(request.headers.get('accept-language'));

  // Detectar requests RSC del App Router cliente (Accept: text/x-component).
  // Para esas requests, un HTTP redirect normal preserva los headers RSC → el
  // destino devuelve RSC payload → el router no puede reconciliar layouts
  // distintos (admin vs locale) → muestra payload crudo en el navegador.
  // Fix: devolver Content-Type text/html (no-flight) → el router detecta
  // !isFlightResponse y hace MPA navigation (full page reload sin RSC headers)
  // → el proxy lo trata como carga normal → 307 → /es/login → HTML limpio.
  const isRSC = (request.headers.get('accept') ?? '').includes('text/x-component');

  const authRedirect = (url: string) =>
    isRSC
      ? new Response(null, { status: 200, headers: { 'Content-Type': 'text/html' } })
      : NextResponse.redirect(new URL(url, request.url));

  // /admin/* → solo ADMIN
  if (pathname.startsWith('/admin')) {
    if (!payload || payload.role !== 'ADMIN') {
      return authRedirect(`/${locale}/login`);
    }
  }

  // /staff/* → STAFF o ADMIN
  if (pathname.startsWith('/staff')) {
    if (!payload || (payload.role !== 'STAFF' && payload.role !== 'ADMIN')) {
      return authRedirect(`/${locale}/login`);
    }
  }

  // ── i18n: detección de locale ─────────────────────────────────────────────
  // Admin y staff tienen sus propios root layouts — no necesitan prefijo de locale
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/staff')) {
    const firstSegment = pathname.split('/')[1];
    if (!isValidLocale(firstSegment)) {
      request.nextUrl.pathname = `/${locale}${pathname}`;
      return NextResponse.redirect(request.nextUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon|api/|admin|staff|.*\\..*).*)', '/admin/:path*', '/staff/:path*'],
};
