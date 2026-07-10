import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');

  if (!fromParam || !toParam) {
    return NextResponse.json({ error: 'Parámetros from y to requeridos' }, { status: 400 });
  }

  const from = new Date(fromParam);
  const to = new Date(toParam);

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return NextResponse.json({ error: 'Fechas inválidas' }, { status: 400 });
  }

  // Pedidos en el rango (no cancelados)
  const ordersEnRango = await prisma.order.findMany({
    where: {
      createdAt: { gte: from, lte: to },
      status: { not: 'cancelled' },
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              nombre: true,
              category: { select: { nombre: true } },
            },
          },
        },
      },
    },
  });

  // Métricas generales
  const pedidosTotales = ordersEnRango.length;
  let ventasTotales = 0;
  let unidadesVendidas = 0;

  for (const order of ordersEnRango) {
    ventasTotales += parseFloat(order.total.toString());
    for (const item of order.items) {
      unidadesVendidas += item.cantidad;
    }
  }

  const ticketPromedio = pedidosTotales > 0 ? ventasTotales / pedidosTotales : 0;

  // Agrupar por producto
  const productoMap = new Map<
    number,
    { productId: number; nombre: string; categoria: string; unidades: number; ingresos: number }
  >();

  for (const order of ordersEnRango) {
    for (const item of order.items) {
      const existing = productoMap.get(item.productId);
      const ingreso = item.cantidad * parseFloat(item.precioUnitario.toString());
      if (existing) {
        existing.unidades += item.cantidad;
        existing.ingresos += ingreso;
      } else {
        productoMap.set(item.productId, {
          productId: item.productId,
          nombre: item.product.nombre,
          categoria: item.product.category.nombre,
          unidades: item.cantidad,
          ingresos: ingreso,
        });
      }
    }
  }

  const topProductos = Array.from(productoMap.values())
    .sort((a, b) => b.unidades - a.unidades)
    .slice(0, 10)
    .map((p) => ({ ...p, ingresos: parseFloat(p.ingresos.toFixed(2)) }));

  // Agrupar por categoría
  const categoriaMap = new Map<string, { categoria: string; unidades: number; ingresos: number }>();

  for (const order of ordersEnRango) {
    for (const item of order.items) {
      const catNombre = item.product.category.nombre;
      const ingreso = item.cantidad * parseFloat(item.precioUnitario.toString());
      const existing = categoriaMap.get(catNombre);
      if (existing) {
        existing.unidades += item.cantidad;
        existing.ingresos += ingreso;
      } else {
        categoriaMap.set(catNombre, {
          categoria: catNombre,
          unidades: item.cantidad,
          ingresos: ingreso,
        });
      }
    }
  }

  const ventasPorCategoria = Array.from(categoriaMap.values())
    .sort((a, b) => b.ingresos - a.ingresos)
    .map((c) => ({ ...c, ingresos: parseFloat(c.ingresos.toFixed(2)) }));

  return NextResponse.json({
    ventasTotales: parseFloat(ventasTotales.toFixed(2)),
    pedidosTotales,
    ticketPromedio: parseFloat(ticketPromedio.toFixed(2)),
    unidadesVendidas,
    topProductos,
    ventasPorCategoria,
  });
}
