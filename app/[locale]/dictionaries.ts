import 'server-only';
import esDict from '@/dictionaries/es.json';
import { isValidLocale, type Locale } from '@/i18n/routing';

export type Dictionary = typeof esDict;

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  es: () => import('@/dictionaries/es.json').then((m) => m as unknown as Dictionary),
  en: () => import('@/dictionaries/en.json').then((m) => m as unknown as Dictionary),
};

export { isValidLocale };
export type { Locale };

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}
