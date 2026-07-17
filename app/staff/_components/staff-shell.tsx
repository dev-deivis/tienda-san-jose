'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Package, LogOut, Store, UserCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

const navLinks = [
  { href: '/staff/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/staff/productos', label: 'Productos', icon: Package },
];

export default function StaffShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col bg-brand-purple text-white">
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-5 border-b border-white/10">
          <Store size={20} className="text-brand-gold" />
          <span className="font-serif text-lg font-semibold">Staff Panel</span>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
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
          <Link
            href="/staff/cuenta"
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
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs text-white/60 hover:text-white/90 hover:bg-white/10 transition-colors ${
              pathname === '/staff' ? 'bg-brand-purple-dark border-l-2 border-brand-magenta pl-[10px]' : ''
            }`}
          >
            Vista general
          </Link>
        </div>
      </aside>

      {/* Columna principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
          <h1 className="text-sm text-gray-500">
            Bienvenido,{' '}
            <span className="font-semibold text-gray-800">
              {user?.nombre ?? user?.email ?? 'Staff'}
            </span>
          </h1>
          <button
            onClick={() => logout('/es/login')}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-magenta transition-colors"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </header>

        {/* Contenido */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
