'use client';

import { useState } from 'react';
import type { Dictionary } from '@/app/[locale]/dictionaries';

type Props = {
  descripcion: string | null;
  categorySlug: string;
  dict: Dictionary['product'];
};

type TabKey = 'description' | 'shipping' | 'care';

function getCareText(slug: string, dict: Dictionary['product']): string {
  if (slug.includes('plata') || slug.includes('oro') || slug.includes('joyeria')) {
    return dict.careJewelry;
  }
  if (slug.includes('velas')) {
    return dict.careCandles;
  }
  if (slug.includes('ropa')) {
    return dict.careClothing;
  }
  return dict.careDefault;
}

export function ProductTabs({ descripcion, categorySlug, dict }: Props) {
  const [active, setActive] = useState<TabKey>('description');

  const tabLabels: Record<TabKey, string> = {
    description: dict.tabDescription,
    shipping: dict.tabShipping,
    care: dict.tabCare,
  };

  const content: Record<TabKey, string> = {
    description: descripcion ?? dict.noDescription,
    shipping: dict.shippingText,
    care: getCareText(categorySlug, dict),
  };

  const TAB_KEYS: TabKey[] = ['description', 'shipping', 'care'];

  return (
    <div className="mt-12">
      {/* Tab buttons */}
      <div className="flex border-b border-gray-200">
        {TAB_KEYS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              active === tab
                ? 'border-brand-purple text-brand-purple'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>
      {/* Tab content */}
      <div className="py-6 text-gray-600 leading-relaxed text-sm max-w-3xl">
        {content[active]}
      </div>
    </div>
  );
}
