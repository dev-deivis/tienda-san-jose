'use client';

import { useRef, useState } from 'react';
import { ImageIcon, X, Plus, Loader2 } from 'lucide-react';

type ProductImageItem = { id: number; url: string; orden: number };
type TempImage = { tempId: string; url: string };

type Props = {
  productId?: number;
  initialImages?: ProductImageItem[];
  onChange?: (urls: string[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
};

const MAX_IMAGES = 5;

export default function MultiImageUpload({
  productId,
  initialImages = [],
  onChange,
  onUploadingChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Modo edición: imágenes persistidas en BD
  const [images, setImages] = useState<ProductImageItem[]>(initialImages);

  // Modo nuevo producto: imágenes solo en memoria
  const [tempImages, setTempImages] = useState<TempImage[]>([]);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = productId !== undefined;
  const currentCount = isEditMode ? images.length : tempImages.length;
  const canAddMore = currentCount < MAX_IMAGES;

  const setUploadingState = (val: boolean) => {
    setUploading(val);
    onUploadingChange?.(val);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar 5 MB.');
      return;
    }

    setError(null);
    setUploadingState(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (isEditMode) {
        formData.append('productId', String(productId));
      }

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = (await res.json()) as {
        url?: string;
        productImage?: ProductImageItem;
        error?: string;
      };

      if (!res.ok || !data.url) {
        setError(data.error ?? 'Error al subir la imagen.');
        return;
      }

      if (isEditMode && data.productImage) {
        setImages((prev) => [...prev, data.productImage!]);
      } else {
        const tempId = `temp-${Date.now()}-${Math.random()}`;
        const nextTempImages = [...tempImages, { tempId, url: data.url! }];
        setTempImages(nextTempImages);
        onChange?.(nextTempImages.map((t) => t.url));
      }
    } catch {
      setError('Error de conexión al subir la imagen.');
    } finally {
      setUploadingState(false);
    }
  };

  const handleDelete = async (imageId: number) => {
    if (!isEditMode) return;
    setError(null);

    try {
      const res = await fetch(`/api/products/${productId}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId }),
      });

      if (res.ok) {
        setImages((prev) => prev.filter((img) => img.id !== imageId));
      } else {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? 'Error al eliminar la imagen.');
      }
    } catch {
      setError('Error de conexión al eliminar la imagen.');
    }
  };

  const handleDeleteTemp = (tempId: string) => {
    const next = tempImages.filter((t) => t.tempId !== tempId);
    setTempImages(next);
    onChange?.(next.map((t) => t.url));
  };

  const displayItems = isEditMode
    ? images.map((img) => ({ key: String(img.id), url: img.url, id: img.id }))
    : tempImages.map((t) => ({ key: t.tempId, url: t.url, id: null as null }));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {/* Thumbnails existentes */}
        {displayItems.map((item) => (
          <div key={item.key} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt="Imagen de producto"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => {
                if (item.id !== null) {
                  void handleDelete(item.id);
                } else {
                  handleDeleteTemp(item.key);
                }
              }}
              className="absolute top-1 right-1 p-0.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              aria-label="Eliminar imagen"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {/* Slot para agregar */}
        {canAddMore && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-brand-purple hover:text-brand-purple transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <Plus size={20} />
                <span className="text-xs">Agregar</span>
              </>
            )}
          </button>
        )}

        {/* Mensaje máximo alcanzado */}
        {!canAddMore && (
          <div className="aspect-square rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
            <span className="text-xs text-gray-400 text-center px-2">
              Máximo 5 imágenes
            </span>
          </div>
        )}

        {/* Placeholder cuando no hay imágenes */}
        {displayItems.length === 0 && !canAddMore && (
          <div className="col-span-3 flex flex-col items-center justify-center py-6 text-gray-300 gap-2">
            <ImageIcon size={36} strokeWidth={1} />
            <span className="text-sm text-gray-400">Sin imágenes</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
