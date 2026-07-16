'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

type CancelDict = {
  cancelOrder: string;
  cancelConfirmTitle: string;
  cancelConfirmDesc: string;
  cancelConfirmButton: string;
  cancelDismiss: string;
  cancelRefundFailed: string;
  cancelErrorGeneric: string;
  cancelling: string;
};

type Props = {
  orderId: number;
  dict: CancelDict;
  /** Clases extra para el botón trigger (p.ej. para ajustar el estilo por contexto) */
  className?: string;
};

export function CancelOrderButton({ orderId, dict, className }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: 'POST' });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        const data = await res.json() as { error?: string };
        if (data.error === 'STRIPE_REFUND_FAILED') {
          setError(dict.cancelRefundFailed);
        } else {
          setError(dict.cancelErrorGeneric);
        }
      }
    } catch {
      setError(dict.cancelErrorGeneric);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => { setError(''); setOpen(true); }}
        className={
          className ??
          'text-sm text-red-500 hover:text-red-700 font-medium transition-colors'
        }
      >
        {dict.cancelOrder}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget && !loading) setOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-base leading-tight">
                {dict.cancelConfirmTitle}
              </h3>
              <button
                onClick={() => { if (!loading) setOpen(false); }}
                className="text-gray-400 hover:text-gray-600 transition-colors ml-3 mt-0.5 shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-5">{dict.cancelConfirmDesc}</p>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 mb-4">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { if (!loading) setOpen(false); }}
                disabled={loading}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                {dict.cancelDismiss}
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? dict.cancelling : dict.cancelConfirmButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
