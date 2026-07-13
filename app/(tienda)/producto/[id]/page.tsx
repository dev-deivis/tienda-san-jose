import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ProductGallery } from '@/components/product/product-gallery';
import { ProductPurchasePanel } from '@/components/product/product-purchase-panel';
import { ProductTabs } from '@/components/product/product-tabs';
import { ProductCard } from '@/components/product/product-card';
import { Home, ChevronRight } from 'lucide-react';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProductoPage({ params }: Props) {
  const { id } = await params;
  const productId = parseInt(id, 10);

  if (isNaN(productId)) notFound();

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: true,
      images: { orderBy: { orden: 'asc' } },
    },
  });

  if (!product) notFound();

  // Productos relacionados (misma categoría, excluye el actual, máx 4)
  const relacionados = await prisma.product.findMany({
    where: { categoryId: product.categoryId, id: { not: productId } },
    take: 4,
    select: {
      id: true,
      nombre: true,
      precio: true,
      imagen: true,
      attributes: true,
      images: { take: 1, orderBy: { orden: 'asc' }, select: { url: true } },
    },
  });

  // Serializar Decimals antes de pasar a Client Components
  const productPlain = {
    id: product.id,
    nombre: product.nombre,
    precio: parseFloat(product.precio.toString()),
    descripcion: product.descripcion,
    stock: product.stock,
    attributes: product.attributes as Record<string, string> | null,
  };

  const productImages = product.images.map((img) => ({
    id: img.id,
    url: img.url,
    orden: img.orden,
  }));

  const relacionadosPlain = relacionados.map((p) => ({
    ...p,
    precio: parseFloat(p.precio.toString()),
  }));

  return (
    <div className="min-h-screen bg-cream">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 py-4 px-4">
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center gap-1.5 text-sm text-gray-400 flex-wrap">
            <Link href="/" className="flex items-center gap-1 hover:text-brand-purple transition-colors">
              <Home size={14} /> Inicio
            </Link>
            <ChevronRight size={14} />
            <Link
              href={`/categoria/${product.category.slug}`}
              className="hover:text-brand-purple transition-colors"
            >
              {product.category.nombre}
            </Link>
            <ChevronRight size={14} />
            <span className="text-gray-600 line-clamp-1">{product.nombre}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Layout 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Galería */}
          <ProductGallery images={productImages} productName={product.nombre} />

          {/* Panel de compra */}
          <ProductPurchasePanel product={productPlain} />
        </div>

        {/* Tabs */}
        <ProductTabs
          descripcion={product.descripcion}
          categorySlug={product.category.slug}
        />

        {/* Productos relacionados */}
        {relacionadosPlain.length > 0 && (
          <section className="mt-16">
            <h2 className="font-serif text-2xl font-bold text-brand-purple mb-6">
              También te puede interesar
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {relacionadosPlain.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
