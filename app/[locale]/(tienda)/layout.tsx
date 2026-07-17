import { notFound } from 'next/navigation';
import { getDictionary, isValidLocale } from '@/app/[locale]/dictionaries';
import { HeaderServer } from '@/components/layout/header-server';
import { Footer } from '@/components/layout/footer';

export default async function TiendaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return (
    <>
      <HeaderServer dict={dict.nav} searchDict={dict.search} locale={locale} />
      <main>{children}</main>
      <Footer dict={dict.footer} locale={locale} />
    </>
  );
}
