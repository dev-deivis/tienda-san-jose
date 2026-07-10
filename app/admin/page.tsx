import { prisma } from '@/lib/prisma';
import { DollarSign, ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react';

export default async function AdminDashboardPage() {
  const now = new Date();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);

  // KPI 1: Ventas del mes (sum total de ordenes no canceladas este mes)
  const ventasMes = await prisma.order.aggregate({
    where: {
      createdAt: { gte: inicioMes },
      status: { not: 'cancelled' },
    },
    _sum: { total: true },
  });
  const ventasMesValor = parseFloat((ventasMes._sum.total ?? 0).toString());

  // KPI 2: Pedidos pendientes
  const pedidosPendientes = await prisma.order.count({
    where: { status: 'pending' },
  });

  // KPI 3 + Tabla: Top 5 productos más vendidos del mes
  const topProductosRaw = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      order: {
        createdAt: { gte: inicioMes },
        status: { not: 'cancelled' },
      },
    },
    _sum: { cantidad: true },
    orderBy: { _sum: { cantidad: 'desc' } },
    take: 5,
  });

  // Obtener detalles de los productos del top
  const topProductIds = topProductosRaw.map((r) => r.productId);
  const topProductosDetalle = topProductIds.length > 0
    ? await prisma.product.findMany({
        where: { id: { in: topProductIds } },
        select: { id: true, nombre: true, category: { select: { nombre: true } } },
      })
    : [];

  const topProductos = topProductosRaw.map((r) => {
    const detalle = topProductosDetalle.find((p) => p.id === r.productId);
    return {
      productId: r.productId,
      nombre: detalle?.nombre ?? 'Producto eliminado',
      categoria: detalle?.category.nombre ?? '—',
      unidades: r._sum.cantidad ?? 0,
    };
  });

  const productoMasVendido = topProductos.length > 0 ? topProductos[0].nombre : 'Sin datos todavía';

  // KPI 4: Productos con stock bajo (< 10)
  const stockBajoCount = await prisma.product.count({
    where: { stock: { lt: 10 } },
  });

  // Tabla: Productos con stock bajo
  const productosStockBajo = await prisma.product.findMany({
    where: { stock: { lt: 10 } },
    select: {
      id: true,
      nombre: true,
      stock: true,
      category: { select: { nombre: true } },
    },
    orderBy: { stock: 'asc' },
  });

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-gray-800 mb-1">Dashboard</h2>
        <p className="text-sm text-gray-500">
          Métricas del mes de{' '}
          {now.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Ventas del mes */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Ventas del mes</span>
            <div className="w-9 h-9 rounded-full bg-brand-purple/10 flex items-center justify-center">
              <DollarSign size={16} className="text-brand-purple" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${ventasMesValor.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-400 mt-1">Órdenes no canceladas</p>
        </div>

        {/* Pedidos pendientes */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Pedidos pendientes</span>
            <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
              <ShoppingCart size={16} className="text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{pedidosPendientes}</p>
          <p className="text-xs text-gray-400 mt-1">Esperando procesamiento</p>
        </div>

        {/* Producto más vendido */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Más vendido del mes</span>
            <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center">
              <TrendingUp size={16} className="text-green-600" />
            </div>
          </div>
          <p className="text-base font-bold text-gray-900 line-clamp-2 leading-tight">
            {productoMasVendido}
          </p>
          {topProductos.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {topProductos[0].unidades} unidades vendidas
            </p>
          )}
        </div>

        {/* Stock bajo */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Alertas de stock</span>
            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle size={16} className="text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stockBajoCount}</p>
          <p className="text-xs text-gray-400 mt-1">Productos con stock &lt; 10</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 productos más vendidos del mes */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
            <TrendingUp size={16} className="text-brand-purple" />
            <h3 className="font-semibold text-gray-800 text-sm">
              Top 5 productos más vendidos del mes
            </h3>
          </div>
          {topProductos.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">
              No hay ventas registradas este mes.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Producto</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoría</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Unidades</th>
                  </tr>
                </thead>
                <tbody>
                  {topProductos.map((p, i) => (
                    <tr key={p.productId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-400 font-mono">{i + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{p.nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{p.categoria}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800 text-right">{p.unidades}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Productos con stock bajo */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
            <AlertTriangle size={16} className="text-red-500" />
            <h3 className="font-semibold text-gray-800 text-sm">Productos con stock bajo</h3>
          </div>
          {productosStockBajo.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">
              Todos los productos tienen stock suficiente.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Producto</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoría</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {productosStockBajo.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{p.nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{p.category.nombre}</td>
                      <td className="px-4 py-3 text-right">
                        {p.stock === 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            Sin stock
                          </span>
                        ) : (
                          <span className="text-sm font-semibold text-amber-600">{p.stock}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
