import Link from 'next/link';

const enlaces = [
  { label: 'Contact Us', href: '/contacto' },
  { label: 'Shipping & Returns', href: '/envios' },
  { label: 'Privacy Policy', href: '/privacidad' },
  { label: 'Our Mission', href: '/mision' },
  { label: 'Wholesale', href: '/mayoreo' },
];

export function Footer() {
  return (
    <footer className="bg-purple-50 border-t border-purple-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Columna marca */}
          <div>
            <span className="font-serif text-2xl font-bold text-brand-purple">
              Tienda San José
            </span>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed max-w-xs">
              Artículos religiosos para celebrar la fe y los momentos más sagrados de tu familia,
              con amor y devoción desde Bonita Springs.
            </p>
            <p className="mt-4 text-sm text-gray-500">Bonita Springs, FL</p>
            <p className="text-sm text-gray-500">(239) 676-5364</p>
          </div>

          {/* Columna enlaces */}
          <div>
            <h4 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4">
              ENLACES
            </h4>
            <ul className="space-y-2">
              {enlaces.map((e) => (
                <li key={e.href}>
                  <Link
                    href={e.href}
                    className="text-sm text-gray-600 hover:text-brand-purple transition-colors"
                  >
                    {e.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Línea inferior */}
        <div className="mt-10 pt-6 border-t border-purple-100 text-center text-xs text-gray-400">
          &copy; 2026 Tienda San José. Dedicated to the Holy Family.
        </div>
      </div>
    </footer>
  );
}
