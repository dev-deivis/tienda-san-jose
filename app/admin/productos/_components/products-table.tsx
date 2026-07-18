'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Search, X } from 'lucide-react';
import DeleteProductModal from '@/app/staff/_components/delete-product-modal';
import EditProductModal from '@/app/staff/_components/edit-product-modal';

type Category = { id: number; nombre: string; slug: string };

type ProductImageItem = { id: number; url: string; orden: number };

type Product = {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  imagen: string | null;
  categoryId: number;
  category: Category;
  images: ProductImageItem[];
  attributes: unknown;
  vendidos: number;
};

type Props = {
  products: Product[];
  categories: Category[];
};

export default function ProductsTable({ products, categories }: Props) {
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();

  const filtered = normalizedQuery
    ? products.filter(
        (p) =>
          p.nombre.toLowerCase().includes(normalizedQuery) ||
          p.category.nombre.toLowerCase().includes(normalizedQuery)
      )
    : products;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Buscador */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="relative max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o categoría…"
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple focus:bg-white transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          {query ? (
            <p className="text-sm">
              No se encontraron productos para{' '}
              <span className="font-medium text-gray-600">"{query}"</span>.
            </p>
          ) : (
            <p className="text-sm">No hay productos registrados.</p>
          )}
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
              {filtered.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image
                        src={product.images[0]?.url ?? product.imagen ?? `https://picsum.photos/seed/${product.id}/40/40`}
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
                    <span className="text-sm text-gray-600">{product.vendidos}</span>
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

      {/* Contador de resultados cuando hay búsqueda activa */}
      {query && filtered.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} de {products.length} productos
        </div>
      )}
    </div>
  );
}
