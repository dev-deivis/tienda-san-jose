import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { getDictionary, isValidLocale } from '@/app/[locale]/dictionaries';
import { LoginClient } from './login-client';
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
    title: dict.auth.loginTitle,
    description: dict.auth.loginSubtitle,
    alternates: {
      canonical: `${SITE_URL}/es/login`,
      languages: {
        es: `${SITE_URL}/es/login`,
        en: `${SITE_URL}/en/login`,
        'x-default': `${SITE_URL}/es/login`,
      },
    },
  };
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // Forzar rendering dinámico para evitar que el CDN cachee el RSC payload
  // de esta página y lo sirva en lugar del HTML en full-page navigations.
  await connection();

  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return <LoginClient dict={dict.auth} locale={locale} />;
}
