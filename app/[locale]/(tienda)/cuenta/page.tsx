import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';
import Link from 'next/link';
import { User, MapPin, KeyRound, Package, ChevronRight } from 'lucide-react';
import { getSessionUser } from '@/lib/auth';
import { getDictionary, isValidLocale } from '@/app/[locale]/dictionaries';
import { prisma } from '@/lib/prisma';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return {
    title: dict.account.hub.title,
    robots: { index: false, follow: false },
  };
}

export default async function MiCuentaPage({
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
      select: { nombre: true, email: true },
    }),
  ]);

  const h = dict.account.hub;

  const cards = [
    {
      href: `/${locale}/cuenta/perfil`,
      icon: User,
      title: h.profileTitle,
      desc: h.profileDesc,
    },
    {
      href: `/${locale}/cuenta/direcciones`,
      icon: MapPin,
      title: h.addressesTitle,
      desc: h.addressesDesc,
    },
    {
      href: `/${locale}/cuenta/cambiar-contrasena`,
      icon: KeyRound,
      title: h.passwordTitle,
      desc: h.passwordDesc,
    },
    {
      href: `/${locale}/mis-pedidos`,
      icon: Package,
      title: h.ordersTitle,
      desc: h.ordersDesc,
    },
  ];

  return (
    <div className="min-h-screen bg-cream py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-brand-purple">
            {h.title}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{h.subtitle}</p>
          {user && (
            <p className="text-sm text-gray-700 mt-2 font-medium">
              {user.nombre ?? user.email}
            </p>
          )}
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map(({ href, icon: Icon, title, desc }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-4 bg-white rounded-2xl border border-gray-200 px-5 py-4 shadow-sm hover:shadow-md hover:border-brand-purple/30 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center shrink-0 group-hover:bg-brand-purple/15 transition-colors">
                <Icon size={20} className="text-brand-purple" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 group-hover:text-brand-purple transition-colors">
                  {title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
              <ChevronRight size={16} className="text-gray-400 group-hover:text-brand-purple transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
