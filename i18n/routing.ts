export const locales = ['es', 'en'] as const;
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tiendasanjose.com';
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'es';

/** Devuelve true si el string es un locale soportado */
export function isValidLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/**
 * Detecta el locale preferido a partir del header Accept-Language.
 * Soporta 'en', 'en-US', 'en-GB', etc. → 'en'
 * Todo lo demás → defaultLocale ('es')
 */
export function detectLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  // Parsear el header: "en-US,en;q=0.9,es;q=0.8" → ['en-US', 'en', 'es']
  const preferred = acceptLanguage
    .split(',')
    .map((part) => part.split(';')[0].trim().toLowerCase());

  for (const lang of preferred) {
    // Coincidencia exacta o por prefijo (ej. 'en-US' → 'en')
    const match = (locales as readonly string[]).find(
      (l) => lang === l || lang.startsWith(`${l}-`)
    );
    if (match) return match as Locale;
  }

  return defaultLocale;
}
