import { NextRequest, NextResponse } from 'next/server';
import { Shippo } from 'shippo';
import { WeightUnitEnum } from 'shippo/models/components/weightunitenum.js';
import { DistanceUnitEnum } from 'shippo/models/components/distanceunitenum.js';
import { LabelFileTypeEnum } from 'shippo/models/components/labelfiletypeenum.js';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ADDRESS_FROM = {
  name: 'Tienda San José',
  street1: '26455 Old 41 Rd. Ste. #16',
  city: 'Bonita Springs',
  state: 'FL',
  zip: '34135',
  country: 'US',
  phone: '+12392214020',
  email: 'info@tiendasanjose.com',
};

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verificar sesión: solo STAFF o ADMIN
    const session = await getSessionUser();
    if (!session || (session.role !== 'STAFF' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // 2. Parsear id del pedido
    const { id: idStr } = await params;
    const orderId = parseInt(idStr, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'ID de pedido inválido' }, { status: 400 });
    }

    // 3. Buscar el pedido con sus items y productos
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    // 4. Verificar que tenga shippoRateId
    if (!order.shippoRateId) {
      return NextResponse.json(
        {
          error:
            'Este pedido no tiene tarifa de Shippo asociada. Fue creado con el fallback o es anterior a esta función.',
        },
        { status: 400 }
      );
    }

    const shippo = new Shippo({
      apiKeyHeader: process.env.SHIPPO_API_TOKEN!,
    });

    // 5. Intentar comprar label con el rate original
    type ShippoTransaction = Awaited<ReturnType<typeof shippo.transactions.create>>;
    let transaction: ShippoTransaction | null = null;

    try {
      const t = await shippo.transactions.create({
        rate: order.shippoRateId,
        labelFileType: LabelFileTypeEnum.Pdf,
        async: false,
      });
      if (t.status === 'SUCCESS') {
        transaction = t;
      } else {
        const msgs = (t.messages ?? []).map((m) => m.text).filter(Boolean).join(' | ');
        console.error(`[generate-label] Rate original ERROR — ${msgs || 'sin detalle'}`);
      }
    } catch (err) {
      console.error('[generate-label] Excepción comprando rate original (probablemente expirado):', err);
    }

    // 6. Si falló el rate original, hacer re-cotización
    if (!transaction) {
      // Parsear la dirección guardada en shippingAddress
      let addressParsed: {
        line1?: string;
        city?: string;
        state?: string;
        postal_code?: string;
        country?: string;
      } = {};

      try {
        addressParsed = JSON.parse(order.shippingAddress);
      } catch {
        return NextResponse.json(
          { error: 'No se pudo parsear la dirección del pedido para re-cotizar.' },
          { status: 422 }
        );
      }

      if (!addressParsed.line1 || !addressParsed.city || !addressParsed.state || !addressParsed.postal_code) {
        return NextResponse.json(
          {
            error:
              'La dirección del pedido está incompleta. No se puede re-cotizar automáticamente.',
          },
          { status: 422 }
        );
      }

      // Calcular peso y dimensiones desde los items del pedido
      let pesoTotal = 0;
      let largoMax = 6;
      let anchoMax = 6;
      let altoMax = 2;

      for (const item of order.items) {
        const peso = item.product.pesoLb ?? 0.5;
        pesoTotal += item.cantidad * peso;
        largoMax = Math.max(largoMax, item.product.largoIn ?? 6);
        anchoMax = Math.max(anchoMax, item.product.anchoIn ?? 6);
        altoMax = Math.max(altoMax, item.product.altoIn ?? 2);
      }
      if (pesoTotal === 0) pesoTotal = 0.5;

      // Crear nuevo shipment para re-cotizar
      let newRateId: string | null = null;
      try {
        const shipment = await shippo.shipments.create({
          addressFrom: ADDRESS_FROM,
          addressTo: {
            name: 'Cliente',
            street1: addressParsed.line1,
            city: addressParsed.city,
            state: addressParsed.state,
            zip: addressParsed.postal_code,
            country: addressParsed.country ?? 'US',
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

        // Extraer el nombre del servicio original (la parte después de " — ")
        const shippingMethodParts = (order.shippingMethod ?? '').split(' — ');
        const originalServiceName = (
          shippingMethodParts.length > 1
            ? shippingMethodParts.slice(1).join(' — ').trim()
            : order.shippingMethod ?? ''
        ).toLowerCase();

        // Buscar rate que coincida con el servicio original (case-insensitive)
        const matchingRate = (shipment.rates ?? []).find(
          (r) => (r.servicelevel.name ?? '').toLowerCase() === originalServiceName
        );

        if (!matchingRate?.objectId) {
          return NextResponse.json(
            {
              error: `El servicio '${order.shippingMethod}' ya no está disponible para esta ruta. Por favor, genera el label manualmente en el panel de Shippo o elige un servicio alternativo.`,
            },
            { status: 422 }
          );
        }

        newRateId = matchingRate.objectId;
      } catch (err) {
        console.error('[generate-label] Error re-cotizando con Shippo:', err);
        return NextResponse.json(
          { error: 'Error al re-cotizar tarifas de envío con Shippo.' },
          { status: 502 }
        );
      }

      // Comprar label con el nuevo rate
      try {
        const t = await shippo.transactions.create({
          rate: newRateId,
          labelFileType: LabelFileTypeEnum.Pdf,
          async: false,
        });
        if (t.status === 'SUCCESS') {
          transaction = t;
        } else {
          const msgs = (t.messages ?? []).map((m) => m.text).filter(Boolean).join(' | ');
          console.error(`[generate-label] Rate re-cotizado ERROR — ${msgs || 'sin detalle'}`);
          return NextResponse.json(
            {
              error: `Shippo rechazó el label${msgs ? `: ${msgs}` : '. Revisa el panel de Shippo.'}`,
            },
            { status: 502 }
          );
        }
      } catch (err) {
        console.error('[generate-label] Error comprando label re-cotizado:', err);
        return NextResponse.json(
          { error: 'Error al comprar el label de envío con Shippo.' },
          { status: 502 }
        );
      }
    }

    // Seguridad extra: si transaction sigue siendo null aquí, algo inesperado pasó
    if (!transaction) {
      return NextResponse.json(
        { error: 'No se pudo obtener un label de Shippo. Intenta de nuevo.' },
        { status: 502 }
      );
    }

    // 7. Actualizar el Order con los datos del label
    const trackingNumber = transaction.trackingNumber ?? null;
    const trackingUrl = transaction.trackingUrlProvider ?? null;
    const labelUrl = transaction.labelUrl ?? null;

    await prisma.order.update({
      where: { id: orderId },
      data: {
        trackingNumber,
        trackingUrl,
        labelUrl,
        status: order.status === 'shipped' ? order.status : 'shipped',
      },
    });

    return NextResponse.json({ trackingNumber, trackingUrl, labelUrl });
  } catch (err) {
    // Captura cualquier excepción no manejada y retorna JSON en lugar de HTML 500
    console.error('[generate-label] Error no manejado:', err);
    const message = err instanceof Error ? err.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
