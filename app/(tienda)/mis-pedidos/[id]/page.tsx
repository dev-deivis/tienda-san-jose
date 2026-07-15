import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Props = { params: Promise<{ id: string }> };

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    processing: 'En proceso',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  };
  return labels[status] ?? status;
}

function getStatusClasses(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-50 text-yellow-700';
    case 'processing':
      return 'bg-blue-50 text-blue-700';
    case 'shipped':
      return 'bg-green-50 text-green-600';
    case 'delivered':
      return 'bg-emerald-600 text-white';
    case 'cancelled':
      return 'bg-red-50 text-red-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

interface ShippingAddress {
  line1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

function parseShippingAddress(raw: string | null): ShippingAddress {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ShippingAddress;
  } catch {
    return {};
  }
}

export default async function DetallePedidoPage({ params }: Props) {
  const { id } = await params;

  const session = await getSessionUser();
  if (!session) {
    redirect('/login');
  }

  const order = await prisma.order.findUnique({
    where: { id: parseInt(id) },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { take: 1, orderBy: { orden: 'asc' }, select: { url: true } },
            },
          },
        },
      },
    },
  });

  // Seguridad: no mostrar pedidos de otro usuario
  if (!order || order.userId !== session.userId) {
    redirect('/mis-pedidos');
  }

  const address = parseShippingAddress(order.shippingAddress);

  const subtotal = order.items.reduce((acc, item) => {
    return acc + parseFloat(item.precioUnitario.toString()) * item.cantidad;
  }, 0);
  const shippingCost = parseFloat(order.shippingCost.toString());
  const taxAmount = parseFloat(order.taxAmount.toString());
  const total = parseFloat(order.total.toString());

  const orderNumber = `#${order.id.toString().padStart(5, '0')}`;
  const fecha = order.createdAt.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-cream py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Botón volver */}
        <Link
          href="/mis-pedidos"
          className="inline-flex items-center gap-1 text-sm text-brand-purple hover:text-brand-purple-dark transition-colors mb-6"
        >
          ← Volver a mis pedidos
        </Link>

        {/* Encabezado del pedido */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-5">
          <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100">
            <div>
              <h1 className="font-serif text-2xl font-bold text-gray-900">
                Pedido {orderNumber}
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">{fecha}</p>
              {order.shippingMethod && (
                <p className="text-sm text-gray-500 mt-1">
                  Método de envío:{' '}
                  <span className="font-medium text-gray-700">{order.shippingMethod}</span>
                </p>
              )}
            </div>
            <span
              className={`self-start sm:self-auto text-xs font-semibold px-3 py-1 rounded-full ${getStatusClasses(order.status)}`}
            >
              {getStatusLabel(order.status)}
            </span>
          </div>

          {/* Dirección de envío */}
          {(address.line1 || address.city) && (
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Dirección de envío
              </h2>
              <address className="not-italic text-sm text-gray-700 leading-relaxed">
                {address.line1 && <span className="block">{address.line1}</span>}
                {(address.city || address.state || address.postal_code) && (
                  <span className="block">
                    {[address.city, address.state, address.postal_code]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                )}
                {address.country && <span className="block">{address.country}</span>}
              </address>
            </div>
          )}

          {/* Tracking */}
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Seguimiento
            </h2>
            {order.trackingNumber ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="inline-block bg-green-50 text-green-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                    Enviado
                  </span>
                  <span className="font-mono text-sm text-gray-700">
                    {order.trackingNumber}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  {order.trackingUrl && (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-brand-magenta hover:underline font-medium"
                    >
                      Rastrear paquete →
                    </a>
                  )}
                  {order.labelUrl && (
                    <a
                      href={order.labelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-brand-purple hover:underline font-medium"
                    >
                      Ver etiqueta
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Preparando tu pedido</p>
            )}
          </div>

          {/* Lista de productos */}
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Productos
            </h2>
            <div className="flex flex-col gap-4">
              {order.items.map((item) => {
                const imgSrc =
                  item.product.images[0]?.url ??
                  item.product.imagen ??
                  `https://picsum.photos/seed/product-${item.product.id}/400/400`;
                const unitPrice = parseFloat(item.precioUnitario.toString());
                const itemSubtotal = unitPrice * item.cantidad;

                return (
                  <div key={item.id} className="flex items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgSrc}
                      alt={item.product.nombre}
                      width={60}
                      height={60}
                      className="w-15 h-15 rounded-xl object-cover flex-shrink-0 border border-gray-100"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 leading-tight">
                        {item.product.nombre}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        ${unitPrice.toFixed(2)} × {item.cantidad}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                      ${itemSubtotal.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desglose de costos */}
          <div className="px-6 py-5 bg-gray-50">
            <div className="flex justify-between text-sm text-gray-500 mb-1.5">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500 mb-1.5">
              <span>Envío</span>
              <span>${shippingCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500 mb-3">
              <span>Impuesto</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-200 pt-3">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
