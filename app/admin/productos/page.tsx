import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import ProductsTable from './_components/products-table';

export default async function AdminProductosPage() {
  const products = await prisma.product.findMany({
    include: {
      category: { select: { id: true, nombre: true, slug: true } },
      images: { orderBy: { orden: 'asc' }, select: { id: true, url: true, orden: true } },
      _count: { select: { orderItems: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const categories = await prisma.category.findMany({
    select: { id: true, nombre: true, slug: true },
    orderBy: { nombre: 'asc' },
  });

  const productsSerialized = products.map((p) => ({
    ...p,
    precio: parseFloat(p.precio.toString()),
    descripcion: p.descripcion ?? null,
    imagen: p.imagen ?? null,
    attributes: p.attributes,
    images: p.images,
  }));

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-gray-800">Productos</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {products.length} producto{products.length !== 1 ? 's' : ''} en total
          </p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="flex items-center gap-2 bg-brand-purple text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-purple-dark transition-colors"
        >
          <PlusCircle size={16} />
          Nuevo producto
        </Link>
      </div>

      {/* Tabla de productos con búsqueda */}
      <ProductsTable products={productsSerialized} categories={categories} />
    </div>
  );
}
