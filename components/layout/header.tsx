'use client';

import Link from 'next/link';
import { ShoppingCart, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/context/cart-context';

type Category = { id: number; nombre: string; slug: string };

export function Header({ categories }: { categories: Category[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { getItemCount } = useCart();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Logo Tienda San José"
              className="w-20 h-20 object-contain"
            />
            <span className="font-serif text-xl font-bold text-brand-purple whitespace-nowrap">
              Tienda San José
            </span>
          </Link>

          {/* Navegación desktop */}
          <nav className="hidden lg:flex items-center gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categoria/${cat.slug}`}
                className="text-sm text-gray-600 hover:text-brand-purple transition-colors whitespace-nowrap"
              >
                {cat.nombre}
              </Link>
            ))}
          </nav>

          {/* Iconos + hamburguesa */}
          <div className="flex items-center gap-3">
            <Link
              href="/carrito"
              className="relative p-2 text-gray-600 hover:text-brand-purple transition-colors"
              aria-label="Carrito de compras"
            >
              <ShoppingCart size={20} />
              {getItemCount() > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-brand-magenta text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {getItemCount() > 99 ? '99+' : getItemCount()}
                </span>
              )}
            </Link>
            <Link
              href="/cuenta"
              className="p-2 text-gray-600 hover:text-brand-purple transition-colors"
              aria-label="Mi cuenta"
            >
              <User size={20} />
            </Link>
            <button
              className="lg:hidden p-2 text-gray-600 hover:text-brand-purple transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menú"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categoria/${cat.slug}`}
              className="text-sm text-gray-700 hover:text-brand-purple py-1 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {cat.nombre}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
