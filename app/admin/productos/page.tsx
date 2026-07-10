import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import DeleteProductModal from '@/app/staff/_components/delete-product-modal';
import EditProductModal from '@/app/staff/_components/edit-product-modal';

export default async function AdminProductosPage() {
  const products = await prisma.product.findMany({
    include: {
      category: { select: { id: true, nombre: true, slug: true } },
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
          href="/staff/productos/nuevo"
          className="flex items-center gap-2 bg-brand-purple text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-purple-dark transition-colors"
        >
          <PlusCircle size={16} />
          Nuevo producto
        </Link>
      </div>

      {/* Tabla de productos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {productsSerialized.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <p className="text-sm">No hay productos registrados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Imagen</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoría</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendidos</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productsSerialized.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image
                          src={product.imagen ?? `https://picsum.photos/seed/${product.id}/40/40`}
                          alt={product.nombre}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-800 line-clamp-1">
                        {product.nombre}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{product.category.nombre}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-gray-800">
                        ${product.precio.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm font-medium ${
                          product.stock === 0
                            ? 'text-red-600'
                            : product.stock < 5
                            ? 'text-amber-600'
                            : 'text-green-600'
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{product._count.orderItems}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <EditProductModal product={product} categories={categories} />
                        <DeleteProductModal
                          productId={product.id}
                          productName={product.nombre}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
