import { prisma } from '../lib/prisma';

async function main() {
  const products = await prisma.product.findMany({
    where: { imagen: { not: null } },
    select: { id: true, imagen: true },
  });

  let migrated = 0;
  for (const p of products) {
    if (!p.imagen) continue;
    // Solo crear si no existe ya un ProductImage para este producto
    const exists = await prisma.productImage.count({ where: { productId: p.id } });
    if (exists === 0) {
      await prisma.productImage.create({
        data: { productId: p.id, url: p.imagen, orden: 0 },
      });
      migrated++;
    }
  }
  console.log(`Migradas ${migrated} imágenes.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
