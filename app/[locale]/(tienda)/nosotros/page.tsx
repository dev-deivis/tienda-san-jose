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
  const p = dict.footerPages.nosotros;

  return {
    title: p.metaTitle,
    description: p.metaDesc,
    alternates: {
      canonical: `${SITE_URL}/es/nosotros`,
      languages: {
        es: `${SITE_URL}/es/nosotros`,
        en: `${SITE_URL}/en/nosotros`,
        'x-default': `${SITE_URL}/es/nosotros`,
      },
    },
  };
}

export default async function NosotrosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const p = dict.footerPages.nosotros;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      {/* Decoración dorada */}
      <div className="flex justify-center mb-8">
        <div className="w-16 h-1 rounded-full bg-brand-gold opacity-60" />
      </div>

      <h1 className="font-serif text-4xl sm:text-5xl font-bold text-brand-purple text-center mb-12 leading-tight">
        {p.title}
      </h1>

      <div className="space-y-6">
        <p className="text-gray-600 text-lg leading-relaxed">{p.paragraph1}</p>
        <p className="text-gray-600 text-lg leading-relaxed">{p.paragraph2}</p>
        <p className="text-gray-600 text-lg leading-relaxed">{p.paragraph3}</p>
      </div>

      {/* Cierre con énfasis */}
      <div className="mt-12 text-center">
        <div className="inline-block px-8 py-5 bg-brand-purple/5 border border-brand-purple/20 rounded-2xl">
          <p className="font-serif text-xl text-brand-purple font-semibold">
            {p.closing}
          </p>
        </div>
      </div>

      {/* Decoración dorada inferior */}
      <div className="flex justify-center mt-12">
        <div className="w-16 h-1 rounded-full bg-brand-gold opacity-60" />
      </div>
    </div>
  );
}
