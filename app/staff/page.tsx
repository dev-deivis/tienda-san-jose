import { prisma } from '@/lib/prisma';
import { ShoppingCart, Package } from 'lucide-react';
import PedidoRow from './_components/pedido-row';
import AgregarProductoForm from './_components/agregar-producto-form';

export default async function StaffHomePage() {
  // Últimos 5 pedidos pendientes o en proceso
  const pedidosRecientes = await prisma.order.findMany({
    where: { status: { in: ['pending', 'processing'] } },
    include: { user: { select: { email: true, nombre: true } } },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const pedidosSerialized = pedidosRecientes.map((o) => ({
    ...o,
    total: parseFloat(o.total.toString()),
    createdAt: o.createdAt.toISOString(),
  }));

  // Categorías para el formulario de producto
  const categories = await prisma.category.findMany({
    select: { id: true, nombre: true, slug: true },
    orderBy: { nombre: 'asc' },
  });

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-gray-800 mb-1">
          Vista general
        </h2>
        <p className="text-sm text-gray-500">
          Resumen rápido del estado de la tienda.
        </p>
      </div>

      {/* Sección: Pedidos recientes */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
          <ShoppingCart size={18} className="text-brand-purple" />
          <h3 className="font-semibold text-gray-800">Pedidos pendientes recientes</h3>
          <span className="ml-auto text-xs text-gray-400">
            Mostrando hasta 5 pedidos pendientes o en proceso
          </span>
        </div>

        {pedidosSerialized.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">
            No hay pedidos pendientes en este momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#ID</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acción</th>
                </tr>
              </thead>
              <tbody>
                {pedidosSerialized.map((order) => (
                  <PedidoRow key={order.id} order={order} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Sección: Agregar producto rápido */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
          <Package size={18} className="text-brand-purple" />
          <h3 className="font-semibold text-gray-800">Agregar producto rápido</h3>
        </div>
        <div className="px-6 py-5">
          {categories.length === 0 ? (
            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-4 py-3">
              No hay categorías disponibles. Crea una categoría antes de agregar productos.
            </p>
          ) : (
            <AgregarProductoForm categories={categories} />
          )}
        </div>
      </section>
    </div>
  );
}
