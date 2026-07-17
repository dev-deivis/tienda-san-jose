/**
 * Script de prueba para los 6 correos transaccionales.
 *
 * Uso:
 *   SMTP_PASSWORD="tu_contraseña" node scripts/test-emails.mjs
 *
 * Los correos se envían a pedidos@tienda-san-jose.com (admin) y a la
 * dirección de prueba definida en TEST_CUSTOMER_EMAIL más abajo.
 */

import nodemailer from 'nodemailer';

// ── Configuración ─────────────────────────────────────────────────────────────

const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
if (!SMTP_PASSWORD) {
  console.error('❌  Falta SMTP_PASSWORD. Ejecútalo así:');
  console.error('    SMTP_PASSWORD="tu_contraseña" node scripts/test-emails.mjs');
  process.exit(1);
}

/** Correo al que se enviarán los correos de "cliente" en esta prueba */
const TEST_CUSTOMER_EMAIL = process.env.TEST_EMAIL ?? 'eldeivis3000@gmail.com';
const ADMIN_EMAIL = 'pedidos@tienda-san-jose.com';

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: 'pedidos@tienda-san-jose.com',
    pass: SMTP_PASSWORD,
  },
});

// ── Verificar conexión ────────────────────────────────────────────────────────

console.log('Verificando conexión SMTP...');
await transporter.verify();
console.log('✓ Conexión SMTP OK\n');

// ── Datos de prueba ───────────────────────────────────────────────────────────

const ORDER_ID = 1042;
const CUSTOMER_NAME = 'María García';
const ITEMS = [
  { nombre: 'Canela en Rama (100g)', cantidad: 2, precioUnitario: 4.99 },
  { nombre: 'Chile Guajillo Seco (50g)', cantidad: 1, precioUnitario: 3.49 },
  { nombre: 'Mole Negro en Pasta (200g)', cantidad: 1, precioUnitario: 8.99 },
];
const SUBTOTAL = ITEMS.reduce((s, i) => s + i.cantidad * i.precioUnitario, 0);
const SHIPPING = 5.99;
const TAX = 1.27;
const TOTAL = SUBTOTAL + SHIPPING + TAX;

function usd(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

// ── Helper de envío ───────────────────────────────────────────────────────────

async function send(label, options) {
  process.stdout.write(`Enviando [${label}]... `);
  const info = await transporter.sendMail(options);
  console.log(`✓  messageId: ${info.messageId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Confirmación de compra  →  cliente
// ─────────────────────────────────────────────────────────────────────────────

await send('1 — Confirmación de compra', {
  from: '"Tienda San José" <pedidos@tienda-san-jose.com>',
  to: TEST_CUSTOMER_EMAIL,
  subject: `✓ Pedido #${ORDER_ID} confirmado — Tienda San José`,
  html: `<p>Prueba: confirmación de compra para orden #${ORDER_ID}.</p>
         <p>Cliente: ${CUSTOMER_NAME}</p>
         <p>Total: ${usd(TOTAL)}</p>
         <p>Productos: ${ITEMS.map(i => `${i.nombre} x${i.cantidad}`).join(', ')}</p>`,
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Pedido enviado  →  cliente
// ─────────────────────────────────────────────────────────────────────────────

await send('2 — Pedido enviado', {
  from: '"Tienda San José" <pedidos@tienda-san-jose.com>',
  to: TEST_CUSTOMER_EMAIL,
  subject: `📦 Tu pedido #${ORDER_ID} fue enviado — Tienda San José`,
  html: `<p>Prueba: pedido #${ORDER_ID} enviado.</p>
         <p>Tracking: 9400111899226133467094</p>
         <p>URL: https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899226133467094</p>`,
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Pedido entregado  →  cliente
// ─────────────────────────────────────────────────────────────────────────────

await send('3 — Pedido entregado', {
  from: '"Tienda San José" <pedidos@tienda-san-jose.com>',
  to: TEST_CUSTOMER_EMAIL,
  subject: `✅ Tu pedido #${ORDER_ID} fue entregado — Tienda San José`,
  html: `<p>Prueba: pedido #${ORDER_ID} entregado exitosamente.</p>
         <p>Cliente: ${CUSTOMER_NAME}</p>`,
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Cancelación y reembolso  →  cliente
// ─────────────────────────────────────────────────────────────────────────────

await send('4 — Cancelación (cliente)', {
  from: '"Tienda San José" <pedidos@tienda-san-jose.com>',
  to: TEST_CUSTOMER_EMAIL,
  subject: `Pedido #${ORDER_ID} cancelado — Reembolso procesado`,
  html: `<p>Prueba: cancelación de orden #${ORDER_ID}.</p>
         <p>Reembolso: ${usd(TOTAL)}</p>`,
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Nueva orden  →  admin
// ─────────────────────────────────────────────────────────────────────────────

await send('5 — Nueva orden (admin)', {
  from: '"Tienda San José" <pedidos@tienda-san-jose.com>',
  to: ADMIN_EMAIL,
  subject: `🛍️ Nueva orden #${ORDER_ID} — ${usd(TOTAL)}`,
  html: `<p>Prueba: nueva orden #${ORDER_ID}.</p>
         <p>Cliente: ${CUSTOMER_NAME} — test@example.com</p>
         <p>Total: ${usd(TOTAL)}</p>
         <p>Productos: ${ITEMS.map(i => `${i.nombre} x${i.cantidad}`).join(', ')}</p>`,
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Stock bajo  →  admin
// ─────────────────────────────────────────────────────────────────────────────

await send('6 — Stock bajo (admin)', {
  from: '"Tienda San José" <pedidos@tienda-san-jose.com>',
  to: ADMIN_EMAIL,
  subject: `⚠️ Stock bajo: "Chile Guajillo Seco (50g)" — 3 unid. restantes`,
  html: `<p>Prueba: alerta de stock bajo.</p>
         <p>Producto: Chile Guajillo Seco (50g) — #23</p>
         <p>Stock actual: 3 unidades (umbral: 5)</p>`,
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Cancelación  →  admin
// ─────────────────────────────────────────────────────────────────────────────

await send('7 — Cancelación (admin)', {
  from: '"Tienda San José" <pedidos@tienda-san-jose.com>',
  to: ADMIN_EMAIL,
  subject: `❌ Pedido #${ORDER_ID} cancelado — Reembolso ${usd(TOTAL)}`,
  html: `<p>Prueba: cancelación de orden #${ORDER_ID}.</p>
         <p>Cliente: ${CUSTOMER_NAME} — test@example.com</p>
         <p>Reembolso: ${usd(TOTAL)}</p>`,
});

console.log('\n✅ Todos los correos enviados correctamente.');
console.log(`   Revisa la bandeja de ${TEST_CUSTOMER_EMAIL} y ${ADMIN_EMAIL}`);
