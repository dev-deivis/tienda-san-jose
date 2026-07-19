import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';
import Link from 'next/link';
import { KeyRound } from 'lucide-react';
import { getSessionUser } from '@/lib/auth';
import { getDictionary, isValidLocale } from '@/app/[locale]/dictionaries';
import { ChangePasswordClient } from './change-password-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return {
    title: dict.changePassword.title,
    robots: { index: false, follow: false },
  };
}

export default async function CambiarContrasenaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // Forzar rendering dinámico para evitar que el CDN cachee el RSC payload.
  await connection();
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const session = await getSessionUser();
  if (!session) {
    redirect(`/${locale}/login`);
  }

  const dict = await getDictionary(locale);
  const cp = dict.changePassword;

  return (
    <div className="min-h-screen bg-cream py-10 px-4">
      <div className="max-w-md mx-auto">
        <Link
          href={`/${locale}/cuenta`}
          className="inline-block text-sm text-gray-500 hover:text-brand-purple transition-colors mb-6"
        >
          ← {dict.account.hub.title}
        </Link>
        <div className="flex items-center gap-3 mb-8">
          <KeyRound size={28} className="text-brand-purple" strokeWidth={1.5} />
          <div>
            <h1 className="font-serif text-2xl font-bold text-brand-purple">
              {cp.title}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{cp.subtitle}</p>
          </div>
        </div>

        <ChangePasswordClient dict={cp} />
      </div>
    </div>
  );
}
