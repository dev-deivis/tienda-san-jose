import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getDictionary, isValidLocale } from '@/app/[locale]/dictionaries';
import { prisma } from '@/lib/prisma';
import { ResetPasswordClient } from './reset-password-client';
import { SITE_URL } from '@/i18n/routing';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = await getDictionary(locale);

  return {
    title: dict.forgotPassword.resetTitle,
    description: dict.forgotPassword.resetSubtitle,
    alternates: {
      canonical: `${SITE_URL}/es/recuperar-contrasena`,
      languages: {
        es: `${SITE_URL}/es/recuperar-contrasena`,
        en: `${SITE_URL}/en/recuperar-contrasena`,
        'x-default': `${SITE_URL}/es/recuperar-contrasena`,
      },
    },
    robots: { index: false },
  };
}

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  // Validar token en el servidor antes de renderizar el formulario
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  const isValid =
    resetToken &&
    resetToken.usedAt === null &&
    resetToken.expiresAt > new Date();

  if (!isValid) {
    return (
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt={dict.auth.logoAlt}
            className="w-20 h-20 object-contain mx-auto mb-3"
          />
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="font-serif text-xl font-bold text-gray-800 mb-2">
            {dict.forgotPassword.invalidToken}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {dict.forgotPassword.invalidTokenDesc}
          </p>
          <Link
            href={`/${locale}/recuperar-contrasena`}
            className="inline-block px-6 py-2.5 bg-brand-purple text-white rounded-xl text-sm font-semibold hover:bg-brand-purple-dark transition-colors"
          >
            {dict.forgotPassword.requestNewLink}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ResetPasswordClient
      dict={dict.forgotPassword}
      authDict={dict.auth}
      locale={locale}
      token={token}
    />
  );
}
