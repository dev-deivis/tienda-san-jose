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
  const p = dict.footerPages.privacidad;

  return {
    title: p.metaTitle,
    description: p.metaDesc,
    alternates: {
      canonical: `${SITE_URL}/es/privacidad`,
      languages: {
        es: `${SITE_URL}/es/privacidad`,
        en: `${SITE_URL}/en/privacidad`,
        'x-default': `${SITE_URL}/es/privacidad`,
      },
    },
  };
}

export default async function PrivacidadPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const p = dict.footerPages.privacidad;

  const sections = [
    { title: p.dataTitle, text: p.dataText },
    { title: p.paymentsTitle, text: p.paymentsText },
    { title: p.useTitle, text: p.useText },
    { title: p.cookiesTitle, text: p.cookiesText },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <h1 className="font-serif text-4xl font-bold text-brand-purple mb-4">
        {p.title}
      </h1>
      <p className="text-gray-600 text-lg leading-relaxed mb-12">{p.intro}</p>

      <div className="space-y-8">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="font-serif text-xl font-bold text-gray-800 mb-2">
              {s.title}
            </h2>
            <p className="text-gray-600 leading-relaxed">{s.text}</p>
          </section>
        ))}
      </div>

      <div className="mt-12 p-5 bg-purple-50 rounded-2xl border border-purple-100">
        <p className="text-sm text-gray-600">
          {p.contactLine}{' '}
          <a
            href="mailto:tiendasanjose19@outlook.com"
            className="text-brand-purple hover:underline font-medium"
          >
            tiendasanjose19@outlook.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
