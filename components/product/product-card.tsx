'use client';

import Link from 'next/link';
import { ShoppingCart, ImageIcon } from 'lucide-react';

type Product = {
  id: number;
  nombre: string;
  precio: { toString(): string } | number | string;
  imagen: string | null;
  images?: { url: string }[];
};

type Props = {
  product: Product;
  addToCartLabel: string;
};

export function ProductCard({ product, addToCartLabel }: Props) {
  const precio = typeof product.precio === 'object'
    ? parseFloat(product.precio.toString())
    : Number(product.precio);

  const imgSrc = product.images?.[0]?.url ?? product.imagen ?? null;

  return (
    <Link href={`/producto/${product.id}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-lg">
        {/* Imagen */}
        <div className="aspect-square overflow-hidden bg-gray-50">
          {imgSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgSrc}
              alt={product.nombre}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <ImageIcon size={48} strokeWidth={1} />
            </div>
          )}
        </div>

        {/* Botón carrito rápido */}
        <button
          onClick={(e) => e.preventDefault()}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand-purple hover:text-white text-gray-600"
          aria-label={addToCartLabel}
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
