'use client';

// TODO: reemplazar con Stripe Elements/Payment Element cuando tengamos las API keys
export function PaymentSection() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">
        Pago
      </h2>

      <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3">
        <span className="text-3xl">🔒</span>
        <p className="font-medium text-gray-600">
          Aquí se integrará Stripe Checkout
        </p>
      </div>

      <p className="mt-4 text-xs text-gray-400 text-center leading-relaxed">
        Tus datos de pago se procesan de forma segura a través de Stripe.
        Nunca almacenamos información de tarjetas.
      </p>
    </div>
  );
}
