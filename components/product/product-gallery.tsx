'use client';

import { useState } from 'react';
import { ImageIcon } from 'lucide-react';

type ProductImageItem = { id: number; url: string; orden: number };

type Props = {
  images: ProductImageItem[];
  productName: string;
};

export function ProductGallery({ images, productName }: Props) {
  const [selected, setSelected] = useState(0);

  // Sin imágenes: placeholder
  if (images.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="aspect-square rounded-2xl overflow-hidden bg-white shadow-sm flex items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-3 text-gray-300 w-full h-full bg-gray-50">
            <ImageIcon size={64} strokeWidth={1} />
            <span className="text-sm text-gray-400">Sin imagen disponible</span>
          </div>
        </div>
      </div>
    );
  }

  const activeImage = images[selected] ?? images[0];

  return (
    <div className="flex flex-col gap-4">
      {/* Imagen principal */}
      <div className="aspect-square rounded-2xl overflow-hidden bg-white shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeImage.url}
          alt={productName}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Miniaturas (solo si hay más de una imagen) */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelected(idx)}
              className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                idx === selected
                  ? 'border-brand-purple'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={`${productName} imagen ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
