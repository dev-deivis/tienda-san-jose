import { getSessionUser } from '@/lib/auth';
import { cloudinary } from '@/lib/cloudinary';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const session = await getSessionUser();
  if (!session || (session.role !== 'STAFF' && session.role !== 'ADMIN')) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get('file') as File | null;
    const productIdRaw = form.get('productId') as string | null;
    const productId = productIdRaw ? parseInt(productIdRaw, 10) : null;
    // Carpeta destino en Cloudinary (default: productos)
    const folderParam = (form.get('folder') as string | null)?.trim();
    const folder = folderParam && folderParam.startsWith('tienda-san-jose/')
      ? folderParam
      : 'tienda-san-jose/productos';

    if (!file) {
      return Response.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            transformation: [
              { width: 800, height: 800, crop: 'limit', quality: 'auto' },
            ],
          },
          (error, result) => {
            if (error || !result) reject(error);
            else resolve(result as { secure_url: string; public_id: string });
          }
        )
        .end(buffer);
    });

    // Si viene productId, crear ProductImage en BD
    let productImage = null;
    if (productId && !isNaN(productId)) {
      // Calcular el siguiente orden
      const maxOrden = await prisma.productImage.aggregate({
        where: { productId },
        _max: { orden: true },
      });
      const nextOrden = (maxOrden._max.orden ?? -1) + 1;

      productImage = await prisma.productImage.create({
        data: { productId, url: result.secure_url, orden: nextOrden },
      });
    }

    return Response.json({
      url: result.secure_url,
      publicId: result.public_id,
      productImage,
    });
  } catch (err) {
    console.error('[upload] Error:', err);
    return Response.json({ error: 'Error al subir la imagen' }, { status: 500 });
  }
}
