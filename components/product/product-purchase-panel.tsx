'use client';

import { useState } from 'react';
import { ShoppingCart, MapPin, Check } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import type { Dictionary } from '@/app/[locale]/dictionaries';

type Props = {
  product: {
    id: number;
    nombre: string;
    precio: number;
    descripcion: string | null;
    stock: number;
    attributes: Record<string, string> | null;
    imagen: string | null;
  };
  dict: Dictionary['product'];
  attrLabels: Dictionary['attrLabels'];
};

export function ProductPurchasePanel({ product, dict, attrLabels }: Props) {
  const [cantidad, setCantidad] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  const attrs = product.attributes ?? {};

  function handleAdd() {
    addItem(
      {
        productId: product.id,
        nombre: product.nombre,
        precio: product.precio,
        imagen: product.imagen ?? `https://picsum.photos/seed/product-${product.id}/400/400`,
        variante: Object.values(attrs).join(' / ') || undefined,
      },
      cantidad
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-gray-900 leading-tight">
          {product.nombre}
        </h1>
        <p className="mt-3 text-3xl font-bold text-brand-purple">
          ${product.precio.toFixed(2)}
        </p>
      </div>

      {product.descripcion && (
        <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
          {product.descripcion}
        </p>
      )}

      {Object.entries(attrs).length > 0 && (
        <div className="flex flex-col gap-3">
          {Object.entries(attrs).map(([key, val]) => (
            <div key={key}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                {attrLabels[key as keyof typeof attrLabels] ?? key}
              </p>
              <span className="inline-block px-4 py-1.5 rounded-full bg-brand-purple/10 text-brand-purple text-sm font-medium border border-brand-purple/20">
                {val}
              </span>
            </div>
          ))}
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          {dict.quantity}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCantidad((c) => Math.max(1, c - 1))}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-brand-purple hover:text-brand-purple transition-colors text-lg font-medium"
          >
            −
          </button>
          <span className="w-10 text-center font-semibold text-gray-900">{cantidad}</span>
          <button
            onClick={() => setCantidad((c) => Math.min(product.stock, c + 1))}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-brand-purple hover:text-brand-purple transition-colors text-lg font-medium"
          >
            +
          </button>
          <span className="text-xs text-gray-400 ml-1">
            {dict.stock.replace('{count}', String(product.stock))}
          </span>
        </div>
      </div>

      <button
        onClick={handleAdd}
        className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base transition-all duration-300 ${
          added
            ? 'bg-green-500 text-white'
            : 'bg-brand-purple text-white hover:bg-brand-purple-dark shadow-lg hover:shadow-xl hover:-translate-y-0.5'
        }`}
      >
        {added ? (
          <><Check size={20} /> {dict.added}</>
        ) : (
          <><ShoppingCart size={20} /> {dict.addToCart}</>
        )}
      </button>

      <p className="flex items-center gap-1.5 text-xs text-gray-400">
        <MapPin size={13} className="text-brand-gold" />
        {dict.shippingFrom}
      </p>
    </div>
  );
}
