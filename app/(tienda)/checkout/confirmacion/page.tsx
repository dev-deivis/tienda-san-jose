import Link from 'next/link';
import { redirect } from 'next/navigation';
import { stripe } from '@/lib/stripe';
import { ClearCartOnSuccess } from './clear-cart';

type SearchParams = Promise<{
  payment_intent?: string;
  payment_intent_client_secret?: string;
  redirect_status?: string;
}>;

export default async function ConfirmacionPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const paymentIntentId = params.payment_intent;

  if (!paymentIntentId) {
    redirect('/checkout');
  }

  let succeeded = false;
  let intentId = paymentIntentId;

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    succeeded = paymentIntent.status === 'succeeded';
    intentId = paymentIntent.id;
  } catch {
    // Si falla la consulta a Stripe mostramos error generico
    succeeded = false;
  }

  if (succeeded) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <ClearCartOnSuccess />
        <div className="bg-white rounded-2xl p-10 max-w-md w-full shadow-sm text-center flex flex-col items-center gap-5">
          {/* Icono de exito */}
          <div className="w-16 h-16 rounded-full bg-brand-purple/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-brand-purple"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <h1 className="font-serif text-2xl font-bold text-gray-900 mb-2">
              Pedido realizado con exito
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              Recibiras un correo de confirmacion en breve.
            </p>
          </div>

          <div className="w-full bg-gray-50 rounded-xl px-5 py-4 text-left">
            <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide font-medium">
              Numero de confirmacion
            </p>
            <p className="font-mono text-sm text-gray-700 break-all">{intentId}</p>
          </div>

          <Link
            href="/"
            className="w-full py-3 bg-brand-purple text-white rounded-xl font-semibold hover:bg-brand-purple-dark transition-colors text-center"
          >
            Seguir comprando
          </Link>
        </div>
      </div>
    );
  }

  // Pago fallido o cancelado
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-10 max-w-md w-full shadow-sm text-center flex flex-col items-center gap-5">
        {/* Icono de error */}
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900 mb-2">
            Pago no procesado
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            El pago no pudo completarse. Puedes volver al checkout e intentarlo de nuevo.
          </p>
        </div>

        <Link
          href="/checkout"
          className="w-full py-3 bg-brand-purple text-white rounded-xl font-semibold hover:bg-brand-purple-dark transition-colors text-center"
        >
          Volver al checkout
        </Link>
      </div>
    </div>
  );
}
