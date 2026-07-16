'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ArrowUpDown } from 'lucide-react';
import type { Dictionary } from '@/app/[locale]/dictionaries';

type Props = {
  dict: Dictionary['sort'];
};

export function SortDropdown({ dict }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get('sort') ?? 'destacados';

  const sortOptions = [
    { value: 'destacados', label: dict.featured },
    { value: 'precio-asc', label: dict.priceAsc },
    { value: 'precio-desc', label: dict.priceDesc },
    { value: 'nombre-asc', label: dict.nameAsc },
  ];

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (value === 'destacados') params.delete('sort');
    else params.set('sort', value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown size={16} className="text-gray-400" />
      <select
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-purple/30 text-gray-700 cursor-pointer"
      >
        {sortOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
