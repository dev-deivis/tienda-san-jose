'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Dictionary } from '@/app/[locale]/dictionaries';

type Props = {
  currentPage: number;
  totalPages: number;
  dict: Dictionary['pagination'];
};

export function Pagination({ currentPage, totalPages, dict }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function goTo(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) params.delete('page');
    else params.set('page', String(page));
    router.push(`${pathname}?${params.toString()}`);
  }

  const pageLabel = dict.page
    .replace('{current}', String(currentPage))
    .replace('{total}', String(totalPages));

  return (
    <div className="flex items-center justify-center gap-3 mt-12">
      <button
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage <= 1}
        className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-brand-purple hover:text-brand-purple disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={16} /> {dict.previous}
      </button>

      <span className="text-sm text-gray-500">{pageLabel}</span>

      <button
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-brand-purple hover:text-brand-purple disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {dict.next} <ChevronRight size={16} />
      </button>
    </div>
  );
}
