import { prisma } from '@/lib/prisma';
import { ArcGalleryHero } from '@/components/ui/arc-gallery-hero';
import { TrustBadges } from '@/components/sections/trust-badges';
import { ColeccionesSagradas } from '@/components/sections/colecciones-sagradas';

// TODO: reemplazar con fotos reales cuando el cliente las proporcione
const heroImages = [
  'https://picsum.photos/seed/rosario1/400/400',
  'https://picsum.photos/seed/biblia1/400/400',
  'https://picsum.photos/seed/cruz1/400/400',
  'https://picsum.photos/seed/vela1/400/400',
  'https://picsum.photos/seed/joyeria1/400/400',
  'https://picsum.photos/seed/comunion1/400/400',
  'https://picsum.photos/seed/plata1/400/400',
  'https://picsum.photos/seed/oro1/400/400',
];

export default async function HomePage() {
  const categories = await prisma.category.findMany({
    select: { id: true, nombre: true, slug: true, descripcion: true, imagen: true },
    orderBy: { id: 'asc' },
  });

  return (
    <>
      <ArcGalleryHero images={heroImages} />
      <TrustBadges />
      <ColeccionesSagradas categories={categories} />
    </>
  );
}
