import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDictionary, isValidLocale } from '@/app/[locale]/dictionaries';
import { SITE_URL } from '@/i18n/routing';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const p = dict.footerPages.contacto;

  return {
    title: p.metaTitle,
    description: p.metaDesc,
    alternates: {
      canonical: `${SITE_URL}/es/contacto`,
      languages: {
        es: `${SITE_URL}/es/contacto`,
        en: `${SITE_URL}/en/contacto`,
        'x-default': `${SITE_URL}/es/contacto`,
      },
    },
  };
}

export default async function ContactoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const p = dict.footerPages.contacto;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      {/* Título */}
      <h1 className="font-serif text-4xl font-bold text-brand-purple mb-4">
        {p.title}
      </h1>
      <p className="text-gray-600 text-lg leading-relaxed mb-12">{p.intro}</p>

      {/* Tarjetas de contacto */}
      <div className="grid gap-6 sm:grid-cols-3">
        {/* Teléfono */}
        <div className="bg-white rounded-2xl shadow-sm border border-purple-50 p-6">
          <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center mb-4">
            <svg
              className="w-5 h-5 text-brand-purple"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            {p.phoneLabel}
          </p>
          <a
            href={`tel:${p.phone.replace(/[^+\d]/g, '')}`}
            className="text-gray-800 font-medium hover:text-brand-purple transition-colors"
          >
            {p.phone}
          </a>
        </div>

        {/* Correo */}
        <div className="bg-white rounded-2xl shadow-sm border border-purple-50 p-6">
          <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center mb-4">
            <svg
              className="w-5 h-5 text-brand-purple"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            {p.emailLabel}
          </p>
          <a
            href={`mailto:${p.email}`}
            className="text-gray-800 font-medium hover:text-brand-purple transition-colors break-all"
          >
            {p.email}
          </a>
        </div>

        {/* Ubicación */}
        <div className="bg-white rounded-2xl shadow-sm border border-purple-50 p-6">
          <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center mb-4">
            <svg
              className="w-5 h-5 text-brand-purple"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            {p.locationLabel}
          </p>
          <p className="text-gray-800 font-medium">{p.location}</p>
        </div>
      </div>

      {/* Tiempo de respuesta */}
      <div className="mt-10 px-6 py-4 bg-amber-50 border border-amber-100 rounded-2xl">
        <p className="text-sm text-amber-800 text-center">{p.responseTime}</p>
      </div>
    </div>
  );
}
