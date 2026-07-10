import { NextRequest, NextResponse } from 'next/server';
import { Shippo } from 'shippo';
import { WeightUnitEnum } from 'shippo/models/components/weightunitenum.js';
import { DistanceUnitEnum } from 'shippo/models/components/distanceunitenum.js';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const FALLBACK_RATE = [
  {
    id: 'flat',
    proveedor: 'Tarifa estimada',
    servicio: 'Envío estándar',
    precio: 9.99,
    diasEstimados: 7,
  },
];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as {
    direccion1?: string;
    ciudad?: string;
    estado?: string;
    codigoPostal?: string;
    items?: Array<{ productId: number; cantidad: number }>;
  };

  const { direccion1, ciudad, estado, codigoPostal } = body;

  if (!direccion1 || !ciudad || !estado || !codigoPostal) {
    return NextResponse.json(
      { error: 'Faltan campos de dirección requeridos.' },
      { status: 400 }
    );
  }

  // ----------------------------------------------------------------
  // Cargar items del carrito para calcular dimensiones y peso
  // ----------------------------------------------------------------
  let pesoTotal = 0;
  let largoMax = 6;
  let anchoMax = 6;
  let altoMax = 2;

  try {
    const session = await getSessionUser();

    if (session) {
      // Usuario autenticado: leer carrito desde BD
      const cartItems = await prisma.cartItem.findMany({
        where: { userId: session.userId },
        include: { product: true },
      });

      if (cartItems.length > 0) {
        for (const item of cartItems) {
          const peso = item.product.pesoLb ?? 0.5;
          pesoTotal += item.cantidad * peso;
          largoMax = Math.max(largoMax, item.product.largoIn ?? 6);
          anchoMax = Math.max(anchoMax, item.product.anchoIn ?? 6);
          altoMax = Math.max(altoMax, item.product.altoIn ?? 2);
        }
      }
    } else if (body.items && body.items.length > 0) {
      // Usuario no autenticado: recibir items en el body
      const productIds = body.items.map((i) => i.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      for (const item of body.items) {
        const product = productMap.get(item.productId);
        if (!product) continue;
        const peso = product.pesoLb ?? 0.5;
        pesoTotal += item.cantidad * peso;
        largoMax = Math.max(largoMax, product.largoIn ?? 6);
        anchoMax = Math.max(anchoMax, product.anchoIn ?? 6);
        altoMax = Math.max(altoMax, product.altoIn ?? 2);
      }
    }
  } catch (dbError) {
    console.error('[shipping/rates] Error al leer carrito desde BD:', dbError);
    // Usar valores por defecto si falla la BD
  }

  // Si no se calculó peso (carrito vacío o sin items), usar valor mínimo
  if (pesoTotal === 0) {
    pesoTotal = 0.5;
  }

  // ----------------------------------------------------------------
  // Llamar a Shippo para obtener tarifas
  // ----------------------------------------------------------------
  try {
    const shippo = new Shippo({
      apiKeyHeader: process.env.SHIPPO_API_TOKEN!,
    });

    const shipment = await shippo.shipments.create({
      addressFrom: {
        name: 'Tienda San José',
        street1: '26455 Old 41 Rd. Ste. #16',
        city: 'Bonita Springs',
        state: 'FL',
        zip: '34135',
        country: 'US',
        phone: '+12392214020',
      },
      addressTo: {
        name: 'Cliente',
        street1: direccion1,
        city: ciudad,
        state: estado,
        zip: codigoPostal,
        country: 'US',
      },
      parcels: [
        {
          length: String(largoMax),
          width: String(anchoMax),
          height: String(altoMax),
          distanceUnit: DistanceUnitEnum.In,
          weight: String(pesoTotal),
          massUnit: WeightUnitEnum.Lb,
        },
      ],
      async: false,
    });

    const rates = (shipment.rates ?? []).map((rate) => ({
      id: rate.objectId,
      proveedor: rate.provider,
      servicio: rate.servicelevel.name,
      precio: parseFloat(rate.amount),
      diasEstimados: rate.estimatedDays ?? null,
    }));

    if (rates.length === 0) {
      return NextResponse.json(FALLBACK_RATE);
    }

    // Ordenar por precio ascendente
    rates.sort((a, b) => a.precio - b.precio);

    return NextResponse.json(rates);
  } catch (shippoError) {
    console.error('[shipping/rates] Error al consultar Shippo:', shippoError);
    return NextResponse.json(FALLBACK_RATE);
  }
}
