import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getDictionary, isValidLocale } from '@/app/[locale]/dictionaries';
import { AddressesClient } from './addresses-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return {
    title: dict.account.addresses.title,
    robots: { index: false, follow: false },
  };
}

export default async function DireccionesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const session = await getSessionUser();
  if (!session) redirect(`/${locale}/login`);

  const dict = await getDictionary(locale);

  return <AddressesClient dict={dict.account.addresses} locale={locale} />;
}
