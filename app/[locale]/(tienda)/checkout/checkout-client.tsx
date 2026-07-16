'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import {
  ShippingForm,
  type ShippingFormData,
  type ShippingFormErrors,
} from '@/components/checkout/shipping-form';
import { PaymentSection } from '@/components/checkout/payment-section';
import type { Dictionary } from '@/app/[locale]/dictionaries';

const INITIAL_FORM: ShippingFormData = {
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  direccion1: '',
  direccion2: '',
  ciudad: '',
  estado: '',
  codigoPostal: '',
};

type ShippingRate = {
  id: string;
  proveedor: string;
  servicio: string;
  precio: number;
  diasEstimados: number | null;
};

function validateShipping(data: ShippingFormData, required: string): ShippingFormErrors {
  const errs: ShippingFormErrors = {};
  if (!data.nombre.trim()) errs.nombre = required;
  if (!data.apellido.trim()) errs.apellido = required;
  if (!data.email.trim()) errs.email = required;
  if (!data.direccion1.trim()) errs.direccion1 = required;
  if (!data.ciudad.trim()) errs.ciudad = required;
  if (!data.estado.trim()) errs.estado = required;
  if (!data.codigoPostal.trim()) errs.codigoPostal = required;
  return errs;
}

type Props = {
  checkoutDict: Dictionary['checkout'];
  shippingDict: Dictionary['shipping'];
  paymentDict: Dictionary['payment'];
};

export function CheckoutClient({ checkoutDict, shippingDict, paymentDict }: Props) {
  const router = useRouter();
  const { items, getTotal } = useCart();

  const [hydrated, setHydrated] = useState(false);
  const [formData, setFormData] = useState<ShippingFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<ShippingFormErrors>({});

  // Estado para tarifas de envío
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [shippingFetched, setShippingFetched] = useState(false);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [taxReady, setTaxReady] = useState(false);

  // Esperar hidratacion del carrito antes de redirigir
  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && items.length === 0) {
      router.replace('/carrito');
    }
  }, [hydrated, items.length, router]);

  function handleChange(field: keyof ShippingFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo al editar
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    // Si el usuario edita campos de dirección, resetear tarifas calculadas
    if (['direccion1', 'ciudad', 'estado', 'codigoPostal'].includes(field)) {
      setShippingFetched(false);
      setShippingRates([]);
      setSelectedRate(null);
      setTaxAmount(0);
      setTaxReady(false);
    }
  }

  async function cotizarEnvio() {
    const newErrors = validateShipping(formData, checkoutDict.fieldRequired);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setLoadingRates(true);
    setRatesError(null);
    setSelectedRate(null);
    try {
      const res = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direccion1: formData.direccion1,
          ciudad: formData.ciudad,
          estado: formData.estado,
          codigoPostal: formData.codigoPostal,
        }),
      });
      const data = await res.json();
      setShippingRates(data);
      setShippingFetched(true);
    } catch {
      setRatesError(checkoutDict.noRates);
    } finally {
      setLoadingRates(false);
    }
  }

  const subtotal = getTotal();

  // Estado de carga mientras se hidrata el carrito
  if (!hydrated) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-purple border-t-transparent animate-spin" />
      </div>
    );
  }

  // No renderizar nada si el carrito esta vacio (la redireccion esta en el useEffect)
  if (items.length === 0) return null;

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Encabezado con breadcrumb */}
        <div className="mb-8">
          <nav className="text-sm text-gray-400 mb-2">
            <Link href="/carrito" className="hover:text-brand-purple transition-colors">
              {checkoutDict.breadcrumbCart}
            </Link>
            <span className="mx-2">›</span>
            <span className="text-brand-purple font-medium">{checkoutDict.breadcrumbCheckout}</span>
          </nav>
          <h1 className="font-serif text-3xl font-bold text-brand-purple">
            {checkoutDict.title}
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Columna izquierda — formulario */}
          <div className="flex-1 flex flex-col gap-6">
            <ShippingForm
              values={formData}
              errors={errors}
              onChange={handleChange}
              dict={shippingDict}
            />

            {/* Sección de opciones de envío */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">
                {checkoutDict.shippingMethod}
              </h2>

              {!shippingFetched && (
                <button
                  onClick={cotizarEnvio}
                  disabled={loadingRates}
                  className="w-full py-3 border-2 border-brand-purple text-brand-purple rounded-xl font-semibold hover:bg-brand-purple hover:text-white transition-colors disabled:opacity-50"
                >
                  {loadingRates ? checkoutDict.calculating : checkoutDict.calculateButton}
                </button>
              )}

              {ratesError && (
                <p className="text-red-600 text-sm">{ratesError}</p>
              )}

              {shippingFetched && shippingRates.length > 0 && (
                <div className="space-y-2">
                  {shippingRates.map((rate) => (
                    <label
                      key={rate.id}
                      className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                        selectedRate?.id === rate.id
                          ? 'border-brand-purple bg-brand-purple/5'
                          : 'border-gray-200 hover:border-brand-purple/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping-rate"
                        value={rate.id}
                        checked={selectedRate?.id === rate.id}
                        onChange={() => { setSelectedRate(rate); setTaxReady(false); setTaxAmount(0); }}
                        className="text-brand-purple"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          {rate.proveedor} — {rate.servicio}
                        </p>
                        {rate.diasEstimados !== null && (
                          <p className="text-xs text-gray-500">
                            {checkoutDict.businessDays.replace('{days}', String(rate.diasEstimados))}
                          </p>
                        )}
                      </div>
                      <p className="text-sm font-bold text-gray-900">
                        ${rate.precio.toFixed(2)}
                      </p>
                    </label>
                  ))}

                  <button
                    onClick={() => {
                      setShippingFetched(false);
                      setShippingRates([]);
                      setSelectedRate(null);
                    }}
                    className="text-xs text-gray-400 hover:text-brand-purple transition-colors mt-1"
                  >
                    {checkoutDict.changeAddress}
                  </button>
                </div>
              )}
            </div>

            {/* Sección de pago — solo cuando hay un método de envío seleccionado */}
            {selectedRate && (
              <PaymentSection
                shippingData={formData}
                shippingCost={selectedRate.precio}
                shippingMethod={`${selectedRate.proveedor} — ${selectedRate.servicio}`}
                shippoRateId={selectedRate.id}
                onTaxCalculated={(amount) => { setTaxAmount(amount); setTaxReady(true); }}
                dict={paymentDict}
              />
            )}
          </div>

          {/* Columna derecha — resumen sticky */}
          <div className="lg:w-80 shrink-0">
            <div className="sticky top-24 bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-5">
              <h2 className="font-serif text-xl font-bold text-gray-900">
                {checkoutDict.orderSummary}
              </h2>

              {/* Lista de items */}
              <ul className="flex flex-col gap-3">
                {items.map((item) => (
                  <li
                    key={`${item.productId}::${item.variante ?? ''}`}
                    className="flex gap-3 items-center"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imagen}
                      alt={item.nombre}
                      className="w-12 h-12 object-cover rounded-lg shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">
                        {item.nombre}
                      </p>
                      {item.variante && (
                        <p className="text-xs text-gray-400">{item.variante}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {checkoutDict.qty.replace('{count}', String(item.cantidad))}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 shrink-0">
                      ${(item.precio * item.cantidad).toFixed(2)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="border-t border-gray-100 pt-4 flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{checkoutDict.subtotal}</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{checkoutDict.shipping}</span>
                  {selectedRate ? (
                    <span className="font-semibold">${selectedRate.precio.toFixed(2)}</span>
                  ) : (
                    <span className="text-gray-400 text-xs italic">{checkoutDict.selectMethod}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{checkoutDict.tax}</span>
                  {!selectedRate ? (
                    <span className="text-gray-400 text-xs italic">—</span>
                  ) : !taxReady ? (
                    <span className="text-gray-400 text-xs italic">{checkoutDict.taxCalculating}</span>
                  ) : taxAmount === 0 ? (
                    <span className="text-gray-400 text-xs italic">{checkoutDict.taxExempt}</span>
                  ) : (
                    <span className="font-semibold">${taxAmount.toFixed(2)}</span>
                  )}
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between text-base font-bold">
                  <span>{checkoutDict.total}</span>
                  <span className="text-brand-purple">
                    ${(subtotal + (selectedRate?.precio ?? 0) + taxAmount).toFixed(2)}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-400 text-center leading-relaxed">
                {checkoutDict.instructions}
              </p>

              <Link
                href="/carrito"
                className="w-full flex items-center justify-center py-2 text-sm text-brand-purple hover:underline"
              >
                {checkoutDict.backToCart}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
