import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProductCard } from '@/components/product/product-card';
import { Home, ChevronRight, Search } from 'lucide-react';
import { getDictionary, isValidLocale } from '@/app/[locale]/dictionaries';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = await getDictionary(locale);

  const sp = await searchParams;
  const q = sp.q?.trim() ?? '';

  const title = q.length >= 2
    ? dict.search.pageTitle.replace('{query}', q)
    : dict.search.emptyQueryTitle;

  return {
    title,
    description: dict.meta.homeDescription,
    robots: { index: false, follow: true },
  };
}

export default async function BuscarPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const sp = await searchParams;
  const q = sp.q?.trim() ?? '';

  const products =
    q.length >= 2
      ? await prisma.product.findMany({
          where: {
            OR: [
              { nombre: { contains: q } },
              { descripcion: { contains: q } },
            ],
          },
          select: {
            id: true,
            nombre: true,
            precio: true,
            imagen: true,
            images: {
              take: 1,
              orderBy: { orden: 'asc' },
              select: { url: true },
            },
          },
          orderBy: { nombre: 'asc' },
        })
      : [];

  const serialized = products.map((p) => ({
    ...p,
    precio: parseFloat(p.precio.toString()),
  }));

  const n = serialized.length;
  const countLabel = q.length >= 2
    ? (n === 1
        ? dict.search.foundSingle.replace('{count}', '1')
        : dict.search.foundPlural.replace('{count}', String(n)))
    : dict.search.emptyQuery;

  return (
    <div className="min-h-screen bg-cream">
      {/* Header de resultados */}
      <div className="bg-white border-b border-gray-100 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
            <Link href="/" className="flex items-center gap-1 hover:text-brand-purple transition-colors">
              <Home size={14} /> {dict.breadcrumb.home}
            </Link>
            <ChevronRight size={14} />
            <span className="text-gray-700 font-medium">{dict.search.breadcrumb}</span>
          </nav>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-purple flex items-center gap-3">
            <Search size={28} strokeWidth={2} />
            {q
              ? dict.search.pageTitle.replace('{query}', q)
              : dict.search.emptyQueryTitle}
          </h1>

          <p className="mt-1 text-sm text-gray-400">{countLabel}</p>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {!q || q.length < 2 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-400 max-w-sm">
              {dict.search.emptyQueryBody}
            </p>
          </div>
        ) : serialized.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">🕊️</div>
            <h3 className="font-serif text-2xl text-gray-700 mb-2">
              {dict.search.emptyTitle}
            </h3>
            <p className="text-gray-400 mb-6 max-w-sm">
              {dict.search.emptyDesc.replace('{query}', q)}
            </p>
            <Link
              href="/"
              className="px-6 py-3 bg-brand-purple text-white rounded-full text-sm font-medium hover:bg-brand-purple-dark transition-colors"
            >
              {dict.search.viewAll2}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {serialized.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                addToCartLabel={dict.product.addToCartLabel}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
