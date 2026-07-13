import { getSessionUser } from '@/lib/auth';
import { cloudinary } from '@/lib/cloudinary';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const session = await getSessionUser();

  if (!session || (session.role !== 'STAFF' && session.role !== 'ADMIN')) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get('file') as File | null;

    if (!file) {
      return Response.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'tienda-san-jose/productos',
            transformation: [
              { width: 800, height: 800, crop: 'limit', quality: 'auto' },
            ],
          },
          (error, result) => {
            if (error || !result) reject(error);
            else resolve(result as { secure_url: string });
          }
        )
        .end(buffer);
    });

    return Response.json({ url: result.secure_url });
  } catch (err) {
    console.error('[upload] Error:', err);
    return Response.json({ error: 'Error al subir la imagen' }, { status: 500 });
  }
}
