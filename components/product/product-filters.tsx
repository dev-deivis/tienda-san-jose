'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import type { Dictionary } from '@/app/[locale]/dictionaries';

type FilterAttribute = {
  key: string;
  label: string;
  values: string[];
};

type Props = {
  filterAttributes: FilterAttribute[];
  maxProductPrice: number;
  dict: Dictionary['filters'];
};

export function ProductFilters({ filterAttributes, maxProductPrice, dict }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [precioMin, setPrecioMin] = useState(searchParams.get('precioMin') ?? '');
  const [precioMax, setPrecioMax] = useState(searchParams.get('precioMax') ?? '');
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    filterAttributes.forEach(({ key }) => {
      const val = searchParams.get(key);
      init[key] = val ? val.split(',') : [];
    });
    return init;
  });

  function buildParams(overrides: Record<string, string | null> = {}) {
    const params = new URLSearchParams(searchParams.toString());
    // Eliminar page al filtrar
    params.delete('page');
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === null || v === '') params.delete(k);
      else params.set(k, v);
    });
    return params.toString();
  }

  function applyPriceFilter() {
    router.push(`${pathname}?${buildParams({ precioMin: precioMin || null, precioMax: precioMax || null })}`);
  }

  function toggleAttr(key: string, value: string) {
    const current = selectedAttrs[key] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];

    const newSelected = { ...selectedAttrs, [key]: next };
    setSelectedAttrs(newSelected);

    const paramValue = next.length > 0 ? next.join(',') : null;
    router.push(`${pathname}?${buildParams({ [key]: paramValue })}`);
  }

  function clearAll() {
    router.push(pathname);
    setPrecioMin('');
    setPrecioMax('');
    setSelectedAttrs(Object.fromEntries(filterAttributes.map(({ key }) => [key, []])));
  }

  const hasActiveFilters =
    precioMin || precioMax || Object.values(selectedAttrs).some((v) => v.length > 0);

  // Suprimir warning de variable no usada — maxProductPrice disponible para uso futuro (ej. slider)
  void maxProductPrice;

  return (
    <aside className="w-full">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-brand-gold" />
          {dict.title}
        </h2>
        {hasActiveFilters && (
          <button onClick={clearAll} className="text-xs text-brand-magenta hover:underline">
            {dict.clearAll}
          </button>
        )}
      </div>

      {/* Rango de precio */}
      <div className="mb-6 pb-6 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{dict.priceRange}</h3>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder={dict.min}
            value={precioMin}
            onChange={(e) => setPrecioMin(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
          />
          <span className="text-gray-400 text-sm">—</span>
          <input
            type="number"
            placeholder={dict.max}
            value={precioMax}
            onChange={(e) => setPrecioMax(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
          />
        </div>
        <button
          onClick={applyPriceFilter}
          className="mt-3 w-full py-2 rounded-lg bg-brand-purple text-white text-sm font-medium hover:bg-brand-purple-dark transition-colors"
        >
          {dict.apply}
        </button>
      </div>

      {/* Filtros de atributos dinámicos */}
      {filterAttributes.map(({ key, label, values }) => (
        <div key={key} className="mb-6 pb-6 border-b border-gray-100 last:border-0">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{label}</h3>
          <div className="flex flex-col gap-2">
            {values.map((val) => (
              <label key={val} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={(selectedAttrs[key] ?? []).includes(val)}
                  onChange={() => toggleAttr(key, val)}
                  className="w-4 h-4 accent-brand-purple rounded"
                />
                <span className="text-sm text-gray-600 group-hover:text-brand-purple transition-colors">
                  {val}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
