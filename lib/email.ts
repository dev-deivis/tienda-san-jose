/**
 * lib/email.ts
 *
 * Sistema centralizado de correos transaccionales para Tienda San José.
 * Usa Nodemailer con SMTP de Hostinger (puerto 465, SSL/TLS).
 *
 * Todas las funciones manejan sus propios errores internamente:
 * si el correo falla, solo se registra en consola — nunca se lanza una
 * excepción que pueda interrumpir el flujo de negocio del llamante.
 */

import nodemailer from 'nodemailer';

// ── Configuración SMTP ────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true, // SSL/TLS en puerto 465
  auth: {
    user: 'pedidos@tienda-san-jose.com',
    pass: process.env.SMTP_PASSWORD,
  },
});

const FROM = '"Tienda San José" <pedidos@tienda-san-jose.com>';

/** Email del admin para notificaciones internas. Configurable sin tocar código. */
const ADMIN_EMAIL =
  process.env.ADMIN_NOTIFICATION_EMAIL ?? 'pedidos@tienda-san-jose.com';

/** Umbral de stock bajo: notificar cuando el stock cruza por debajo de este valor. */
export const LOW_STOCK_THRESHOLD = 5;

// ── Helpers de formateo ───────────────────────────────────────────────────────

function usd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// ── Template base HTML ────────────────────────────────────────────────────────

function baseTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#EDE8F4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background-color:#EDE8F4;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:600px;width:100%;background:#FFFFFF;border-radius:10px;
                      overflow:hidden;box-shadow:0 3px 12px rgba(0,0,0,0.10);">

          <!-- ── Encabezado de marca ────────────────────────────────── -->
          <tr>
            <td style="background:#5B2E91;padding:26px 32px;text-align:center;">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;
                        font-size:26px;font-weight:bold;color:#C9A84C;
                        letter-spacing:3px;line-height:1.2;">
                Tienda San&nbsp;José
              </p>
            </td>
          </tr>

          <!-- ── Contenido del correo ───────────────────────────────── -->
          <tr>
            <td style="padding:32px 32px 28px;">
              ${body}
            </td>
          </tr>

          <!-- ── Pie de página ──────────────────────────────────────── -->
          <tr>
            <td style="background:#F5F0FC;padding:18px 32px;
                       text-align:center;border-top:2px solid #E0D3F5;">
              <p style="margin:0 0 4px;font-size:12px;color:#999999;">
                © 2026 Tienda San José &middot; Bonita Springs, FL 34135
              </p>
              <p style="margin:0;font-size:12px;color:#999999;">
                ¿Preguntas? Escríbenos a
                <a href="mailto:pedidos@tienda-san-jose.com"
                   style="color:#5B2E91;text-decoration:none;">
                  pedidos@tienda-san-jose.com
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Tabla de productos (reutilizada en varios templates) ──────────────────────

interface EmailItem {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

function itemsTable(items: EmailItem[]): string {
  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:9px 8px;border-bottom:1px solid #EDE8F4;
                     font-size:14px;color:#333333;">${item.nombre}</td>
          <td style="padding:9px 8px;border-bottom:1px solid #EDE8F4;
                     font-size:14px;color:#333333;text-align:center;">${item.cantidad}</td>
          <td style="padding:9px 8px;border-bottom:1px solid #EDE8F4;
                     font-size:14px;color:#333333;text-align:right;">${usd(item.precioUnitario)}</td>
          <td style="padding:9px 8px;border-bottom:1px solid #EDE8F4;
                     font-size:14px;color:#333333;text-align:right;">
            ${usd(item.cantidad * item.precioUnitario)}
          </td>
        </tr>`,
    )
    .join('');

  return `
    <table width="100%" cellpadding="0" cellspacing="0"
           style="margin:16px 0;border-collapse:collapse;">
      <thead>
        <tr style="background:#F5F0FC;">
          <th style="padding:10px 8px;text-align:left;font-size:11px;color:#5B2E91;
                     text-transform:uppercase;letter-spacing:0.6px;
                     border-bottom:2px solid #E0D3F5;">Producto</th>
          <th style="padding:10px 8px;text-align:center;font-size:11px;color:#5B2E91;
                     text-transform:uppercase;letter-spacing:0.6px;
                     border-bottom:2px solid #E0D3F5;">Cant.</th>
          <th style="padding:10px 8px;text-align:right;font-size:11px;color:#5B2E91;
                     text-transform:uppercase;letter-spacing:0.6px;
                     border-bottom:2px solid #E0D3F5;">Precio unit.</th>
          <th style="padding:10px 8px;text-align:right;font-size:11px;color:#5B2E91;
                     text-transform:uppercase;letter-spacing:0.6px;
                     border-bottom:2px solid #E0D3F5;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ────────────────────────────────────────────────────────────────────────────
// 1. Confirmación de compra  →  cliente
// ────────────────────────────────────────────────────────────────────────────

export interface OrderConfirmationParams {
  to: string;
  customerName: string | null;
  orderId: number;
  items: EmailItem[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  total: number;
  shippingAddress: {
    line1?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

export async function sendOrderConfirmationEmail(
  p: OrderConfirmationParams,
): Promise<void> {
  const greeting = p.customerName ? `Hola, ${p.customerName}` : 'Hola';

  const addressParts = [
    p.shippingAddress.line1,
    p.shippingAddress.city,
    p.shippingAddress.state,
    p.shippingAddress.postal_code,
    p.shippingAddress.country,
  ]
    .filter(Boolean)
    .join(', ');

  const taxRow =
    p.taxAmount > 0
      ? `<tr>
          <td style="padding:4px 0;font-size:14px;color:#666;">Impuestos</td>
          <td style="padding:4px 0;font-size:14px;color:#333;text-align:right;">
            ${usd(p.taxAmount)}
          </td>
        </tr>`
      : '';

  const addressBlock = addressParts
    ? `<div style="margin-top:24px;padding:16px;background:#F5F0FC;border-radius:6px;
                   border-left:4px solid #C9A84C;">
        <p style="margin:0 0 4px;font-size:11px;color:#888;
                  text-transform:uppercase;letter-spacing:0.6px;">Dirección de envío</p>
        <p style="margin:0;font-size:14px;color:#333;">${addressParts}</p>
       </div>`
    : '';

  const body = `
    <h2 style="margin:0 0 8px;font-family:Georgia,serif;color:#5B2E91;font-size:22px;">
      ¡Gracias por tu compra!
    </h2>
    <p style="margin:0 0 20px;font-size:15px;color:#555555;">
      ${greeting}. Hemos recibido tu pedido y lo estamos procesando con cuidado.
    </p>

    <!-- Número de orden -->
    <div style="background:#F5F0FC;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.6px;">
        Número de orden
      </p>
      <p style="margin:6px 0 0;font-size:26px;font-weight:bold;color:#5B2E91;
                font-family:Georgia,serif;">#${p.orderId}</p>
    </div>

    <!-- Productos -->
    <p style="margin:0 0 2px;font-size:11px;color:#5B2E91;
              text-transform:uppercase;letter-spacing:0.6px;">Productos</p>
    ${itemsTable(p.items)}

    <!-- Totales -->
    <table width="100%" cellpadding="0" cellspacing="0"
           style="margin-top:4px;border-collapse:collapse;">
      <tr>
        <td style="padding:5px 0;font-size:14px;color:#666;">Subtotal</td>
        <td style="padding:5px 0;font-size:14px;color:#333;text-align:right;">
          ${usd(p.subtotal)}
        </td>
      </tr>
      <tr>
        <td style="padding:5px 0;font-size:14px;color:#666;">Envío</td>
        <td style="padding:5px 0;font-size:14px;color:#333;text-align:right;">
          ${usd(p.shippingCost)}
        </td>
      </tr>
      ${taxRow}
      <tr>
        <td colspan="2">
          <hr style="margin:10px 0;border:none;border-top:2px solid #E0D3F5;">
        </td>
      </tr>
      <tr>
        <td style="padding:2px 0;font-size:17px;font-weight:bold;color:#5B2E91;">Total</td>
        <td style="padding:2px 0;font-size:17px;font-weight:bold;color:#5B2E91;
                   text-align:right;">${usd(p.total)}</td>
      </tr>
    </table>

    ${addressBlock}

    <p style="margin:24px 0 0;font-size:14px;color:#555;">
      Te notificaremos por correo cuando tu pedido sea enviado, incluyendo el
      número de rastreo.
    </p>`;

  try {
    await transporter.sendMail({
      from: FROM,
      to: p.to,
      subject: `✓ Pedido #${p.orderId} confirmado — Tienda San José`,
      html: baseTemplate(`Pedido #${p.orderId} Confirmado`, body),
    });
    console.log(`[email] Confirmación de orden #${p.orderId} enviada a ${p.to}`);
  } catch (err) {
    console.error(
      `[email] Error al enviar confirmación de orden #${p.orderId}:`,
      err,
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 2. Pedido enviado  →  cliente
// ────────────────────────────────────────────────────────────────────────────

export interface OrderShippedParams {
  to: string;
  customerName: string | null;
  orderId: number;
  trackingNumber: string | null;
  trackingUrl: string | null;
}

export async function sendOrderShippedEmail(p: OrderShippedParams): Promise<void> {
  const greeting = p.customerName ? `Hola, ${p.customerName}` : 'Hola';

  const trackingBlock = p.trackingNumber
    ? `<div style="margin:20px 0;padding:20px 24px;background:#F5F0FC;border-radius:8px;
                   border-left:4px solid #C9A84C;text-align:center;">
        <p style="margin:0 0 6px;font-size:11px;color:#888;
                  text-transform:uppercase;letter-spacing:0.6px;">Número de rastreo</p>
        <p style="margin:0 0 16px;font-size:22px;font-weight:bold;color:#333;
                  font-family:Georgia,serif;letter-spacing:1px;">${p.trackingNumber}</p>
        ${
          p.trackingUrl
            ? `<a href="${p.trackingUrl}" target="_blank"
               style="display:inline-block;padding:11px 28px;background:#5B2E91;
                      color:#FFFFFF;text-decoration:none;border-radius:5px;
                      font-size:14px;font-weight:bold;letter-spacing:0.3px;">
                 Rastrear mi paquete →
               </a>`
            : ''
        }
       </div>`
    : `<div style="margin:20px 0;padding:16px 20px;background:#F5F0FC;border-radius:8px;
                   border-left:4px solid #C9A84C;">
        <p style="margin:0;font-size:14px;color:#555;">
          El número de rastreo estará disponible próximamente.
        </p>
       </div>`;

  const body = `
    <h2 style="margin:0 0 8px;font-family:Georgia,serif;color:#5B2E91;font-size:22px;">
      ¡Tu pedido está en camino!
    </h2>
    <p style="margin:0 0 16px;font-size:15px;color:#555;">
      ${greeting}. Tu pedido <strong>#${p.orderId}</strong> ha sido preparado y entregado
      al servicio de mensajería.
    </p>

    ${trackingBlock}

    <p style="margin:0;font-size:14px;color:#555;line-height:1.6;">
      ${
        p.trackingUrl
          ? 'Puedes rastrear tu paquete en tiempo real usando el enlace de arriba.'
          : 'Te avisaremos cuando sea confirmada la entrega.'
      }
      Si tienes alguna pregunta, no dudes en contactarnos.
    </p>`;

  try {
    await transporter.sendMail({
      from: FROM,
      to: p.to,
      subject: `📦 Tu pedido #${p.orderId} fue enviado — Tienda San José`,
      html: baseTemplate(`Pedido #${p.orderId} Enviado`, body),
    });
    console.log(`[email] Envío de orden #${p.orderId} notificado a ${p.to}`);
  } catch (err) {
    console.error(
      `[email] Error al enviar notificación de envío #${p.orderId}:`,
      err,
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 3. Pedido entregado  →  cliente
// ────────────────────────────────────────────────────────────────────────────

export interface OrderDeliveredParams {
  to: string;
  customerName: string | null;
  orderId: number;
}

export async function sendOrderDeliveredEmail(p: OrderDeliveredParams): Promise<void> {
  const greeting = p.customerName ? `Hola, ${p.customerName}` : 'Hola';

  const body = `
    <h2 style="margin:0 0 8px;font-family:Georgia,serif;color:#5B2E91;font-size:22px;">
      ¡Tu pedido fue entregado!
    </h2>
    <p style="margin:0 0 20px;font-size:15px;color:#555;">
      ${greeting}. Confirmamos que tu pedido <strong>#${p.orderId}</strong> fue
      entregado exitosamente.
    </p>

    <div style="padding:18px 20px;background:#F0FAF0;border-radius:8px;
                border-left:4px solid #4CAF50;">
      <p style="margin:0;font-size:15px;color:#2E7D32;">
        ✅ Entrega confirmada. Esperamos que disfrutes tu compra.
      </p>
    </div>

    <p style="margin:20px 0 0;font-size:14px;color:#555;line-height:1.6;">
      Si tienes algún problema con tu pedido, escríbenos a
      <a href="mailto:pedidos@tienda-san-jose.com" style="color:#5B2E91;text-decoration:none;">
        pedidos@tienda-san-jose.com
      </a>
      y lo resolveremos a la brevedad.
    </p>
    <p style="margin:8px 0 0;font-size:14px;color:#555;">
      Gracias por elegir Tienda San José. ¡Hasta la próxima!
    </p>`;

  try {
    await transporter.sendMail({
      from: FROM,
      to: p.to,
      subject: `✅ Tu pedido #${p.orderId} fue entregado — Tienda San José`,
      html: baseTemplate(`Pedido #${p.orderId} Entregado`, body),
    });
    console.log(`[email] Entrega de orden #${p.orderId} notificada a ${p.to}`);
  } catch (err) {
    console.error(
      `[email] Error al enviar notificación de entrega #${p.orderId}:`,
      err,
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 4. Cancelación y reembolso confirmado  →  cliente
// ────────────────────────────────────────────────────────────────────────────

export interface OrderCancellationParams {
  to: string;
  customerName: string | null;
  orderId: number;
  total: number;
}

export async function sendOrderCancellationEmail(
  p: OrderCancellationParams,
): Promise<void> {
  const greeting = p.customerName ? `Hola, ${p.customerName}` : 'Hola';

  const body = `
    <h2 style="margin:0 0 8px;font-family:Georgia,serif;color:#5B2E91;font-size:22px;">
      Tu pedido fue cancelado
    </h2>
    <p style="margin:0 0 20px;font-size:15px;color:#555;">
      ${greeting}. Tu pedido <strong>#${p.orderId}</strong> ha sido cancelado
      y el reembolso fue procesado correctamente.
    </p>

    <div style="padding:18px 20px;background:#F5F0FC;border-radius:8px;
                border-left:4px solid #C9A84C;margin-bottom:20px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:14px;color:#666;">Monto a reembolsar</td>
          <td style="font-size:18px;font-weight:bold;color:#5B2E91;text-align:right;">
            ${usd(p.total)}
          </td>
        </tr>
      </table>
    </div>

    <p style="margin:0;font-size:14px;color:#555;line-height:1.6;">
      El reembolso puede tardar <strong>5–10 días hábiles</strong> en reflejarse en tu
      cuenta, dependiendo de tu banco o emisor de tarjeta.
    </p>
    <p style="margin:10px 0 0;font-size:14px;color:#555;">
      ¿Tienes alguna duda? Escríbenos a
      <a href="mailto:pedidos@tienda-san-jose.com" style="color:#5B2E91;text-decoration:none;">
        pedidos@tienda-san-jose.com
      </a>
    </p>`;

  try {
    await transporter.sendMail({
      from: FROM,
      to: p.to,
      subject: `Pedido #${p.orderId} cancelado — Reembolso procesado`,
      html: baseTemplate(`Pedido #${p.orderId} Cancelado`, body),
    });
    console.log(
      `[email] Cancelación de orden #${p.orderId} notificada a ${p.to}`,
    );
  } catch (err) {
    console.error(
      `[email] Error al enviar notificación de cancelación #${p.orderId}:`,
      err,
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 5. Nueva orden recibida  →  admin
// ────────────────────────────────────────────────────────────────────────────

export interface NewOrderAdminParams {
  orderId: number;
  customerEmail: string;
  customerName: string | null;
  total: number;
  items: EmailItem[];
}

export async function sendNewOrderAdminEmail(p: NewOrderAdminParams): Promise<void> {
  const body = `
    <h2 style="margin:0 0 8px;font-family:Georgia,serif;color:#5B2E91;font-size:22px;">
      Nueva orden recibida
    </h2>

    <div style="background:#F5F0FC;border-radius:8px;padding:16px 20px;
                margin-bottom:20px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p style="margin:0;font-size:11px;color:#888;
                      text-transform:uppercase;letter-spacing:0.6px;">Orden</p>
            <p style="margin:4px 0 0;font-size:26px;font-weight:bold;color:#5B2E91;
                      font-family:Georgia,serif;">#${p.orderId}</p>
          </td>
          <td style="text-align:right;">
            <p style="margin:0;font-size:11px;color:#888;
                      text-transform:uppercase;letter-spacing:0.6px;">Total</p>
            <p style="margin:4px 0 0;font-size:26px;font-weight:bold;color:#C9A84C;">
              ${usd(p.total)}
            </p>
          </td>
        </tr>
      </table>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="padding:5px 0;font-size:13px;color:#888;width:100px;">Cliente</td>
        <td style="padding:5px 0;font-size:14px;color:#333;">
          ${p.customerName ?? '—'}
        </td>
      </tr>
      <tr>
        <td style="padding:5px 0;font-size:13px;color:#888;">Email</td>
        <td style="padding:5px 0;font-size:14px;">
          <a href="mailto:${p.customerEmail}" style="color:#5B2E91;text-decoration:none;">
            ${p.customerEmail}
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 2px;font-size:11px;color:#5B2E91;
              text-transform:uppercase;letter-spacing:0.6px;">Productos</p>
    ${itemsTable(p.items)}`;

  try {
    await transporter.sendMail({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `🛍️ Nueva orden #${p.orderId} — ${usd(p.total)}`,
      html: baseTemplate(`Nueva Orden #${p.orderId}`, body),
    });
    console.log(`[email] Admin notificado de nueva orden #${p.orderId}`);
  } catch (err) {
    console.error(
      `[email] Error al notificar admin de nueva orden #${p.orderId}:`,
      err,
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 6. Stock bajo  →  admin
// ────────────────────────────────────────────────────────────────────────────

export interface LowStockAdminParams {
  productId: number;
  nombre: string;
  stock: number;
}

export async function sendLowStockAdminEmail(p: LowStockAdminParams): Promise<void> {
  const body = `
    <h2 style="margin:0 0 8px;font-family:Georgia,serif;color:#C9A84C;font-size:22px;">
      Alerta de stock bajo
    </h2>
    <p style="margin:0 0 20px;font-size:15px;color:#555;">
      El stock de un producto acaba de caer por debajo del umbral mínimo de
      <strong>${LOW_STOCK_THRESHOLD} unidades</strong>.
    </p>

    <div style="padding:18px 20px;background:#FFF8E8;border-radius:8px;
                border-left:4px solid #C9A84C;margin-bottom:20px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p style="margin:0;font-size:11px;color:#888;
                      text-transform:uppercase;letter-spacing:0.6px;">Producto</p>
            <p style="margin:5px 0 0;font-size:17px;font-weight:bold;color:#333;">
              ${p.nombre}
            </p>
            <p style="margin:3px 0 0;font-size:12px;color:#888;">ID #${p.productId}</p>
          </td>
          <td style="text-align:right;vertical-align:middle;">
            <p style="margin:0;font-size:11px;color:#888;
                      text-transform:uppercase;letter-spacing:0.6px;">Stock actual</p>
            <p style="margin:5px 0 0;font-size:32px;font-weight:bold;color:#D9534F;
                      line-height:1;">${p.stock}</p>
            <p style="margin:2px 0 0;font-size:12px;color:#888;">unidades</p>
          </td>
        </tr>
      </table>
    </div>

    <p style="margin:0;font-size:14px;color:#555;line-height:1.6;">
      Se recomienda reabastecer este producto pronto para evitar quedarse sin
      inventario antes de la próxima venta.
    </p>`;

  try {
    await transporter.sendMail({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `⚠️ Stock bajo: "${p.nombre}" — ${p.stock} unid. restantes`,
      html: baseTemplate('Alerta de Stock Bajo', body),
    });
    console.log(
      `[email] Alerta de stock bajo enviada — ` +
      `producto #${p.productId} "${p.nombre}": ${p.stock} unid.`,
    );
  } catch (err) {
    console.error(
      `[email] Error al enviar alerta de stock bajo para "${p.nombre}":`,
      err,
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 7. Pedido cancelado  →  admin
// ────────────────────────────────────────────────────────────────────────────

export interface OrderCancelledAdminParams {
  orderId: number;
  customerEmail: string;
  customerName: string | null;
  total: number;
}

export async function sendOrderCancelledAdminEmail(
  p: OrderCancelledAdminParams,
): Promise<void> {
  const body = `
    <h2 style="margin:0 0 8px;font-family:Georgia,serif;color:#D9534F;font-size:22px;">
      Pedido cancelado
    </h2>
    <p style="margin:0 0 20px;font-size:15px;color:#555;">
      El pedido <strong>#${p.orderId}</strong> fue cancelado y el reembolso procesado.
    </p>

    <div style="padding:18px 20px;background:#FFF5F5;border-radius:8px;
                border-left:4px solid #D9534F;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#888;width:110px;">Orden</td>
          <td style="padding:4px 0;font-size:15px;font-weight:bold;color:#333;">
            #${p.orderId}
          </td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#888;">Cliente</td>
          <td style="padding:4px 0;font-size:14px;color:#333;">
            ${p.customerName ?? '—'}
          </td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#888;">Email</td>
          <td style="padding:4px 0;font-size:14px;">
            <a href="mailto:${p.customerEmail}" style="color:#5B2E91;text-decoration:none;">
              ${p.customerEmail}
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#888;">Reembolso</td>
          <td style="padding:4px 0;font-size:17px;font-weight:bold;color:#D9534F;">
            ${usd(p.total)}
          </td>
        </tr>
      </table>
    </div>`;

  try {
    await transporter.sendMail({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `❌ Pedido #${p.orderId} cancelado — Reembolso ${usd(p.total)}`,
      html: baseTemplate(`Pedido #${p.orderId} Cancelado`, body),
    });
    console.log(`[email] Admin notificado de cancelación de orden #${p.orderId}`);
  } catch (err) {
    console.error(
      `[email] Error al notificar admin de cancelación #${p.orderId}:`,
      err,
    );
  }
}
