import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import type { CartItem as ClientCartItem } from '@/context/cart-context';

function toJsonVariante(variante?: string): Prisma.NullableJsonNullValueInput | string {
  return variante ?? Prisma.DbNull;
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await req.json() as { items: ClientCartItem[] };
  const { items } = body;

  if (!Array.isArray(items) || items.length === 0) {
    // Nada que fusionar — devuelve el carrito actual
    const dbItems = await getCart(session.userId);
    return NextResponse.json({ items: dbItems });
  }

  // Para cada item del guest: sumar si ya existe, crear si no
  for (const item of items) {
    const candidates = await prisma.cartItem.findMany({
      where: { userId: session.userId, productId: item.productId },
    });

    const normalizedVariante = item.variante || null;
    const existing = candidates.find((i) => {
      const dbVariante = (i.variante as string | null) ?? null;
      return dbVariante === normalizedVariante;
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { cantidad: existing.cantidad + item.cantidad },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          userId: session.userId,
          productId: item.productId,
          cantidad: item.cantidad,
          variante: toJsonVariante(item.variante),
        },
      });
    }
  }

  // Retorna el carrito fusionado y actualizado
  const merged = await getCart(session.userId);
  return NextResponse.json({ items: merged });
}

async function getCart(userId: number): Promise<ClientCartItem[]> {
  const dbItems = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          nombre: true,
          precio: true,
          imagen: true,
          images: { take: 1, orderBy: { orden: 'asc' }, select: { url: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return dbItems.map((item) => ({
    productId: item.productId,
    nombre: item.product.nombre,
    precio: parseFloat(item.product.precio.toString()),
    cantidad: item.cantidad,
    imagen:
      item.product.images[0]?.url ??
      item.product.imagen ??
      `https://picsum.photos/seed/product-${item.productId}/400/400`,
    variante: (item.variante as string | null) ?? undefined,
  }));
}
