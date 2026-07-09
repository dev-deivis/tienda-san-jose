'use client';

import Link from 'next/link';
import { ShoppingCart, User, Menu, X, LogOut, UserCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useCart } from '@/context/cart-context';
import { useCurrentUser } from '@/hooks/use-current-user';

type Category = { id: number; nombre: string; slug: string };

export function Header({ categories }: { categories: Category[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { getItemCount } = useCart();
  const { user, logout } = useCurrentUser();

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            {/* Ícono de usuario: link a /login si no hay sesión, dropdown si sí */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="p-2 text-brand-purple hover:text-brand-purple-dark transition-colors"
                  aria-label="Mi cuenta"
                >
                  <User size={20} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-400">Conectado como</p>
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {user.nombre ?? user.email}
                      </p>
                    </div>
                    <button
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-brand-purple transition-colors text-left"
                      onClick={() => { setDropdownOpen(false); }}
                    >
                      <UserCircle size={15} />
                      Mi cuenta
                    </button>
                    <button
                      onClick={() => { setDropdownOpen(false); logout(); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-red-50 hover:text-red-500 transition-colors text-left"
                    >
                      <LogOut size={15} />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="p-2 text-gray-600 hover:text-brand-purple transition-colors"
                aria-label="Iniciar sesión"
              >
                <User size={20} />
              </Link>
            )}
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
