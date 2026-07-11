import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  // 1. Verificar sesión
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // 2. Leer costo, método de envío y dirección del body
  const bodyData = await req.json().catch(() => ({})) as {
    shippingCost?: number;
    shippingMethod?: string;
    shippoRateId?: string;
    shippingAddress?: {
      line1: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
  const shippingCostCents = Math.round((bodyData.shippingCost ?? 0) * 100);

  // 3. Cargar el carrito del usuario desde la BD
  const cartItems = await prisma.cartItem.findMany({
    where: { userId: session.userId },
    include: { product: true },
  });

  if (cartItems.length === 0) {
    return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
  }

  // 4. Calcular subtotal de productos en el servidor
  const total = cartItems.reduce((sum, item) => {
    return sum + item.cantidad * parseFloat(item.product.precio.toString());
  }, 0);

  // 5. Calcular impuesto con Stripe Tax
  let taxAmountCents = 0;
  let taxCalculationId: string | null = null;

  try {
    const lineItems = cartItems.map((item) => ({
      amount: Math.round(parseFloat(item.product.precio.toString()) * item.cantidad * 100),
      reference: String(item.productId),
      tax_behavior: 'exclusive' as const,
    }));

    const taxCalcParams: Parameters<typeof stripe.tax.calculations.create>[0] = {
      currency: 'usd',
      line_items: lineItems,
      customer_details: {
        address: {
          line1: bodyData.shippingAddress?.line1 ?? '',
          city: bodyData.shippingAddress?.city ?? '',
          state: bodyData.shippingAddress?.state ?? '',
          postal_code: bodyData.shippingAddress?.postal_code ?? '',
          country: bodyData.shippingAddress?.country ?? 'US',
        },
        address_source: 'shipping',
      },
    };

    // Agregar costo de envío como campo dedicado (no como line item)
    if (shippingCostCents > 0) {
      taxCalcParams.shipping_cost = {
        amount: shippingCostCents,
        tax_behavior: 'exclusive',
      };
    }

    const taxCalc = await stripe.tax.calculations.create(taxCalcParams);

    taxAmountCents = taxCalc.tax_amount_exclusive;
    taxCalculationId = taxCalc.id ?? null;
  } catch (err) {
    console.error('[stripe-tax] Error calculando impuesto, continuando con $0:', err);
    // Fallback: impuesto $0, no bloquear el checkout
  }

  // 6. Total final = subtotal + envío + impuesto
  const totalFinal = Math.round(total * 100) + shippingCostCents + taxAmountCents;

  if (totalFinal < 50) {
    return NextResponse.json(
      { error: 'El total mínimo para procesar un pago es $0.50.' },
      { status: 400 }
    );
  }

  // 7. Crear PaymentIntent en Stripe
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalFinal,
    currency: 'usd',
    metadata: {
      userId: String(session.userId),
      items: JSON.stringify(
        cartItems.map((i) => ({
          productId: i.productId,
          cantidad: i.cantidad,
          precio: parseFloat(i.product.precio.toString()),
        }))
      ),
      shippingCost: String(bodyData.shippingCost ?? 0),
      shippingMethod: bodyData.shippingMethod ?? '',
      shippoRateId: bodyData.shippoRateId ?? '',
      customerAddress: bodyData.shippingAddress
        ? JSON.stringify({
            line1: bodyData.shippingAddress.line1,
            city: bodyData.shippingAddress.city,
            state: bodyData.shippingAddress.state,
            postal_code: bodyData.shippingAddress.postal_code,
            country: bodyData.shippingAddress.country,
          })
        : '',
      taxAmount: String(taxAmountCents / 100),
      taxCalculationId: taxCalculationId ?? '',
    },
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    amount: totalFinal,
    taxAmountCents,
  });
}
