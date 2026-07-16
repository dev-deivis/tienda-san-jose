import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createHmac, timingSafeEqual } from 'crypto';

// ─── Verificación de firma ────────────────────────────────────────────────────
//
// Shippo firma sus webhooks con HMAC-SHA256.
// El header "Shippo-Webhook-Signature" tiene el formato: t=TIMESTAMP,v1=SIGNATURE
// La firma se calcula como: HMAC-SHA256(key=secret, data=TIMESTAMP + "." + rawBody)
//
// Referencia: https://docs.goshippo.com/docs/tracking/webhooks/
//
// NOTA: Shippo SÍ soporta firma de webhooks. Si SHIPPO_WEBHOOK_SECRET no está
// definido, el endpoint acepta cualquier petición (útil en desarrollo local), pero
// en producción SIEMPRE debe estar configurado.

function verifyShippoSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): boolean {
  try {
    const parts = signatureHeader.split(',');
    const tPart = parts.find((p) => p.startsWith('t='));
    const v1Part = parts.find((p) => p.startsWith('v1='));

    if (!tPart || !v1Part) return false;

    const timestamp = tPart.slice(2);
    const receivedHex = v1Part.slice(3);

    // Rechazar timestamps con más de 5 minutos de diferencia (replay attacks)
    const ts = parseInt(timestamp, 10);
    if (isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > 300) {
      console.warn('[shippo-webhook] Timestamp fuera de rango (posible replay attack)');
      return false;
    }

    const expectedHex = createHmac('sha256', secret)
      .update(`${timestamp}.${rawBody}`)
      .digest('hex');

    // Comparación en tiempo constante para evitar timing attacks
    const expectedBuf = Buffer.from(expectedHex, 'hex');
    const receivedBuf = Buffer.from(receivedHex, 'hex');
    if (expectedBuf.length !== receivedBuf.length) return false;

    return timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
}

// ─── Tipos del payload de Shippo ─────────────────────────────────────────────

type ShippoTrackingStatus = {
  status: string;          // "DELIVERED" | "TRANSIT" | "RETURNED" | "FAILURE" | ...
  status_details?: string;
  status_date?: string;
};

type ShippoWebhookPayload = {
  event: string;           // "track_updated"
  test?: boolean;
  data: {
    tracking_number?: string;
    transaction?: string;  // Shippo transaction ID (objectId)
    carrier?: string;
    tracking_status?: ShippoTrackingStatus;
    eta?: string | null;
  };
};

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Leer como texto plano para validar la firma antes de parsear
  const rawBody = await req.text();

  // ── Verificar firma ────────────────────────────────────────────────────────
  const webhookSecret = process.env.SHIPPO_WEBHOOK_SECRET;

  if (webhookSecret) {
    const sigHeader = req.headers.get('shippo-webhook-signature') ?? '';
    if (!verifyShippoSignature(rawBody, sigHeader, webhookSecret)) {
      console.warn('[shippo-webhook] Firma inválida — petición rechazada');
      return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
    }
  } else {
    // Sin secret configurado: solo aceptar en modo test/dev
    console.warn(
      '[shippo-webhook] SHIPPO_WEBHOOK_SECRET no configurado — ' +
      'verificación de firma omitida. Configúrala en producción.',
    );
  }

  // ── Parsear payload ────────────────────────────────────────────────────────
  let payload: ShippoWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as ShippoWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Payload JSON inválido' }, { status: 400 });
  }

  const { event, data, test: isTest } = payload;
  const trackingNumber = data?.tracking_number;
  const trackingStatus = data?.tracking_status?.status;

  // Log de todos los eventos recibidos para referencia/debug
  console.log(
    `[shippo-webhook] event=${event}` +
    ` tracking=${trackingNumber ?? 'N/A'}` +
    ` status=${trackingStatus ?? 'N/A'}` +
    ` test=${isTest ?? false}`,
  );

  // ── Ignorar eventos que no son track_updated ───────────────────────────────
  if (event !== 'track_updated') {
    return NextResponse.json({ ok: true, ignored: `event="${event}" no es track_updated` });
  }

  // ── Ignorar estados que no sean DELIVERED ─────────────────────────────────
  // En tránsito, pre-tránsito, etc. no modifican el estado de la orden.
  if (trackingStatus !== 'DELIVERED') {
    console.log(`[shippo-webhook] status "${trackingStatus}" — ignorado (solo procesamos DELIVERED)`);
    return NextResponse.json({ ok: true, ignored: `status="${trackingStatus}"` });
  }

  if (!trackingNumber) {
    console.warn('[shippo-webhook] Evento DELIVERED sin tracking_number — ignorado');
    return NextResponse.json({ ok: true, ignored: 'sin tracking_number' });
  }

  // ── Buscar la orden por trackingNumber ────────────────────────────────────
  const order = await prisma.order.findFirst({
    where: { trackingNumber },
    select: { id: true, status: true },
  });

  if (!order) {
    // Puede ocurrir con guías de test o de sistemas externos.
    // Respondemos 200 para que Shippo no reintente indefinidamente.
    console.warn(
      `[shippo-webhook] No se encontró orden con trackingNumber="${trackingNumber}"`,
    );
    return NextResponse.json({ ok: true, not_found: true });
  }

  // ── Guardar protecciones de estado ────────────────────────────────────────
  if (order.status === 'cancelled') {
    console.log(
      `[shippo-webhook] Orden #${order.id} está cancelada — status no modificado`,
    );
    return NextResponse.json({ ok: true, skipped: 'cancelled' });
  }

  if (order.status === 'delivered') {
    // Idempotente: ya estaba marcada como entregada (webhook duplicado o retry de Shippo)
    console.log(`[shippo-webhook] Orden #${order.id} ya estaba en "delivered" — sin cambios`);
    return NextResponse.json({ ok: true, skipped: 'already_delivered' });
  }

  // ── Actualizar status a "delivered" ───────────────────────────────────────
  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'delivered' },
  });

  console.log(
    `[shippo-webhook] ✓ Orden #${order.id} marcada como "delivered" ` +
    `(tracking: ${trackingNumber})`,
  );

  return NextResponse.json({ ok: true, orderId: order.id });
}
