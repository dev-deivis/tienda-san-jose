import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { getDictionary, isValidLocale } from '@/app/[locale]/dictionaries';
import { CarritoClient } from './carrito-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = await getDictionary(locale);

  return {
    title: dict.cart.title,
    robots: { index: false, follow: false },
  };
}

export default async function CarritoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // Forzar rendering dinámico para evitar que el CDN cachee el RSC payload.
  await connection();
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return <CarritoClient dict={dict.cart} />;
}
