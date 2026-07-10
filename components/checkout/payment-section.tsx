'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe-client';
import { type ShippingFormData } from '@/components/checkout/shipping-form';

// ---------------------------------------------------------------------------
// Formulario interno — solo se monta dentro del provider <Elements>
// ---------------------------------------------------------------------------
function PaymentForm({
  shippingData,
}: {
  clientSecret: string;
  shippingData: ShippingFormData;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    setErrorMsg(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/confirmacion`,
        payment_method_data: {
          billing_details: {
            name: `${shippingData.nombre} ${shippingData.apellido}`,
            email: shippingData.email,
            phone: shippingData.telefono,
            address: {
              line1: shippingData.direccion1,
              line2: shippingData.direccion2 || undefined,
              city: shippingData.ciudad,
              state: shippingData.estado,
              postal_code: shippingData.codigoPostal,
              country: 'US',
            },
          },
        },
      },
    });

    // Si no hay error Stripe redirige automáticamente al return_url
    if (error) {
      setErrorMsg(error.message ?? 'Error al procesar el pago.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {errorMsg && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md px-4 py-2">
          {errorMsg}
        </div>
      )}
      <button
        type="submit"
        disabled={isLoading || !stripe || !elements}
        className="w-full py-3 bg-brand-purple text-white rounded-xl font-semibold hover:bg-brand-purple-dark transition-colors disabled:opacity-50"
      >
        {isLoading ? 'Procesando\u2026' : 'Confirmar pago'}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Componente principal exportado
// ---------------------------------------------------------------------------
export function PaymentSection({
  shippingData,
  shippingCost,
  shippingMethod,
  onTaxCalculated,
}: {
  shippingData: ShippingFormData;
  shippingCost: number;
  shippingMethod: string;
  onTaxCalculated: (taxAmount: number) => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUnauth, setIsUnauth] = useState(false);

  useEffect(() => {
    setClientSecret(null);
    setLoading(true);
    setError(null);
    setIsUnauth(false);

    fetch('/api/checkout/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shippingCost,
        shippingMethod,
        shippingAddress: {
          line1: shippingData.direccion1,
          city: shippingData.ciudad,
          state: shippingData.estado,
          postal_code: shippingData.codigoPostal,
          country: 'US',
        },
      }),
    })
      .then(async (r) => {
        if (r.status === 401) {
          setIsUnauth(true);
          setLoading(false);
          return;
        }
        const data = await r.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          onTaxCalculated(data.taxAmountCents / 100);
        } else {
          setError(data.error ?? 'No se pudo inicializar el pago.');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Error de conexion al inicializar el pago.');
        setLoading(false);
      });
  }, [shippingCost, shippingMethod, shippingData.ciudad, shippingData.estado, shippingData.codigoPostal]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">Pago</h2>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 rounded-full border-2 border-brand-purple border-t-transparent animate-spin" />
        </div>
      )}

      {isUnauth && (
        <div className="text-center py-6">
          <p className="text-gray-600 text-sm mb-3">
            Debes iniciar sesion para completar tu compra.
          </p>
          <Link
            href="/login"
            className="inline-block px-5 py-2.5 bg-brand-purple text-white rounded-xl font-semibold hover:bg-brand-purple-dark transition-colors text-sm"
          >
            Iniciar sesion
          </Link>
        </div>
      )}

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md px-4 py-2">
          {error}
        </p>
      )}

      {clientSecret && (
        <Elements
          key={clientSecret}
          stripe={getStripe()}
          options={{ clientSecret, appearance: { theme: 'stripe' } }}
        >
          <PaymentForm clientSecret={clientSecret} shippingData={shippingData} />
        </Elements>
      )}

      <p className="mt-4 text-xs text-gray-400 text-center">
        Tus datos de pago se procesan de forma segura a traves de Stripe.
      </p>
    </div>
  );
}
