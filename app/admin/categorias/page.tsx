import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import { FolderTree } from 'lucide-react';
import { CategoriaCardActions, NuevaCategoriaCard } from '@/app/admin/_components/categoria-modal';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriasPage() {
  const categorias = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { nombre: 'asc' },
  });

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-gray-800">Categorías</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {categorias.length} categoría{categorias.length !== 1 ? 's' : ''} registrada{categorias.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Grid de categorías */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categorias.map((cat) => (
          <div
            key={cat.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
          >
            {/* Imagen */}
            <div className="w-full h-36 bg-gray-100 flex-shrink-0 overflow-hidden">
              {cat.imagen ? (
                <Image
                  src={cat.imagen}
                  alt={cat.nombre}
                  width={300}
                  height={144}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FolderTree size={36} className="text-gray-300" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col flex-1">
              <h3 className="font-semibold text-gray-800 text-sm mb-0.5">{cat.nombre}</h3>
              <p className="text-xs text-gray-400 font-mono mb-2 truncate">{cat.slug}</p>
              {cat.descripcion && (
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">{cat.descripcion}</p>
              )}
              <span className="inline-flex items-center text-xs text-gray-400 mt-auto">
                {cat._count.products} producto{cat._count.products !== 1 ? 's' : ''}
              </span>

              {/* Acciones (client component) */}
              <CategoriaCardActions
                categoria={{
                  id: cat.id,
                  nombre: cat.nombre,
                  slug: cat.slug,
                  descripcion: cat.descripcion ?? null,
                  imagen: cat.imagen ?? null,
                  _count: cat._count,
                }}
              />
            </div>
          </div>
        ))}

        {/* Tarjeta crear nueva */}
        <NuevaCategoriaCard />
      </div>
    </div>
  );
}
