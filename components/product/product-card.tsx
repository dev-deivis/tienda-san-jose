'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

type Product = {
  id: number;
  nombre: string;
  precio: { toString(): string } | number | string;
  imagen: string | null;
};

export function ProductCard({ product }: { product: Product }) {
  const precio = typeof product.precio === 'object'
    ? parseFloat(product.precio.toString())
    : Number(product.precio);

  return (
    <Link href={`/producto/${product.id}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-lg">
        {/* Imagen */}
        <div className="aspect-square overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imagen ?? `https://picsum.photos/seed/product-${product.id}/400/400`}
            alt={product.nombre}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Botón carrito rápido */}
        <button
          onClick={(e) => e.preventDefault()}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand-purple hover:text-white text-gray-600"
          aria-label="Agregar al carrito"
        >
          <ShoppingCart size={16} />
        </button>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-serif text-base font-semibold text-gray-900 line-clamp-2 leading-snug">
            {product.nombre}
          </h3>
          <p className="mt-2 text-brand-purple font-bold text-lg">
            ${precio.toFixed(2)}
          </p>
        </div>
      </div>
    </Link>
  );
}
