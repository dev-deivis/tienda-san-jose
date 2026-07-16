'use client';

import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { Trash2, ShoppingBag, ChevronRight } from 'lucide-react';
import type { Dictionary } from '@/app/[locale]/dictionaries';

type Props = { dict: Dictionary['cart'] };

export function CarritoClient({ dict }: Props) {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center text-center px-4 py-20">
        <ShoppingBag size={64} className="text-gray-200 mb-6" />
        <h1 className="font-serif text-3xl font-bold text-gray-700 mb-2">
          {dict.emptyTitle}
        </h1>
        <p className="text-gray-400 mb-8 max-w-sm">
          {dict.emptyDesc}
        </p>
        <Link
          href="/"
          className="px-8 py-3 bg-brand-purple text-white rounded-full font-medium hover:bg-brand-purple-dark transition-colors"
        >
          {dict.exploreCatalog}
        </Link>
      </div>
    );
  }

  const subtotal = getTotal();

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-brand-purple mb-8">
          {dict.title}
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Lista de items */}
          <div className="flex-1 flex flex-col gap-4">
            {items.map((item) => {
              const itemKey = `${item.productId}::${item.variante ?? ''}`;
              return (
                <div
                  key={itemKey}
                  className="flex gap-4 bg-white rounded-2xl p-4 shadow-sm"
                >
                  {/* Imagen */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imagen}
                    alt={item.nombre}
                    className="w-24 h-24 object-cover rounded-xl shrink-0"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/producto/${item.productId}`}
                      className="font-serif font-semibold text-gray-900 hover:text-brand-purple transition-colors line-clamp-2 text-sm leading-snug"
                    >
                      {item.nombre}
                    </Link>
                    {item.variante && (
                      <p className="text-xs text-gray-400 mt-0.5">{item.variante}</p>
                    )}
                    <p className="text-brand-purple font-bold mt-1">
                      ${item.precio.toFixed(2)}
                    </p>

                    {/* Controles cantidad */}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => updateQuantity(item.productId, item.variante, item.cantidad - 1)}
                        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-brand-purple hover:text-brand-purple transition-colors text-sm"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.cantidad}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.variante, item.cantidad + 1)}
                        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-brand-purple hover:text-brand-purple transition-colors text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Subtotal + eliminar */}
                  <div className="flex flex-col items-end justify-between shrink-0">
                    <button
                      onClick={() => removeItem(item.productId, item.variante)}
                      className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"
                      aria-label={dict.remove}
                    >
                      <Trash2 size={16} />
                    </button>
                    <p className="font-bold text-gray-900 text-sm">
                      ${(item.precio * item.cantidad).toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Limpiar carrito */}
            <button
              onClick={clearCart}
              className="self-start text-sm text-gray-400 hover:text-red-400 transition-colors mt-2"
            >
              {dict.clearCart}
            </button>
          </div>

          {/* Panel de resumen */}
          <div className="lg:w-80 shrink-0">
            <div className="sticky top-24 bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-serif text-xl font-bold text-gray-900 mb-5">
                {dict.orderSummary}
              </h2>

              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{dict.subtotal}</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{dict.shipping}</span>
                  <span className="text-gray-400 italic">{dict.shippingNote}</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between text-base font-bold">
                  <span>{dict.total}</span>
                  <span className="text-brand-purple">${subtotal.toFixed(2)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="mt-6 w-full flex items-center justify-center gap-2 py-4 bg-brand-purple text-white rounded-2xl font-semibold hover:bg-brand-purple-dark transition-colors shadow-lg"
              >
                {dict.checkoutButton} <ChevronRight size={18} />
              </Link>

              <Link
                href="/"
                className="mt-3 w-full flex items-center justify-center py-3 text-sm text-brand-purple hover:underline"
              >
                {dict.keepShopping}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
