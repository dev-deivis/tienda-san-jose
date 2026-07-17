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
  const p = dict.footerPages.envios;

  return {
    title: p.metaTitle,
    description: p.metaDesc,
    alternates: {
      canonical: `${SITE_URL}/es/envios`,
      languages: {
        es: `${SITE_URL}/es/envios`,
        en: `${SITE_URL}/en/envios`,
        'x-default': `${SITE_URL}/es/envios`,
      },
    },
  };
}

export default async function EnviosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const p = dict.footerPages.envios;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <h1 className="font-serif text-4xl font-bold text-brand-purple mb-12">
        {p.title}
      </h1>

      {/* Envíos */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-brand-purple/10 flex items-center justify-center flex-shrink-0">
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
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
          </div>
          <h2 className="font-serif text-2xl font-bold text-gray-800">
            {p.shippingTitle}
          </h2>
        </div>
        <p className="text-gray-600 leading-relaxed">{p.shippingText}</p>
      </section>

      <hr className="border-purple-100 mb-12" />

      {/* Devoluciones */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-brand-purple/10 flex items-center justify-center flex-shrink-0">
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
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
          </div>
          <h2 className="font-serif text-2xl font-bold text-gray-800">
            {p.returnsTitle}
          </h2>
        </div>

        <p className="text-gray-600 leading-relaxed mb-8">{p.returnsIntro}</p>

        <div className="space-y-4">
          {/* Defectuoso */}
          <div className="bg-white rounded-2xl border border-purple-50 shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-2">
              {p.defectiveTitle}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {p.defectiveText}
            </p>
          </div>

          {/* Cambio de opinión */}
          <div className="bg-white rounded-2xl border border-purple-50 shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-2">
              {p.changeOfMindTitle}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {p.changeOfMindText}
            </p>
          </div>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          {p.initiateReturn}{' '}
          <a
            href="mailto:tiendasanjose19@outlook.com"
            className="text-brand-purple hover:underline font-medium"
          >
            tiendasanjose19@outlook.com
          </a>{' '}
          {p.withOrderNumber}
        </p>
      </section>
    </div>
  );
}
