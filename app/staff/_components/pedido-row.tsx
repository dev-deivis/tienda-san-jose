'use client';

import { useState } from 'react';
import { Truck } from 'lucide-react';

type PedidoRowProps = {
  order: {
    id: number;
    status: string;
    total: number;
    createdAt: string;
    user: { email: string; nombre: string | null };
  };
};

const statusBadge: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabel: Record<string, string> = {
  pending: 'Pendiente',
  processing: 'En proceso',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export default function PedidoRow({ order }: PedidoRowProps) {
  const [status, setStatus] = useState(order.status);
  const [loading, setLoading] = useState(false);

  const markAsShipped = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'shipped' }),
      });
      if (res.ok) setStatus('shipped');
    } finally {
      setLoading(false);
    }
  };

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 text-sm font-mono text-gray-600">#{order.id}</td>
      <td className="px-4 py-3 text-sm text-gray-700">
        {order.user.nombre ?? order.user.email}
        <br />
        <span className="text-xs text-gray-400">{order.user.email}</span>
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-gray-800">
        ${order.total.toFixed(2)}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
            statusBadge[status] ?? 'bg-gray-100 text-gray-600'
          }`}
        >
          {statusLabel[status] ?? status}
        </span>
      </td>
      <td className="px-4 py-3">
        {status !== 'shipped' && status !== 'delivered' && status !== 'cancelled' ? (
          <button
            onClick={markAsShipped}
            disabled={loading}
            className="flex items-center gap-1 text-xs bg-brand-purple text-white px-3 py-1.5 rounded-md hover:bg-brand-purple-dark transition-colors disabled:opacity-50"
          >
            <Truck size={13} />
            {loading ? 'Actualizando…' : 'Marcar enviado'}
          </button>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
    </tr>
  );
}
