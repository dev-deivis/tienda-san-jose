import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import type { CartItem as PrismaCartItem } from '@prisma/client';

/** Convierte variante JS (string | undefined) al valor que Prisma acepta en Json?. */
function toJsonVariante(variante?: string): Prisma.NullableJsonNullValueInput | string {
  return variante ?? Prisma.DbNull;
}

// ── Helpers ──────────────────────────────────────────────────────────────

/** Carga el carrito de un usuario con datos del producto. */
async function loadCart(userId: number) {
  const dbItems = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: { select: { nombre: true, precio: true, imagen: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return dbItems.map((item) => ({
    productId: item.productId,
    nombre: item.product.nombre,
    precio: parseFloat(item.product.precio.toString()),
    cantidad: item.cantidad,
    imagen: item.product.imagen ?? `https://picsum.photos/seed/product-${item.productId}/400/400`,
    variante: (item.variante as string | null) ?? undefined,
  }));
}

/** Busca un CartItem por userId + productId + variante (filtra en JS para evitar
 *  comparaciones JSON en MySQL que pueden ser impredecibles con Prisma). */
async function findItem(
  userId: number,
  productId: number,
  variante?: string
): Promise<PrismaCartItem | null> {
  const candidates = await prisma.cartItem.findMany({
    where: { userId, productId },
  });
  const normalizedVariante = variante || null;
  return (
    candidates.find((i) => {
      const dbVariante = (i.variante as string | null) ?? null;
      return dbVariante === normalizedVariante;
    }) ?? null
  );
}

// ── GET /api/cart ─────────────────────────────────────────────────────────

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ items: [] });

  const items = await loadCart(session.userId);
  return NextResponse.json({ items });
}

// ── POST /api/cart — agrega o incrementa un item ──────────────────────────

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { productId, cantidad = 1, variante } = await req.json() as {
    productId: number;
    cantidad?: number;
    variante?: string;
  };

  const existing = await findItem(session.userId, productId, variante);

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { cantidad: existing.cantidad + cantidad },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        userId: session.userId,
        productId,
        cantidad,
        variante: toJsonVariante(variante),
      },
    });
  }

  return NextResponse.json({ ok: true });
}

// ── PATCH /api/cart — establece cantidad exacta (updateQuantity) ───────────

export async function PATCH(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { productId, cantidad, variante } = await req.json() as {
    productId: number;
    cantidad: number;
    variante?: string;
  };

  const existing = await findItem(session.userId, productId, variante);
  if (!existing) return NextResponse.json({ ok: true }); // ya no existe

  if (cantidad < 1) {
    await prisma.cartItem.delete({ where: { id: existing.id } });
  } else {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { cantidad },
    });
  }

  return NextResponse.json({ ok: true });
}

// ── DELETE /api/cart — elimina un item específico ─────────────────────────

export async function DELETE(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { productId, variante } = await req.json() as {
    productId: number;
    variante?: string;
  };

  const existing = await findItem(session.userId, productId, variante);
  if (existing) {
    await prisma.cartItem.delete({ where: { id: existing.id } });
  }

  return NextResponse.json({ ok: true });
}
