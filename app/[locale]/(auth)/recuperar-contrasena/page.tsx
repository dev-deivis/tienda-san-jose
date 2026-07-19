import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { getDictionary, isValidLocale } from '@/app/[locale]/dictionaries';
import { ForgotPasswordClient } from './forgot-password-client';
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
    title: dict.forgotPassword.title,
    description: dict.forgotPassword.subtitle,
    alternates: {
      canonical: `${SITE_URL}/es/recuperar-contrasena`,
      languages: {
        es: `${SITE_URL}/es/recuperar-contrasena`,
        en: `${SITE_URL}/en/recuperar-contrasena`,
        'x-default': `${SITE_URL}/es/recuperar-contrasena`,
      },
    },
  };
}

export default async function RecuperarContrasenaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // Forzar rendering dinámico para evitar que el CDN cachee el RSC payload.
  await connection();
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return (
    <ForgotPasswordClient
      dict={dict.forgotPassword}
      authDict={dict.auth}
      locale={locale}
    />
  );
}
