import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ProductCard } from '@/components/product/product-card';
import { Home, ChevronRight, Search } from 'lucide-react';

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function BuscarPage({ searchParams }: Props) {
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

  return (
    <div className="min-h-screen bg-cream">
      {/* Header de resultados */}
      <div className="bg-white border-b border-gray-100 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
            <Link href="/" className="flex items-center gap-1 hover:text-brand-purple transition-colors">
              <Home size={14} /> Inicio
            </Link>
            <ChevronRight size={14} />
            <span className="text-gray-700 font-medium">Búsqueda</span>
          </nav>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-purple flex items-center gap-3">
            <Search size={28} strokeWidth={2} />
            {q ? (
              <>Resultados para &ldquo;{q}&rdquo;</>
            ) : (
              'Buscar productos'
            )}
          </h1>

          <p className="mt-1 text-sm text-gray-400">
            {q.length >= 2
              ? `${serialized.length} ${serialized.length === 1 ? 'producto encontrado' : 'productos encontrados'}`
              : 'Escribe al menos 2 caracteres para buscar.'}
          </p>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {!q || q.length < 2 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-400 max-w-sm">
              Ingresa un término de búsqueda para encontrar productos.
            </p>
          </div>
        ) : serialized.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">🕊️</div>
            <h3 className="font-serif text-2xl text-gray-700 mb-2">
              No encontramos productos
            </h3>
            <p className="text-gray-400 mb-6 max-w-sm">
              No hay resultados para &ldquo;{q}&rdquo;. Intenta con otro término.
            </p>
            <Link
              href="/"
              className="px-6 py-3 bg-brand-purple text-white rounded-full text-sm font-medium hover:bg-brand-purple-dark transition-colors"
            >
              Ver todos los productos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {serialized.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
