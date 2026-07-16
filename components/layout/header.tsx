'use client';

import Link from 'next/link';
import { ShoppingCart, User, Menu, X, LogOut, UserCircle, Package, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/context/auth-context';
import { SearchOverlay } from '@/components/search/search-overlay';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import type { Dictionary } from '@/app/[locale]/dictionaries';
import type { Locale } from '@/i18n/routing';

type Category = { id: number; nombre: string; slug: string };

const NAV_LIMIT = 4;

export function Header({
  categories,
  dict,
  searchDict,
  locale,
}: {
  categories: Category[];
  dict: Dictionary['nav'];
  searchDict: Dictionary['search'];
  locale: Locale;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const { getItemCount } = useCart();
  const { user, logout } = useAuth();

  const visibleCats = categories.slice(0, NAV_LIMIT);
  const extraCats = categories.slice(NAV_LIMIT);

  // Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt={dict.logoAlt}
              className="w-14 h-14 sm:w-20 sm:h-20 object-contain"
            />
            <span className="font-serif text-base sm:text-xl font-bold text-brand-purple whitespace-nowrap">
              {dict.brandName}
            </span>
          </Link>

          {/* Navegación desktop — gap-6 (probado y seguro a 1024px+) */}
          <nav className="hidden lg:flex items-center gap-6">
            {visibleCats.map((cat) => (
              <Link
                key={cat.id}
                href={`/categoria/${cat.slug}`}
                className="text-sm text-gray-600 hover:text-brand-purple transition-colors whitespace-nowrap"
              >
                {cat.nombre}
              </Link>
            ))}

            {/* Dropdown "Más" — solo si hay categorías extra */}
            {extraCats.length > 0 && (
              <div className="relative" ref={moreRef}>
                <button
                  onClick={() => setMoreOpen((prev) => !prev)}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-brand-purple transition-colors whitespace-nowrap"
                >
                  {dict.more}
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {moreOpen && (
                  <div className="absolute left-0 top-full mt-2 min-w-[180px] bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    {extraCats.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/categoria/${cat.slug}`}
                        onClick={() => setMoreOpen(false)}
                        className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-brand-purple transition-colors whitespace-nowrap"
                      >
                        {cat.nombre}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Iconos + hamburguesa
              • LanguageSwitcher: hidden en mobile → aparece en menú hamburguesa */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <SearchOverlay navDict={dict} searchDict={searchDict} />

            {/* Selector de idioma SOLO en desktop, con separadores visuales */}
            <span className="hidden lg:block w-px h-5 bg-gray-200" aria-hidden="true" />
            <div className="hidden lg:flex">
              <LanguageSwitcher locale={locale} />
            </div>
            <span className="hidden lg:block w-px h-5 bg-gray-200" aria-hidden="true" />

            <Link
              href="/carrito"
              className="relative p-2 text-gray-600 hover:text-brand-purple transition-colors"
              aria-label={dict.cartLabel}
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
                  aria-label={dict.myAccount}
                >
                  <User size={20} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-400">{dict.loggedInAs}</p>
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {user.nombre ?? user.email}
                      </p>
                    </div>
                    <Link
                      href="/mis-pedidos"
                      onClick={() => setDropdownOpen(false)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-brand-purple transition-colors"
                    >
                      <Package size={15} />
                      {dict.myOrders}
                    </Link>
                    <Link
                      href={`/${locale}/cuenta/cambiar-contrasena`}
                      onClick={() => setDropdownOpen(false)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-brand-purple transition-colors"
                    >
                      <UserCircle size={15} />
                      {dict.myAccount}
                    </Link>
                    <button
                      onClick={() => { setDropdownOpen(false); logout(); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-red-50 hover:text-red-500 transition-colors text-left"
                    >
                      <LogOut size={15} />
                      {dict.logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="p-2 text-gray-600 hover:text-brand-purple transition-colors"
                aria-label={dict.loginLabel}
              >
                <User size={20} />
              </Link>
            )}

            {/* Hamburguesa — solo en mobile/tablet */}
            <button
              className="lg:hidden p-2 text-gray-600 hover:text-brand-purple transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={dict.menuLabel}
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

          {/* Selector de idioma al final del menú móvil */}
          <div className="border-t border-gray-100 pt-3 mt-1 flex items-center gap-1">
            <span className="text-xs text-gray-400 mr-2">
              {locale === 'es' ? 'Idioma' : 'Language'}:
            </span>
            <LanguageSwitcher locale={locale} />
          </div>
        </div>
      )}
    </header>
  );
}
