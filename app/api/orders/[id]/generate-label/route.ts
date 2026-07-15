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

/** Umbral máximo de diferencia de precio aceptable para auto-seleccionar un rate (30%) */
const MAX_PRICE_DIFF_RATIO = 0.30;

export async function POST(
  req: NextRequest,
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

    // Leer body opcional (rateId de selección manual)
    let manualRateId: string | null = null;
    try {
      const body = await req.json() as { rateId?: string };
      manualRateId = body.rateId ?? null;
    } catch {
      // body vacío o no-JSON → ok, no hay selección manual
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

    type ShippoTransaction = Awaited<ReturnType<typeof shippo.transactions.create>>;
    let transaction: ShippoTransaction | null = null;

    // ── CAMINO A: selección manual del admin ──────────────────────────────────
    if (manualRateId) {
      console.log(
        `[generate-label] order=${orderId} — usando rate de selección manual: ${manualRateId}`
      );
      try {
        const t = await shippo.transactions.create({
          rate: manualRateId,
          labelFileType: LabelFileTypeEnum.Pdf,
          async: false,
        });
        if (t.status === 'SUCCESS') {
          transaction = t;
        } else {
          const msgs = (t.messages ?? []).map((m) => m.text).filter(Boolean).join(' | ');
          return NextResponse.json(
            { error: `Shippo rechazó el label con el rate seleccionado${msgs ? `: ${msgs}` : '.'}` },
            { status: 502 }
          );
        }
      } catch (err) {
        console.error('[generate-label] Error comprando label con rate manual:', err);
        return NextResponse.json(
          { error: 'Error al comprar el label con el rate seleccionado.' },
          { status: 502 }
        );
      }
    }

    // ── CAMINO B: intentar con el rate original ───────────────────────────────
    if (!transaction) {
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
          console.error(`[generate-label] order=${orderId} — rate original ERROR: ${msgs || 'sin detalle'}`);
        }
      } catch (err) {
        console.error(
          `[generate-label] order=${orderId} — excepción con rate original (probablemente expirado):`,
          err
        );
      }
    }

    // ── CAMINO C: re-cotización con 3 niveles de fallback ────────────────────
    if (!transaction) {
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
          { error: 'La dirección del pedido está incompleta. No se puede re-cotizar automáticamente.' },
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

      let availableRates: Awaited<ReturnType<typeof shippo.shipments.create>>['rates'] = [];

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

        availableRates = shipment.rates ?? [];
      } catch (err) {
        console.error(`[generate-label] order=${orderId} — error re-cotizando con Shippo:`, err);
        return NextResponse.json(
          { error: 'Error al re-cotizar tarifas de envío con Shippo.' },
          { status: 502 }
        );
      }

      if (availableRates.length === 0) {
        return NextResponse.json(
          { error: 'Shippo no devolvió tarifas disponibles para esta dirección.' },
          { status: 422 }
        );
      }

      // Extraer nombre del servicio original (la parte después de " — ")
      const shippingMethodParts = (order.shippingMethod ?? '').split(' — ');
      const originalServiceName = (
        shippingMethodParts.length > 1
          ? shippingMethodParts.slice(1).join(' — ').trim()
          : order.shippingMethod ?? ''
      ).toLowerCase();

      const originalPrice = parseFloat(order.shippingCost.toString());

      // ── Nivel 1: match exacto por nombre de servicio ──────────────────────
      const nameMatch = availableRates.find(
        (r) => (r.servicelevel.name ?? '').toLowerCase() === originalServiceName
      );

      if (nameMatch?.objectId) {
        console.log(
          `[generate-label] order=${orderId} — FALLBACK nivel 1 (match por nombre): ` +
          `${nameMatch.provider} ${nameMatch.servicelevel.name} $${nameMatch.amount}`
        );
        const t = await shippo.transactions.create({
          rate: nameMatch.objectId,
          labelFileType: LabelFileTypeEnum.Pdf,
          async: false,
        });
        if (t.status === 'SUCCESS') {
          transaction = t;
        } else {
          const msgs = (t.messages ?? []).map((m) => m.text).filter(Boolean).join(' | ');
          console.error(`[generate-label] order=${orderId} — rate nivel 1 ERROR: ${msgs}`);
          return NextResponse.json(
            { error: `Shippo rechazó el label${msgs ? `: ${msgs}` : '. Revisa el panel de Shippo.'}` },
            { status: 502 }
          );
        }
      }

      // ── Nivel 2: rate con precio más cercano al original ──────────────────
      if (!transaction) {
        const ratesWithId = availableRates.filter((r) => r.objectId);
        const closestRate = ratesWithId.reduce<typeof ratesWithId[0] | null>((best, r) => {
          if (!best) return r;
          const diffCurrent = Math.abs(parseFloat(r.amount) - originalPrice);
          const diffBest = Math.abs(parseFloat(best.amount) - originalPrice);
          return diffCurrent < diffBest ? r : best;
        }, null);

        if (closestRate) {
          const closestPrice = parseFloat(closestRate.amount);
          const diffRatio = originalPrice > 0
            ? Math.abs(closestPrice - originalPrice) / originalPrice
            : 1;

          if (diffRatio <= MAX_PRICE_DIFF_RATIO) {
            // Dentro del 30% → auto-seleccionar
            console.log(
              `[generate-label] order=${orderId} — FALLBACK nivel 2 (match por precio): ` +
              `${closestRate.provider} ${closestRate.servicelevel.name} $${closestRate.amount} ` +
              `(original $${originalPrice}, diff ${(diffRatio * 100).toFixed(1)}%)`
            );
            const t = await shippo.transactions.create({
              rate: closestRate.objectId!,
              labelFileType: LabelFileTypeEnum.Pdf,
              async: false,
            });
            if (t.status === 'SUCCESS') {
              transaction = t;
            } else {
              const msgs = (t.messages ?? []).map((m) => m.text).filter(Boolean).join(' | ');
              console.error(`[generate-label] order=${orderId} — rate nivel 2 ERROR: ${msgs}`);
              return NextResponse.json(
                { error: `Shippo rechazó el label${msgs ? `: ${msgs}` : '. Revisa el panel de Shippo.'}` },
                { status: 502 }
              );
            }
          } else {
            // ── Nivel 3: diferencia >30% → requiere selección manual ─────────
            console.log(
              `[generate-label] order=${orderId} — FALLBACK nivel 3 (selección manual requerida): ` +
              `precio original $${originalPrice}, rate más cercano $${closestPrice} ` +
              `(diff ${(diffRatio * 100).toFixed(1)}% > ${MAX_PRICE_DIFF_RATIO * 100}%)`
            );

            const ratesForFrontend = ratesWithId.map((r) => ({
              rateId: r.objectId!,
              carrier: r.provider ?? 'Desconocido',
              service: r.servicelevel.name ?? 'Servicio desconocido',
              amount: parseFloat(r.amount),
              days: r.estimatedDays ?? null,
            }));
            // Ordenar por precio ascendente
            ratesForFrontend.sort((a, b) => a.amount - b.amount);

            return NextResponse.json({
              requires_manual_selection: true,
              original_service: order.shippingMethod,
              original_price: originalPrice,
              rates: ratesForFrontend,
            });
          }
        }
      }
    }

    // Seguridad: si transaction es null aquí, algo inesperado pasó
    if (!transaction) {
      return NextResponse.json(
        { error: 'No se pudo obtener un label de Shippo. Intenta de nuevo.' },
        { status: 502 }
      );
    }

    // 5. Actualizar el Order con los datos del label
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
    console.error('[generate-label] Error no manejado:', err);
    const message = err instanceof Error ? err.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
