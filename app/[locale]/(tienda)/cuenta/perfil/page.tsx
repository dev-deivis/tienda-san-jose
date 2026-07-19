import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';
import { User } from 'lucide-react';
import { getSessionUser } from '@/lib/auth';
import { getDictionary, isValidLocale } from '@/app/[locale]/dictionaries';
import { prisma } from '@/lib/prisma';
import { ProfileClient } from './profile-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return {
    title: dict.account.profile.title,
    robots: { index: false, follow: false },
  };
}

export default async function PerfilPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // Forzar rendering dinámico para evitar que el CDN cachee el RSC payload.
  await connection();
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const session = await getSessionUser();
  if (!session) redirect(`/${locale}/login`);

  const [dict, user] = await Promise.all([
    getDictionary(locale),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true, nombre: true, phone: true },
    }),
  ]);

  if (!user) redirect(`/${locale}/login`);

  return (
    <div className="min-h-screen bg-cream py-10 px-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <User size={28} className="text-brand-purple" strokeWidth={1.5} />
          <div>
            <h1 className="font-serif text-2xl font-bold text-brand-purple">
              {dict.account.profile.title}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {dict.account.profile.subtitle}
            </p>
          </div>
        </div>

        <ProfileClient
          dict={dict.account.profile}
          locale={locale}
          initialData={{ nombre: user.nombre ?? '', phone: user.phone ?? '', email: user.email }}
        />
      </div>
    </div>
  );
}
