import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST() {
  // 1. Verificar sesión
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // 2. Cargar el carrito del usuario desde la BD
  const cartItems = await prisma.cartItem.findMany({
    where: { userId: session.userId },
    include: { product: true },
  });

  if (cartItems.length === 0) {
    return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
  }

  // 3. Calcular total en el servidor
  const total = cartItems.reduce((sum, item) => {
    return sum + item.cantidad * parseFloat(item.product.precio.toString());
  }, 0);

  // 4. Convertir a centavos
  const totalCentavos = Math.round(total * 100);

  if (totalCentavos < 50) {
    return NextResponse.json(
      { error: 'El total mínimo para procesar un pago es $0.50.' },
      { status: 400 }
    );
  }

  // 5. Crear PaymentIntent en Stripe
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalCentavos,
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
    },
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    amount: totalCentavos,
  });
}
