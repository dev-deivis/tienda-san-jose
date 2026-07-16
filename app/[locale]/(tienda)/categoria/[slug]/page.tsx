import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ProductCard } from '@/components/product/product-card';
import { ProductFilters } from '@/components/product/product-filters';
import { SortDropdown } from '@/components/product/sort-dropdown';
import { Pagination } from '@/components/product/pagination';
import { Home, ChevronRight } from 'lucide-react';
import { Prisma } from '@prisma/client';
import { getDictionary, isValidLocale } from '@/app/[locale]/dictionaries';
import { SITE_URL } from '@/i18n/routing';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = await getDictionary(locale);

  const category = await prisma.category.findUnique({
    where: { slug },
    select: { nombre: true, descripcion: true },
  });
  if (!category) return {};

  const description =
    category.descripcion ||
    dict.meta.categoryDescFallback.replace('{name}', category.nombre);

  return {
    title: category.nombre,
    description,
    openGraph: {
      title: `${category.nombre} — Tienda San José`,
      description,
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'es_US',
      url: `${SITE_URL}/${locale}/categoria/${slug}`,
    },
    alternates: {
      canonical: `${SITE_URL}/es/categoria/${slug}`,
      languages: {
        es: `${SITE_URL}/es/categoria/${slug}`,
        en: `${SITE_URL}/en/categoria/${slug}`,
        'x-default': `${SITE_URL}/es/categoria/${slug}`,
      },
    },
  };
}

const PAGE_SIZE = 12;

type SearchParams = {
  precioMin?: string;
  precioMax?: string;
  sort?: string;
  page?: string;
  [key: string]: string | undefined;
};

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<SearchParams>;
};

export default async function CategoriaPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  const sp = await searchParams;

  if (!isValidLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  // 1. Traer categoría
  const category = await prisma.category.findUnique({
    where: { slug },
  });
  if (!category) notFound();

  // 2. Leer filtros de URL
  const precioMin = sp.precioMin ? parseFloat(sp.precioMin) : undefined;
  const precioMax = sp.precioMax ? parseFloat(sp.precioMax) : undefined;
  const sort = sp.sort ?? 'destacados';
  const page = Math.max(1, parseInt(sp.page ?? '1', 10));

  // 3. Ordenamiento (usado como referencia de tipo; el sort real se hace en JS sobre filtered)
  let _orderBy: Prisma.ProductOrderByWithRelationInput = { id: 'asc' };
  if (sort === 'precio-asc') _orderBy = { precio: 'asc' };
  else if (sort === 'precio-desc') _orderBy = { precio: 'desc' };
  else if (sort === 'nombre-asc') _orderBy = { nombre: 'asc' };
  void _orderBy; // evitar warning de unused variable

  // 4. Traer TODOS los productos de la categoría (para extraer atributos únicos)
  const allProducts = await prisma.product.findMany({
    where: { categoryId: category.id },
    select: {
      id: true,
      nombre: true,
      precio: true,
      imagen: true,
      attributes: true,
      images: { take: 1, orderBy: { orden: 'asc' }, select: { url: true } },
    },
  });

  // 5. Extraer atributos únicos para filtros
  const attrMap: Record<string, Set<string>> = {};
  allProducts.forEach((p) => {
    if (p.attributes && typeof p.attributes === 'object' && !Array.isArray(p.attributes)) {
      Object.entries(p.attributes as Record<string, string>).forEach(([key, val]) => {
        if (!attrMap[key]) attrMap[key] = new Set();
        attrMap[key].add(String(val));
      });
    }
  });

  // Labels legibles para los atributos — del diccionario
  const attrLabels = dict.attrLabels;

  const filterAttributes = Object.entries(attrMap).map(([key, vals]) => ({
    key,
    label: attrLabels[key as keyof typeof attrLabels] ?? key,
    values: Array.from(vals).sort(),
  }));

  // 6. Filtrar en JS (más simple y confiable con JSON en MySQL)
  let filtered = allProducts.filter((p) => {
    // Filtro de precio
    const precio = parseFloat(p.precio.toString());
    if (precioMin !== undefined && precio < precioMin) return false;
    if (precioMax !== undefined && precio > precioMax) return false;

    // Filtro de atributos
    const attrs = p.attributes as Record<string, string> | null;
    for (const { key } of filterAttributes) {
      const selectedValues = sp[key]?.split(',').filter(Boolean) ?? [];
      if (selectedValues.length === 0) continue;
      if (!attrs || !selectedValues.includes(String(attrs[key]))) return false;
    }
    return true;
  });

  // 7. Ordenar
  filtered = [...filtered].sort((a, b) => {
    if (sort === 'precio-asc') return parseFloat(a.precio.toString()) - parseFloat(b.precio.toString());
    if (sort === 'precio-desc') return parseFloat(b.precio.toString()) - parseFloat(a.precio.toString());
    if (sort === 'nombre-asc') return a.nombre.localeCompare(b.nombre);
    return a.id - b.id;
  });

  // 8. Paginación
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  // Serializar Decimal → number antes de pasar a Client Components
  const paginated = filtered
    .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    .map((p) => ({ ...p, precio: parseFloat(p.precio.toString()) }));

  const maxPrice = allProducts.reduce(
    (max, p) => Math.max(max, parseFloat(p.precio.toString())),
    0
  );

  const hasActiveFilters = precioMin !== undefined || precioMax !== undefined ||
    filterAttributes.some(({ key }) => (sp[key]?.length ?? 0) > 0);

  // Conteo de productos
  const countLabel = total === 1
    ? dict.filters.foundSingle.replace('{total}', '1')
    : dict.filters.foundPlural.replace('{total}', String(total));
  const countSuffix = hasActiveFilters ? dict.filters.withFilters : dict.filters.inCategory;

  return (
    <div className="min-h-screen bg-cream">
      {/* Header de categoría */}
      <div className="bg-white border-b border-gray-100 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
            <Link href="/" className="flex items-center gap-1 hover:text-brand-purple transition-colors">
              <Home size={14} /> {dict.breadcrumb.home}
            </Link>
            <ChevronRight size={14} />
            <span className="text-gray-700 font-medium">{category.nombre}</span>
          </nav>

          <h1 className="font-serif text-4xl font-bold text-brand-purple">{category.nombre}</h1>
          {category.descripcion && (
            <p className="mt-2 text-gray-500 max-w-2xl">{category.descripcion}</p>
          )}
          <p className="mt-1 text-sm text-gray-400">
            {countLabel}{' '}{countSuffix}
          </p>
        </div>
      </div>

      {/* Layout principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">

          {/* Sidebar filtros — desktop */}
          <div className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 bg-white rounded-2xl p-6 shadow-sm">
              <ProductFilters
                filterAttributes={filterAttributes}
                maxProductPrice={maxPrice}
                dict={dict.filters}
              />
            </div>
          </div>

          {/* Contenido principal */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500 hidden sm:block">
                {dict.filters.showing
                  .replace('{shown}', String(paginated.length))
                  .replace('{total}', String(total))}
              </p>
              <SortDropdown dict={dict.sort} />
            </div>

            {/* Grid de productos */}
            {paginated.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {paginated.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      addToCartLabel={dict.product.addToCartLabel}
                    />
                  ))}
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  dict={dict.pagination}
                />
              </>
            ) : (
              /* Estado vacío */
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-5xl mb-4">🕊️</div>
                <h3 className="font-serif text-2xl text-gray-700 mb-2">
                  {dict.filters.noProductsTitle}
                </h3>
                <p className="text-gray-400 mb-6 max-w-sm">
                  {dict.filters.noProductsDesc}
                </p>
                <Link
                  href={`/categoria/${slug}`}
                  className="px-6 py-3 bg-brand-purple text-white rounded-full text-sm font-medium hover:bg-brand-purple-dark transition-colors"
                >
                  {dict.filters.clearFilters}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
