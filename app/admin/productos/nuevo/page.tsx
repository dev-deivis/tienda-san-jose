import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AgregarProductoForm from '@/app/staff/_components/agregar-producto-form';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default async function AdminNuevoProductoPage() {
  const session = await getSessionUser();

  if (!session || session.role !== 'ADMIN') {
    redirect('/admin');
  }

  const categories = await prisma.category.findMany({
    select: { id: true, nombre: true, slug: true },
    orderBy: { nombre: 'asc' },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/productos"
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="font-serif text-2xl font-semibold text-gray-800">Nuevo producto</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Completa la información del nuevo producto
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-5">
        {categories.length === 0 ? (
          <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-4 py-3">
            No hay categorías disponibles. Crea una categoría antes de agregar productos.
          </p>
        ) : (
          <AgregarProductoForm categories={categories} />
        )}
      </div>
    </div>
  );
}
