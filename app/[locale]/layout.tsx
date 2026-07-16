import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import '../globals.css';
import { AuthProvider } from '@/context/auth-context';
import { CartProvider } from '@/context/cart-context';
import { getDictionary, isValidLocale } from './dictionaries';
import { locales, SITE_URL } from '@/i18n/routing';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = isValidLocale(locale) ? locale : 'es';
  const dict = await getDictionary(validLocale);

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: dict.meta.homeTitle,
      template: `%s — Tienda San José`,
    },
    description: dict.meta.homeDescription,
    openGraph: {
      siteName: 'Tienda San José',
      type: 'website',
      locale: validLocale === 'en' ? 'en_US' : 'es_US',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@TiendaSanJose',
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<'/[locale]'>) {
  const { locale } = await params;

  if (!isValidLocale(locale)) notFound();

  // Carga el diccionario — Paso 3 lo pasará a los Server Components hijos
  await getDictionary(locale);

  return (
    <html
      lang={locale}
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
