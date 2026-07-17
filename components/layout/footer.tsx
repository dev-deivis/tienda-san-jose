import Link from 'next/link';
import type { Dictionary } from '@/app/[locale]/dictionaries';

type Props = { dict: Dictionary['footer']; locale: string };

export function Footer({ dict, locale }: Props) {
  const enlaces = [
    { label: dict.links.contactUs, href: `/${locale}/contacto` },
    { label: dict.links.shippingReturns, href: `/${locale}/envios` },
    { label: dict.links.privacyPolicy, href: `/${locale}/privacidad` },
    { label: dict.links.ourMission, href: `/${locale}/mision` },
  ];

  return (
    <footer className="bg-purple-50 border-t border-purple-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Columna marca */}
          <div>
            <span className="font-serif text-2xl font-bold text-brand-purple">
              {dict.brandName}
            </span>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed max-w-xs">
              {dict.tagline}
            </p>
            <p className="mt-4 text-sm text-gray-500">{dict.location}</p>
            <p className="text-sm text-gray-500">{dict.phone}</p>
          </div>

          {/* Columna enlaces */}
          <div>
            <h4 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4">
              {dict.linksTitle}
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
          {dict.copyright}
        </div>
      </div>
    </footer>
  );
}
