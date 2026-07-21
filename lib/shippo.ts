import { Shippo } from 'shippo';

// Cliente Shippo server-side — SOLO usar en Server Components / API Routes
// NUNCA importar este archivo desde un Client Component ('use client')
export const shippo = new Shippo({
  apiKeyHeader: process.env.SHIPPO_API_TOKEN!,
});

// Dirección remitente única — usada en cotización de tarifas y generación de etiquetas
export const ADDRESS_FROM = {
  name: 'Tienda San José',
  street1: '26455 Old 41 Rd. Ste. #16',
  city: 'Bonita Springs',
  state: 'FL',
  zip: '34135',
  country: 'US',
  phone: '+12392214020',
  email: 'tiendasanjose19@outlook.com',
} as const;
