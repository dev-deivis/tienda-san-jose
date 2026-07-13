import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { cloudinary } from '@/lib/cloudinary';

type Params = { params: Promise<{ id: string }> };

// GET: listar imágenes del producto
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const productId = parseInt(id, 10);

  const images = await prisma.productImage.findMany({
    where: { productId },
    orderBy: { orden: 'asc' },
  });

  return Response.json(images);
}

// DELETE: eliminar una imagen (body: { imageId })
export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session || (session.role !== 'STAFF' && session.role !== 'ADMIN')) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const productId = parseInt(id, 10);
  const body = (await request.json()) as { imageId: number };

  const image = await prisma.productImage.findFirst({
    where: { id: body.imageId, productId },
  });

  if (!image) {
    return Response.json({ error: 'Imagen no encontrada' }, { status: 404 });
  }

  // Extraer public_id de la URL de Cloudinary para borrar del CDN
  try {
    const urlParts = image.url.split('/upload/');
    if (urlParts.length === 2) {
      const withoutVersion = urlParts[1].replace(/^v\d+\//, '');
      const publicId = withoutVersion.replace(/\.[^.]+$/, '');
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (err) {
    console.error('[images] Error borrando de Cloudinary:', err);
    // Continúa aunque falle Cloudinary — borra de BD de todas formas
  }

  await prisma.productImage.delete({ where: { id: body.imageId } });

  return Response.json({ ok: true });
}

// PATCH: reordenar imágenes (body: Array<{ id: number; orden: number }>)
export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session || (session.role !== 'STAFF' && session.role !== 'ADMIN')) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const productId = parseInt(id, 10);
  const body = (await request.json()) as Array<{ id: number; orden: number }>;

  await Promise.all(
    body.map(({ id: imgId, orden }) =>
      prisma.productImage.update({
        where: { id: imgId, productId },
        data: { orden },
      })
    )
  );

  return Response.json({ ok: true });
}
