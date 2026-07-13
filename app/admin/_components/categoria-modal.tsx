'use client';

import { useState, useEffect } from 'react';
import { X, Save, Plus, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/product/image-upload';

type Categoria = {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  imagen: string | null;
  _count: { products: number };
};

function toSlug(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// Modal para crear/editar categoría
type CategoriaFormModalProps = {
  categoria?: Categoria;
  onClose: () => void;
};

export function CategoriaFormModal({ categoria, onClose }: CategoriaFormModalProps) {
  const [nombre, setNombre] = useState(categoria?.nombre ?? '');
  const [slug, setSlug] = useState(categoria?.slug ?? '');
  const [descripcion, setDescripcion] = useState(categoria?.descripcion ?? '');
  const [imagen, setImagen] = useState(categoria?.imagen ?? '');
  const [imagenSubiendo, setImagenSubiendo] = useState(false);
  const [slugManual, setSlugManual] = useState(!!categoria);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Autogenerar slug cuando cambia el nombre (solo si no fue editado manualmente)
  useEffect(() => {
    if (!slugManual) {
      setSlug(toSlug(nombre));
    }
  }, [nombre, slugManual]);

  const handleSlugChange = (val: string) => {
    setSlugManual(true);
    setSlug(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const body = {
      nombre: nombre.trim(),
      slug: slug.trim(),
      descripcion: descripcion.trim() || null,
      imagen: imagen.trim() || null,
    };

    try {
      const url = categoria ? `/api/categories/${categoria.id}` : '/api/categories';
      const method = categoria ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        onClose();
        router.refresh();
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error ?? 'Error al guardar la categoría.');
      }
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">
            {categoria ? 'Editar categoría' : 'Nueva categoría'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
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
              placeholder="Ej. Ropa de mujer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-1">(identificador URL)</span>
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40 focus:border-brand-purple font-mono"
              placeholder="ropa-de-mujer"
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
              placeholder="Descripción opcional de la categoría"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imagen
            </label>
            <ImageUpload
              value={imagen}
              onChange={setImagen}
              onUploadingChange={setImagenSubiendo}
              folder="tienda-san-jose/categorias"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
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
              {imagenSubiendo ? 'Esperando imagen…' : loading ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal de confirmación de eliminación
type DeleteCategoriaModalProps = {
  categoria: Categoria;
  onClose: () => void;
};

export function DeleteCategoriaModal({ categoria, onClose }: DeleteCategoriaModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const tieneProductos = categoria._count.products > 0;

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/categories/${categoria.id}`, { method: 'DELETE' });
      if (res.ok) {
        onClose();
        router.refresh();
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error ?? 'Error al eliminar.');
      }
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Eliminar categoría</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {tieneProductos ? (
          <>
            <p className="text-sm text-gray-600 mb-2">
              La categoría <strong className="text-gray-800">{categoria.nombre}</strong> tiene{' '}
              <strong>{categoria._count.products}</strong>{' '}
              {categoria._count.products === 1 ? 'producto asociado' : 'productos asociados'}.
            </p>
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-5">
              Eliminarla no es posible mientras tenga productos. Reasigna o elimina los productos primero.
            </p>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Entendido
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-1">
              ¿Estás seguro que deseas eliminar la categoría{' '}
              <strong className="text-gray-800">{categoria.nombre}</strong>?
            </p>
            <p className="text-xs text-red-600 mb-5">Esta acción no se puede deshacer.</p>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Botones de acción de la tarjeta (necesitan estado de modal)
type CategoriaCardActionsProps = {
  categoria: Categoria;
};

export function CategoriaCardActions({ categoria }: CategoriaCardActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-1 text-xs text-brand-purple hover:text-brand-purple-dark transition-colors"
        >
          <Pencil size={12} />
          Editar
        </button>
        <button
          onClick={() => setDeleteOpen(true)}
          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 transition-colors ml-auto"
        >
          Eliminar
        </button>
      </div>

      {editOpen && (
        <CategoriaFormModal categoria={categoria} onClose={() => setEditOpen(false)} />
      )}
      {deleteOpen && (
        <DeleteCategoriaModal categoria={categoria} onClose={() => setDeleteOpen(false)} />
      )}
    </>
  );
}

// Tarjeta de crear nueva categoría
export function NuevaCategoriaCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-brand-purple hover:bg-brand-purple/5 transition-colors p-6 text-gray-400 hover:text-brand-purple cursor-pointer min-h-[180px]"
      >
        <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center">
          <Plus size={24} />
        </div>
        <span className="text-sm font-medium">Crear nueva categoría</span>
      </button>

      {open && <CategoriaFormModal onClose={() => setOpen(false)} />}
    </>
  );
}
