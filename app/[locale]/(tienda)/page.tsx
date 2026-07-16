import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { getDictionary, isValidLocale } from '@/app/[locale]/dictionaries';
import { notFound } from 'next/navigation';
import { ArcGalleryHero } from '@/components/ui/arc-gallery-hero';
import { TrustBadges } from '@/components/sections/trust-badges';
import { ColeccionesSagradas } from '@/components/sections/colecciones-sagradas';
import { SITE_URL } from '@/i18n/routing';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = await getDictionary(locale);

  return {
    title: dict.meta.homeTitle,
    description: dict.meta.homeDescription,
    openGraph: {
      title: dict.meta.homeTitle,
      description: dict.meta.homeDescription,
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'es_US',
      url: `${SITE_URL}/${locale}`,
    },
    alternates: {
      canonical: `${SITE_URL}/es`,
      languages: {
        es: `${SITE_URL}/es`,
        en: `${SITE_URL}/en`,
        'x-default': `${SITE_URL}/es`,
      },
    },
  };
}

// Colores de la paleta de marca para fallback (nunca picsum)
const BRAND_FALLBACKS = [
  'https://placehold.co/400x400/3D1560/FDF8F3?text=TSJ',
  'https://placehold.co/400x400/C9A84C/3D1560?text=TSJ',
  'https://placehold.co/400x400/5C2080/FDF8F3?text=TSJ',
  'https://placehold.co/400x400/A07830/FDF8F3?text=TSJ',
  'https://placehold.co/400x400/3D1560/C9A84C?text=TSJ',
  'https://placehold.co/400x400/C9A84C/FDF8F3?text=TSJ',
  'https://placehold.co/400x400/2A0E44/FDF8F3?text=TSJ',
  'https://placehold.co/400x400/7B3FA8/FDF8F3?text=TSJ',
];

async function getHeroImages(): Promise<string[]> {
  // Traer productos con imagen real, agrupados por categoría para variedad
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { imagen: { not: null } },
        { images: { some: {} } },
      ],
    },
    select: {
      categoryId: true,
      imagen: true,
      images: {
        select: { url: true },
        orderBy: { orden: 'asc' },
        take: 1,
      },
    },
    orderBy: { categoryId: 'asc' },
  });

  if (products.length === 0) return [];

  // Agrupar por categoría para no repetir la misma categoría seguida
  const byCategory = new Map<number, string[]>();
  for (const p of products) {
    const url = p.images[0]?.url ?? p.imagen;
    if (!url) continue;
    const list = byCategory.get(p.categoryId) ?? [];
    list.push(url);
    byCategory.set(p.categoryId, list);
  }

  // Round-robin entre categorías hasta tener 8 imágenes
  const result: string[] = [];
  const queues = Array.from(byCategory.values());
  let round = 0;
  while (result.length < 8) {
    let added = false;
    for (const queue of queues) {
      if (queue[round]) {
        result.push(queue[round]);
        added = true;
        if (result.length === 8) break;
      }
    }
    if (!added) break;
    round++;
  }

  return result;
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const [dict, categories, realImages] = await Promise.all([
    getDictionary(locale),
    prisma.category.findMany({
      select: { id: true, nombre: true, slug: true, descripcion: true, imagen: true },
      orderBy: { id: 'asc' },
    }),
    getHeroImages(),
  ]);

  // Completar hasta 8 con colores de marca si faltan fotos reales
  const heroImages =
    realImages.length === 0
      ? [] // sin productos → el hero mostrará solo el texto centrado
      : [
          ...realImages,
          ...BRAND_FALLBACKS.slice(realImages.length, 8),
        ].slice(0, 8);

  return (
    <>
      <ArcGalleryHero images={heroImages} dict={dict.hero} logoAlt={dict.nav.logoAlt} />
      <TrustBadges dict={dict.trust} />
      <ColeccionesSagradas categories={categories} dict={dict.collections} />
    </>
  );
}
