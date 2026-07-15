'use client';

import { useState } from 'react';
import { Pencil, X, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import MultiImageUpload from '@/components/product/multi-image-upload';
import AttributesEditor, {
  type AttributeRow,
  objectToRows,
  validateRows,
  rowsToObject,
} from './attributes-editor';

type Category = { id: number; nombre: string; slug: string };

type ProductImageItem = { id: number; url: string; orden: number };

type Product = {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  imagen: string | null;
  categoryId: number;
  category: Category;
  images: ProductImageItem[];
  attributes: unknown;
};

type Props = {
  product: Product;
  categories: Category[];
};

export default function EditProductModal({ product, categories }: Props) {
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState(product.nombre);
  const [descripcion, setDescripcion] = useState(product.descripcion ?? '');
  const [precio, setPrecio] = useState(product.precio.toString());
  const [stock, setStock] = useState(product.stock.toString());
  const [categoryId, setCategoryId] = useState(product.categoryId.toString());
  const [attributeRows, setAttributeRows] = useState<AttributeRow[]>(() =>
    objectToRows(product.attributes)
  );
  const [imagenSubiendo, setImagenSubiendo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const attrError = validateRows(attributeRows);
    if (attrError) {
      setError(attrError);
      return;
    }

    setLoading(true);

    const attributes = rowsToObject(attributeRows);

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          descripcion: descripcion || null,
          precio: parseFloat(precio),
          stock: parseInt(stock, 10),
          categoryId: parseInt(categoryId, 10),
          attributes: Object.keys(attributes).length > 0 ? attributes : null,
        }),
      });

      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error ?? 'Error al actualizar el producto.');
      }
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-brand-purple hover:text-brand-purple-dark transition-colors"
        title="Editar producto"
      >
        <Pencil size={14} />
        Editar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Editar producto</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40 focus:border-brand-purple"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40 focus:border-brand-purple resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40 focus:border-brand-purple"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40 focus:border-brand-purple"
                  />
                </div>
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
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Atributos del producto
                </label>
                <AttributesEditor rows={attributeRows} onChange={setAttributeRows} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Imágenes del producto
                </label>
                <MultiImageUpload
                  productId={product.id}
                  initialImages={product.images}
                  onUploadingChange={setImagenSubiendo}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || imagenSubiendo}
                  className="flex items-center gap-2 px-5 py-2 text-sm bg-brand-purple text-white rounded-md hover:bg-brand-purple-dark transition-colors disabled:opacity-50"
                >
                  <Save size={14} />
                  {imagenSubiendo ? 'Esperando imagen…' : loading ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
