import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { stripe } from '@/lib/stripe';
import { createOrderFromPaymentIntent } from '@/lib/create-order-from-payment';
import { getDictionary, isValidLocale } from '@/app/[locale]/dictionaries';
import { ClearCartOnSuccess } from './clear-cart';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = await getDictionary(locale);

  return {
    title: dict.checkout.successTitle,
    robots: { index: false, follow: false },
  };
}

type SearchParams = Promise<{
  payment_intent?: string;
  payment_intent_client_secret?: string;
  redirect_status?: string;
}>;

/**
 * Tres estados posibles de la página:
 *
 *  order_ok              — Pago exitoso + orden creada en BD (o ya existía). Mostrar éxito.
 *  payment_ok_order_failed — Pago exitoso en Stripe, pero la orden NO se pudo crear
 *                           (stock agotado, reembolso automático emitido, u otro error).
 *                           NO limpiar el carrito. Mostrar mensaje con PI para contacto.
 *  payment_failed        — El PaymentIntent no está en estado 'succeeded' (rechazo,
 *                           cancelación, etc.). Mostrar pantalla de error genérica.
 */
type PageOutcome =
  | { state: 'order_ok'; intentId: string }
  | { state: 'payment_ok_order_failed'; intentId: string }
  | { state: 'payment_failed'; intentId: string };

export default async function ConfirmacionPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const co = dict.checkout;

  const sp = await searchParams;
  const paymentIntentId = sp.payment_intent;

  if (!paymentIntentId) {
    redirect('/checkout');
  }

  // ── Determinar el outcome real ──────────────────────────────────────────────
  let outcome: PageOutcome = { state: 'payment_failed', intentId: paymentIntentId };

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const intentId = paymentIntent.id;

    if (paymentIntent.status === 'succeeded') {
      try {
        const orderResult = await createOrderFromPaymentIntent(paymentIntent);

        // Éxito: orden creada ahora (created: true)
        //        o ya existía por idempotencia (created: false, orderId: number)
        if (orderResult.created === true ||
            (orderResult.created === false && orderResult.orderId !== null)) {
          outcome = { state: 'order_ok', intentId };
        } else {
          // created: false, orderId: null → stock insuficiente u otro fallo controlado.
          // createOrderFromPaymentIntent ya emitió el reembolso automático.
          outcome = { state: 'payment_ok_order_failed', intentId };
        }
      } catch {
        // Error inesperado (BD, red, etc.) dentro de createOrderFromPaymentIntent.
        // El webhook de Stripe reintentará el evento — no sabemos aún si la orden
        // se creará. Mostramos el mismo estado de "fallo en orden" para que el
        // cliente no piense que todo salió bien.
        outcome = { state: 'payment_ok_order_failed', intentId };
      }
    } else {
      // Pago rechazado / cancelado / pendiente en Stripe
      outcome = { state: 'payment_failed', intentId };
    }
  } catch {
    // Error al recuperar el PaymentIntent desde Stripe (red, ID inválido, etc.)
    outcome = { state: 'payment_failed', intentId: paymentIntentId };
  }

  // ── Pantalla: ÉXITO — orden creada ─────────────────────────────────────────
  if (outcome.state === 'order_ok') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        {/* Limpia el carrito en el contexto del cliente solo cuando la orden existe */}
        <ClearCartOnSuccess />
        <div className="bg-white rounded-2xl p-10 max-w-md w-full shadow-sm text-center flex flex-col items-center gap-5">
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
              {co.successTitle}
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              {co.successDesc}
            </p>
          </div>

          <div className="w-full bg-gray-50 rounded-xl px-5 py-4 text-left">
            <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide font-medium">
              {co.confirmationNumber}
            </p>
            <p className="font-mono text-sm text-gray-700 break-all">{outcome.intentId}</p>
          </div>

          <Link
            href="/"
            className="w-full py-3 bg-brand-purple text-white rounded-xl font-semibold hover:bg-brand-purple-dark transition-colors text-center"
          >
            {co.continueShopping}
          </Link>
        </div>
      </div>
    );
  }

  // ── Pantalla: PAGO EXITOSO pero ORDEN FALLIDA (stock agotado → reembolso) ───
  if (outcome.state === 'payment_ok_order_failed') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        {/* NO se limpia el carrito — el cliente puede ajustar cantidades y reintentar */}
        <div className="bg-white rounded-2xl p-10 max-w-md w-full shadow-sm text-center flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>

          <div>
            <h1 className="font-serif text-2xl font-bold text-gray-900 mb-2">
              {co.refundedTitle}
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              {co.refundedDesc}
            </p>
          </div>

          <div className="w-full bg-amber-50 rounded-xl px-5 py-4 text-left">
            <p className="text-xs text-amber-600 mb-1 uppercase tracking-wide font-medium">
              {co.refundedContactNote}
            </p>
            <p className="font-mono text-sm text-gray-700 break-all">{outcome.intentId}</p>
          </div>

          <div className="flex flex-col gap-2 w-full">
            <Link
              href="/checkout"
              className="w-full py-3 bg-brand-purple text-white rounded-xl font-semibold hover:bg-brand-purple-dark transition-colors text-center"
            >
              {co.backToCheckout}
            </Link>
            <Link
              href="/"
              className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors text-center"
            >
              {co.continueShopping}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Pantalla: PAGO NO PROCESADO (rechazo de Stripe, error de red, etc.) ────
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-10 max-w-md w-full shadow-sm text-center flex flex-col items-center gap-5">
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
            {co.errorTitle}
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            {co.errorDesc}
          </p>
        </div>

        <Link
          href="/checkout"
          className="w-full py-3 bg-brand-purple text-white rounded-xl font-semibold hover:bg-brand-purple-dark transition-colors text-center"
        >
          {co.backToCheckout}
        </Link>
      </div>
    </div>
  );
}
