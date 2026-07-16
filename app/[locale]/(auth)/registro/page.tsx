import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDictionary, isValidLocale } from '@/app/[locale]/dictionaries';
import { RegistroClient } from './registro-client';
import { SITE_URL } from '@/i18n/routing';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = await getDictionary(locale);

  return {
    title: dict.auth.registerTitle,
    description: dict.auth.registerSubtitle,
    alternates: {
      canonical: `${SITE_URL}/es/registro`,
      languages: {
        es: `${SITE_URL}/es/registro`,
        en: `${SITE_URL}/en/registro`,
        'x-default': `${SITE_URL}/es/registro`,
      },
    },
  };
}

export default async function RegistroPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return <RegistroClient dict={dict.auth} locale={locale} />;
}
