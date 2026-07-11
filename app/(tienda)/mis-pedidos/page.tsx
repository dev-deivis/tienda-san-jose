import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Package } from 'lucide-react';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

export default async function MisPedidosPage() {
  const session = await getSessionUser();
  if (!session) {
    redirect('/login');
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, nombre: true, imagen: true },
          },
        },
      },
    },
  });

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="text-center flex flex-col items-center gap-5 max-w-sm">
          <Package size={64} className="text-brand-purple opacity-60" />
          <div>
            <h1 className="font-serif text-2xl font-bold text-gray-900 mb-2">
              Aún no tienes pedidos
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              Cuando realices tu primera compra, aparecerá aquí.
            </p>
          </div>
          <Link
            href="/"
            className="px-6 py-3 bg-brand-purple text-white rounded-xl font-semibold hover:bg-brand-purple-dark transition-colors"
          >
            Explorar Catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-serif text-3xl font-bold text-brand-purple mb-8">
          Mis pedidos
        </h1>

        <div className="flex flex-col gap-6">
          {orders.map((order) => {
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
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* Cabecera */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <div>
                    <span className="font-semibold text-gray-900">{orderNumber}</span>
                    <span className="text-gray-400 text-sm ml-3">{fecha}</span>
                  </div>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusClasses(order.status)}`}
                  >
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                {/* Productos */}
                <div className="px-6 py-4 flex flex-col gap-2">
                  {order.items.map((item) => {
                    const imgSrc =
                      item.product.imagen ??
                      `https://picsum.photos/seed/product-${item.product.id}/400/400`;
                    return (
                      <div key={item.id} className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imgSrc}
                          alt={item.product.nombre}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                        />
                        <span className="text-sm text-gray-700 flex-1 leading-tight">
                          {item.product.nombre}
                        </span>
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                          × {item.cantidad}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Desglose de costos */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-sm">
                  <div className="flex justify-between text-gray-500 mb-1">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 mb-1">
                    <span>Envío</span>
                    <span>${shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 mb-2">
                    <span>Impuesto</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-200 pt-2">
                    <span>Total pagado</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Tracking + Ver detalle */}
                <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100">
                  <div className="text-sm">
                    {order.trackingNumber ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-gray-500">
                          Tracking:{' '}
                          <span className="font-mono text-gray-700">
                            {order.trackingNumber}
                          </span>
                        </span>
                        {order.trackingUrl && (
                          <a
                            href={order.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-magenta hover:underline font-medium"
                          >
                            Rastrear paquete →
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Preparando tu pedido</span>
                    )}
                  </div>
                  <Link
                    href={`/mis-pedidos/${order.id}`}
                    className="text-sm font-semibold text-brand-purple hover:text-brand-purple-dark transition-colors"
                  >
                    Ver detalle →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
