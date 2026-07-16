'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { Locale } from '@/i18n/routing';

const COOKIE_NAME = 'preferred_locale';
const ONE_YEAR = 60 * 60 * 24 * 365;

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(newLocale: Locale) {
    if (newLocale === locale) return;

    // Reemplazar el primer segmento de ruta con el nuevo locale
    // ej. /es/categoria/rosarios → /en/categoria/rosarios
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPath = segments.join('/');

    // Guardar preferencia (1 año, ruta raíz, SameSite=Lax)
    document.cookie = `${COOKIE_NAME}=${newLocale}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`;

    router.push(newPath);
  }

  return (
    <div
      className="flex items-center"
      aria-label={locale === 'es' ? 'Cambiar idioma' : 'Change language'}
    >
      <button
        onClick={() => switchTo('es')}
        className={`px-2 py-1 text-xs font-semibold tracking-widest transition-colors ${
          locale === 'es'
            ? 'text-brand-purple'
            : 'text-gray-400 hover:text-brand-purple'
        }`}
      >
        ES
      </button>
      <span className="text-gray-300 select-none text-xs leading-none">|</span>
      <button
        onClick={() => switchTo('en')}
        className={`px-2 py-1 text-xs font-semibold tracking-widest transition-colors ${
          locale === 'en'
            ? 'text-brand-purple'
            : 'text-gray-400 hover:text-brand-purple'
        }`}
      >
        EN
      </button>
    </div>
  );
}
