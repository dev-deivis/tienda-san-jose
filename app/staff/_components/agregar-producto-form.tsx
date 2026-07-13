'use client';

import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import MultiImageUpload from '@/components/product/multi-image-upload';

type Category = { id: number; nombre: string; slug: string };

type Props = {
  categories: Category[];
};

export default function AgregarProductoForm({ categories }: Props) {
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('0');
  const [categoryId, setCategoryId] = useState('');
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [imagenSubiendo, setImagenSubiendo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          precio: parseFloat(precio),
          stock: parseInt(stock, 10),
          categoryId: parseInt(categoryId, 10),
          imagenes: imagenes.length > 0 ? imagenes : undefined,
        }),
      });

      if (res.ok) {
        setFeedback({ type: 'success', msg: 'Producto creado exitosamente.' });
        setNombre('');
        setPrecio('');
        setStock('0');
        setCategoryId('');
        setImagenes([]);
      } else {
        const data = await res.json() as { error?: string };
        setFeedback({ type: 'error', msg: data.error ?? 'Error al crear el producto.' });
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Error de conexión.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {feedback && (
        <div
          className={`px-4 py-2.5 rounded-md text-sm ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {feedback.msg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del producto <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Rosario de madera"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40 focus:border-brand-purple"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoría <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40 focus:border-brand-purple bg-white"
          >
            <option value="">Selecciona una categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio (USD) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            placeholder="0.00"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40 focus:border-brand-purple"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stock inicial
          </label>
          <input
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="0"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40 focus:border-brand-purple"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Imágenes del producto
        </label>
        <MultiImageUpload
          onChange={setImagenes}
          onUploadingChange={setImagenSubiendo}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || imagenSubiendo}
          className="flex items-center gap-2 bg-brand-purple text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-brand-purple-dark transition-colors disabled:opacity-50"
        >
          <PlusCircle size={16} />
          {imagenSubiendo ? 'Esperando imagen…' : loading ? 'Guardando…' : 'Agregar producto'}
        </button>
      </div>
    </form>
  );
}
