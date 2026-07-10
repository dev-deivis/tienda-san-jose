'use client';

import { useState, useCallback, useEffect } from 'react';
import { DollarSign, ShoppingCart, TrendingUp, Package, Download, RefreshCw } from 'lucide-react';

type ReporteData = {
  ventasTotales: number;
  pedidosTotales: number;
  ticketPromedio: number;
  unidadesVendidas: number;
  topProductos: { productId: number; nombre: string; categoria: string; unidades: number; ingresos: number }[];
  ventasPorCategoria: { categoria: string; unidades: number; ingresos: number }[];
};

type RangoPreset = 'hoy' | 'semana' | 'mes' | 'personalizado';

function getRangoDates(rango: RangoPreset): { from: Date; to: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (rango) {
    case 'hoy':
      return { from: today, to: new Date(today.getTime() + 86400000 - 1) };
    case 'semana': {
      const dayOfWeek = now.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
      return { from: monday, to: new Date(now.getTime()) };
    }
    case 'mes':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: new Date(now.getTime()) };
    default:
      return { from: today, to: new Date(now.getTime()) };
  }
}

function formatISO(date: Date): string {
  return date.toISOString();
}

function toInputDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function downloadCSV(data: string, filename: string) {
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminReportesPage() {
  const [rango, setRango] = useState<RangoPreset>('mes');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [data, setData] = useState<ReporteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReporte = useCallback(async (from: Date, to: Date) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/reports?from=${encodeURIComponent(formatISO(from))}&to=${encodeURIComponent(formatISO(to))}`
      );
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setError(d.error ?? 'Error al cargar reporte.');
        return;
      }
      setData(await res.json() as ReporteData);
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial con "mes"
  useEffect(() => {
    const { from, to } = getRangoDates('mes');
    fetchReporte(from, to);
  }, [fetchReporte]);

  const handlePreset = (preset: RangoPreset) => {
    setRango(preset);
    if (preset !== 'personalizado') {
      const { from, to } = getRangoDates(preset);
      fetchReporte(from, to);
    }
  };

  const handleCustomApply = () => {
    if (!customFrom || !customTo) return;
    const from = new Date(customFrom);
    const to = new Date(customTo);
    to.setHours(23, 59, 59, 999);
    fetchReporte(from, to);
  };

  const handleExportCSV = () => {
    if (!data) return;

    const fechaStr = new Date().toISOString().split('T')[0];
    let csv = 'REPORTE TIENDA SAN JOSÉ\n';
    csv += `Generado el: ${new Date().toLocaleString('es-MX')}\n\n`;

    csv += 'RESUMEN\n';
    csv += 'Concepto,Valor\n';
    csv += `Ventas totales,$${data.ventasTotales.toFixed(2)}\n`;
    csv += `Pedidos totales,${data.pedidosTotales}\n`;
    csv += `Ticket promedio,$${data.ticketPromedio.toFixed(2)}\n`;
    csv += `Unidades vendidas,${data.unidadesVendidas}\n\n`;

    csv += 'TOP 10 PRODUCTOS\n';
    csv += 'Producto,Categoría,Unidades,Ingresos\n';
    for (const p of data.topProductos) {
      csv += `"${p.nombre}","${p.categoria}",${p.unidades},$${p.ingresos.toFixed(2)}\n`;
    }
    csv += '\n';

    csv += 'VENTAS POR CATEGORÍA\n';
    csv += 'Categoría,Unidades,Ingresos\n';
    for (const c of data.ventasPorCategoria) {
      csv += `"${c.categoria}",${c.unidades},$${c.ingresos.toFixed(2)}\n`;
    }

    downloadCSV(csv, `reporte-${fechaStr}.csv`);
  };

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-gray-800">Reportes</h2>
          <p className="text-sm text-gray-500 mt-0.5">Análisis de ventas por rango de fechas</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={!data || loading}
          className="flex items-center gap-2 text-sm text-white bg-brand-purple px-4 py-2 rounded-md hover:bg-brand-purple-dark transition-colors disabled:opacity-50"
        >
          <Download size={14} />
          Exportar CSV
        </button>
      </div>

      {/* Selector de rango */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {(['hoy', 'semana', 'mes', 'personalizado'] as RangoPreset[]).map((preset) => (
            <button
              key={preset}
              onClick={() => handlePreset(preset)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                rango === preset
                  ? 'bg-brand-purple text-white border-brand-purple'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-brand-purple hover:text-brand-purple'
              }`}
            >
              {preset === 'hoy' ? 'Hoy' : preset === 'semana' ? 'Esta semana' : preset === 'mes' ? 'Este mes' : 'Rango personalizado'}
            </button>
          ))}
        </div>

        {rango === 'personalizado' && (
          <div className="flex flex-wrap items-end gap-3 mt-3 pt-3 border-t border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Desde</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40 focus:border-brand-purple"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40 focus:border-brand-purple"
              />
            </div>
            <button
              onClick={handleCustomApply}
              disabled={!customFrom || !customTo || loading}
              className="flex items-center gap-2 px-4 py-1.5 text-sm bg-brand-purple text-white rounded-md hover:bg-brand-purple-dark transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Aplicar
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 animate-pulse">
              <div className="h-3 w-24 bg-gray-200 rounded mb-4" />
              <div className="h-7 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Datos */}
      {data && !loading && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500">Ventas totales</span>
                <DollarSign size={16} className="text-brand-purple" />
              </div>
              <p className="text-xl font-bold text-gray-900">
                ${data.ventasTotales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500">Pedidos totales</span>
                <ShoppingCart size={16} className="text-brand-magenta" />
              </div>
              <p className="text-xl font-bold text-gray-900">{data.pedidosTotales}</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500">Ticket promedio</span>
                <TrendingUp size={16} className="text-green-600" />
              </div>
              <p className="text-xl font-bold text-gray-900">
                ${data.ticketPromedio.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500">Unidades vendidas</span>
                <Package size={16} className="text-amber-600" />
              </div>
              <p className="text-xl font-bold text-gray-900">{data.unidadesVendidas}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 10 productos */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
                <TrendingUp size={16} className="text-brand-purple" />
                <h3 className="font-semibold text-gray-800 text-sm">Top 10 productos más vendidos</h3>
              </div>
              {data.topProductos.length === 0 ? (
                <div className="px-6 py-10 text-center text-gray-400 text-sm">
                  Sin datos en este rango.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Producto</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Uds.</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Ingresos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topProductos.map((p, i) => (
                        <tr key={p.productId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-400 font-mono">{i + 1}</td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-800 line-clamp-1">{p.nombre}</div>
                            <div className="text-xs text-gray-400">{p.categoria}</div>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-800 text-right">{p.unidades}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-800 text-right">
                            ${p.ingresos.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Ventas por categoría */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
                <Package size={16} className="text-brand-purple" />
                <h3 className="font-semibold text-gray-800 text-sm">Ventas por categoría</h3>
              </div>
              {data.ventasPorCategoria.length === 0 ? (
                <div className="px-6 py-10 text-center text-gray-400 text-sm">
                  Sin datos en este rango.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoría</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Unidades</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Ingresos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.ventasPorCategoria.map((c) => (
                        <tr key={c.categoria} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-800">{c.categoria}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">{c.unidades}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-800 text-right">
                            ${c.ingresos.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
