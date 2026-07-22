'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Package, LogOut, Store, UserCircle, Menu, X, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

const navLinks = [
  { href: '/staff/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/staff/productos', label: 'Productos', icon: Package },
];

export default function StaffShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  // Cerrar al navegar
  useEffect(() => {
    close();
  }, [pathname, close]);

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [close]);

  // Bloquear scroll del body mientras el overlay está abierto en mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <div className="flex h-screen overflow-hidden font-sans">

      {/* Backdrop — solo visible en mobile cuando el sidebar está abierto */}
      <div
        className={`fixed inset-0 z-30 bg-black/50 lg:hidden transition-opacity duration-200 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={close}
        aria-hidden="true"
      />

      {/* Sidebar
          Mobile:  fixed overlay, slide desde la izquierda
          Desktop: parte del flujo flex, siempre visible
      */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex w-60 flex-shrink-0 flex-col bg-brand-purple text-white
          transition-transform duration-200 ease-in-out
          lg:relative lg:z-auto lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo + botón cerrar (mobile) */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-2">
            <Store size={20} className="text-brand-gold" />
            <span className="font-serif text-lg font-semibold">Staff Panel</span>
          </div>
          <button
            onClick={close}
            className="lg:hidden p-1 text-white/60 hover:text-white transition-colors"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={close}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-purple-dark border-l-2 border-brand-magenta pl-[10px]'
                    : 'hover:bg-white/10'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer del sidebar */}
        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          {/* Ver tienda — abre en pestaña nueva sin disparar el redirect de home */}
          <a
            href="/es?ver_tienda=1"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium hover:bg-white/10 transition-colors"
          >
            <ExternalLink size={18} />
            Ver tienda
          </a>
          <Link
            href="/staff/cuenta"
            onClick={close}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
              pathname === '/staff/cuenta'
                ? 'bg-brand-purple-dark border-l-2 border-brand-magenta pl-[10px]'
                : 'hover:bg-white/10'
            }`}
          >
            <UserCircle size={18} />
            Mi cuenta
          </Link>
          <Link
            href="/staff"
            onClick={close}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs text-white/60 hover:text-white/90 hover:bg-white/10 transition-colors ${
              pathname === '/staff' ? 'bg-brand-purple-dark border-l-2 border-brand-magenta pl-[10px]' : ''
            }`}
          >
            Vista general
          </Link>
        </div>
      </aside>

      {/* Columna principal */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 shadow-sm sm:px-6">
          <div className="flex items-center gap-3">
            {/* Hamburguesa — solo en mobile */}
            <button
              onClick={open}
              className="lg:hidden p-1.5 text-gray-600 hover:text-brand-purple transition-colors"
              aria-label="Abrir menú"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-sm text-gray-500">
              Bienvenido,{' '}
              <span className="font-semibold text-gray-800">
                {user?.nombre ?? user?.email ?? 'Staff'}
              </span>
            </h1>
          </div>
          <button
            onClick={() => logout('/es/login')}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-magenta transition-colors"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </header>

        {/* Contenido */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
