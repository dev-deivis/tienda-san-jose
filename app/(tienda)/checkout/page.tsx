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

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal } = useCart();

  const [hydrated, setHydrated] = useState(false);
  const [formData, setFormData] = useState<ShippingFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<ShippingFormErrors>({});

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
              Carrito
            </Link>
            <span className="mx-2">›</span>
            <span className="text-brand-purple font-medium">Checkout</span>
          </nav>
          <h1 className="font-serif text-3xl font-bold text-brand-purple">
            Finalizar pedido
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Columna izquierda — formulario */}
          <div className="flex-1 flex flex-col gap-6">
            <ShippingForm
              values={formData}
              errors={errors}
              onChange={handleChange}
            />
            <PaymentSection shippingData={formData} />
          </div>

          {/* Columna derecha — resumen sticky */}
          <div className="lg:w-80 shrink-0">
            <div className="sticky top-24 bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-5">
              <h2 className="font-serif text-xl font-bold text-gray-900">
                Resumen del pedido
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
                        Cant. {item.cantidad}
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
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Envio</span>
                  <span className="text-gray-400 italic text-xs text-right">
                    $0.00 (se calculara con Shippo/EasyPost)
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span className="text-brand-purple">${subtotal.toFixed(2)}</span>
                </div>
              </div>

              <p className="text-xs text-gray-400 text-center leading-relaxed">
                Completa los datos de envio y usa el formulario de pago para confirmar tu pedido.
              </p>

              <Link
                href="/carrito"
                className="w-full flex items-center justify-center py-2 text-sm text-brand-purple hover:underline"
              >
                Volver al carrito
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
