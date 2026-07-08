'use client';

import { useState } from 'react';

type Props = {
  productId: number;
  productName: string;
};

export function ProductGallery({ productId, productName }: Props) {
  const images = [
    `https://picsum.photos/seed/product-${productId}/600/600`,
    `https://picsum.photos/seed/product-${productId}-2/600/600`,
    `https://picsum.photos/seed/product-${productId}-3/600/600`,
    `https://picsum.photos/seed/product-${productId}-4/600/600`,
  ];

  const [selected, setSelected] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      {/* Imagen principal */}
      <div className="aspect-square rounded-2xl overflow-hidden bg-white shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[selected]}
          alt={productName}
          className="w-full h-full object-cover"
        />
      </div>
      {/* Miniaturas */}
      <div className="grid grid-cols-4 gap-3">
        {images.map((src, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
              selected === i
                ? 'border-brand-purple shadow-md'
                : 'border-transparent hover:border-brand-gold/50'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Vista ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
