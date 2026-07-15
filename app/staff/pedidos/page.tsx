'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Package, Truck, X } from 'lucide-react';

type OrderUser = { email: string; nombre: string | null };
type OrderItem = {
  id: number;
  productId: number;
  cantidad: number;
  precioUnitario: number;
  product: { nombre: string };
};
type Order = {
  id: number;
  status: string;
  total: number;
  shippingCost: number;
  createdAt: string;
  shippingAddress: string;
  shippingMethod: string | null;
  shippoRateId: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  labelUrl: string | null;
  user: OrderUser;
  items: OrderItem[];
};

type ManualRate = {
  rateId: string;
  carrier: string;
  service: string;
  amount: number;
  days: number | null;
};

type ManualSelectionState = {
  orderId: number;
  originalService: string | null;
  originalPrice: number;
  rates: ManualRate[];
};

const STATUS_FILTERS = ['Todos', 'pending', 'processing', 'shipped', 'delivered'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  processing: 'En proceso',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const NEXT_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function StaffPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('Todos');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [generatingLabelId, setGeneratingLabelId] = useState<number | null>(null);
  const [labelError, setLabelError] = useState<{ id: number; msg: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualSelection, setManualSelection] = useState<ManualSelectionState | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) {
        setError('No autorizado o error al cargar pedidos.');
        return;
      }
      const data = await res.json() as Order[];
      setOrders(data);
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const changeStatus = async (orderId: number, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const applyLabelResult = (
    orderId: number,
    data: { labelUrl: string; trackingNumber: string | null; trackingUrl: string | null }
  ) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, labelUrl: data.labelUrl, trackingNumber: data.trackingNumber, trackingUrl: data.trackingUrl, status: 'shipped' }
          : o
      )
    );
  };

  const generateLabel = async (orderId: number, rateId?: string) => {
    setGeneratingLabelId(orderId);
    setLabelError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/generate-label`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rateId ? { rateId } : {}),
      });
      const data = await res.json() as {
        // éxito
        labelUrl?: string;
        trackingNumber?: string | null;
        trackingUrl?: string | null;
        // selección manual requerida
        requires_manual_selection?: boolean;
        original_service?: string | null;
        original_price?: number;
        rates?: ManualRate[];
        // error
        error?: string;
      };

      if (!res.ok) {
        setLabelError({ id: orderId, msg: data.error ?? 'Error al generar la etiqueta.' });
        return;
      }

      if (data.requires_manual_selection && data.rates) {
        setManualSelection({
          orderId,
          originalService: data.original_service ?? null,
          originalPrice: data.original_price ?? 0,
          rates: data.rates,
        });
        return;
      }

      if (data.labelUrl) {
        applyLabelResult(orderId, {
          labelUrl: data.labelUrl,
          trackingNumber: data.trackingNumber ?? null,
          trackingUrl: data.trackingUrl ?? null,
        });
        setManualSelection(null);
      }
    } catch {
      setLabelError({ id: orderId, msg: 'Error de conexión al generar la etiqueta.' });
    } finally {
      setGeneratingLabelId(null);
    }
  };

  const filtered =
    filter === 'Todos' ? orders : orders.filter((o) => o.status === filter);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-gray-800">Pedidos</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestiona y actualiza el estado de los pedidos
          </p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-gray-600 border border-gray-300 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Filtros por status */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              filter === s
                ? 'bg-brand-purple text-white border-brand-purple'
                : 'bg-white text-gray-600 border-gray-300 hover:border-brand-purple hover:text-brand-purple'
            }`}
          >
            {s === 'Todos' ? 'Todos' : (STATUS_LABEL[s] ?? s)}
            {s !== 'Todos' && (
              <span className="ml-1.5 text-xs opacity-70">
                ({orders.filter((o) => o.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm">
          {error}
        </div>
      ) : loading ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400 text-sm">
          Cargando pedidos…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400 text-sm">
          No hay pedidos{filter !== 'Todos' ? ` con status "${STATUS_LABEL[filter] ?? filter}"` : ''}.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#ID</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cambiar status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Etiqueta</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-mono text-gray-500">
                      #{order.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-800">
                        {order.user.nombre ?? order.user.email}
                      </div>
                      {order.user.nombre && (
                        <div className="text-xs text-gray-400">{order.user.email}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                      ${order.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_BADGE[order.status] ?? 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) => changeStatus(order.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-purple/40 focus:border-brand-purple disabled:opacity-50 cursor-pointer"
                      >
                        {NEXT_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s] ?? s}
                          </option>
                        ))}
                      </select>
                      {updatingId === order.id && (
                        <span className="ml-2 text-xs text-gray-400">Guardando…</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {order.labelUrl ? (
                        <div className="flex flex-col gap-1">
                          <a
                            href={order.labelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-brand-purple hover:underline"
                          >
                            <Package size={12} />
                            Descargar etiqueta
                          </a>
                          {order.trackingNumber && (
                            <span className="text-xs text-gray-500 font-mono">{order.trackingNumber}</span>
                          )}
                        </div>
                      ) : order.shippoRateId ? (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => generateLabel(order.id)}
                            disabled={generatingLabelId === order.id}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 bg-brand-purple text-white rounded-md hover:bg-brand-purple-dark transition-colors disabled:opacity-50"
                          >
                            <Truck size={12} />
                            {generatingLabelId === order.id ? 'Generando…' : 'Generar etiqueta'}
                          </button>
                          {labelError?.id === order.id && (
                            <p className="text-xs text-red-600 max-w-[180px] leading-tight">{labelError.msg}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Sin tarifa Shippo</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 text-right">
        Mostrando {filtered.length} de {orders.length} pedidos
      </p>

      {/* Modal de selección manual de rate */}
      {manualSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-800">Selecciona un servicio de envío</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  El servicio original{manualSelection.originalService ? ` "${manualSelection.originalService}"` : ''} ya no
                  está disponible o su precio cambió significativamente
                  {manualSelection.originalPrice > 0 ? ` (original: $${manualSelection.originalPrice.toFixed(2)})` : ''}.
                </p>
              </div>
              <button
                onClick={() => setManualSelection(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-4 space-y-2 max-h-80 overflow-y-auto">
              {manualSelection.rates.map((rate) => {
                const diffFromOriginal =
                  manualSelection.originalPrice > 0
                    ? ((rate.amount - manualSelection.originalPrice) / manualSelection.originalPrice) * 100
                    : null;

                return (
                  <button
                    key={rate.rateId}
                    onClick={() => generateLabel(manualSelection.orderId, rate.rateId)}
                    disabled={generatingLabelId === manualSelection.orderId}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 hover:border-brand-purple hover:bg-brand-purple/5 transition-colors text-left disabled:opacity-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {rate.carrier} — {rate.service}
                      </p>
                      {rate.days && (
                        <p className="text-xs text-gray-400 mt-0.5">{rate.days} días estimados</p>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-sm font-semibold text-gray-800">${rate.amount.toFixed(2)}</p>
                      {diffFromOriginal !== null && (
                        <p className={`text-xs ${diffFromOriginal > 0 ? 'text-red-500' : 'text-green-600'}`}>
                          {diffFromOriginal > 0 ? '+' : ''}{diffFromOriginal.toFixed(0)}% vs original
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {generatingLabelId === manualSelection.orderId && (
              <div className="px-6 pb-4 text-center text-sm text-gray-500">
                Generando etiqueta…
              </div>
            )}
            {labelError?.id === manualSelection.orderId && (
              <div className="px-6 pb-4 text-sm text-red-600 text-center">
                {labelError.msg}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
