'use client';

import { useRef, useState, useEffect, DragEvent, ChangeEvent } from 'react';
import { ImageIcon, Upload } from 'lucide-react';

type Props = {
  value: string;
  onChange: (url: string) => void;
  /** Notifica al padre si hay una subida en curso para que pueda bloquear el submit */
  onUploadingChange?: (uploading: boolean) => void;
  /** Carpeta de Cloudinary destino (default: tienda-san-jose/productos) */
  folder?: string;
};

export default function ImageUpload({ value, onChange, onUploadingChange, folder }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(value);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sincronizar el preview cuando el padre resetea el valor (ej. tras guardar)
  useEffect(() => {
    setPreview(value);
  }, [value]);

  const setUploadingState = (val: boolean) => {
    setUploading(val);
    onUploadingChange?.(val);
  };

  const processFile = async (file: File) => {
    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar 5MB');
      return;
    }

    // Preview inmediato
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploadingState(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (folder) formData.append('folder', folder);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = (await res.json()) as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        setError(data.error ?? 'Error al subir la imagen');
        setPreview(value); // revertir al valor anterior
        return;
      }

      // Limpiar el object URL del preview temporal y usar la URL definitiva
      URL.revokeObjectURL(objectUrl);
      setPreview(data.url);
      onChange(data.url);
    } catch {
      setError('Error de conexión al subir la imagen');
      setPreview(value);
    } finally {
      setUploadingState(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
    e.target.value = '';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="flex flex-col items-center gap-3 border-2 border-dashed border-gray-300 rounded-lg p-4 transition-colors hover:border-brand-purple/50 focus-within:ring-2 focus-within:ring-brand-purple/40"
      >
        {/* Preview o placeholder */}
        {preview ? (
          <div className="w-28 h-28 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Vista previa"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-28 h-28 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <ImageIcon size={36} className="text-gray-400" />
          </div>
        )}

        {/* Texto de instrucción */}
        <p className="text-xs text-gray-500 text-center">
          Arrastra una imagen aquí o usa el botón
        </p>

        {/* Botón para abrir selector de archivo */}
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <Upload size={14} />
          {preview ? 'Cambiar imagen' : 'Subir imagen'}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Indicador de carga */}
      {uploading && (
        <p className="text-xs text-brand-purple flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
          Subiendo…
        </p>
      )}

      {/* Mensaje de error */}
      {error && !uploading && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
