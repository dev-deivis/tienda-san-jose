import { prisma } from '@/lib/prisma';
import { Header } from './header';

export async function HeaderServer() {
  const categories = await prisma.category.findMany({
    select: { id: true, nombre: true, slug: true },
    orderBy: { id: 'asc' },
  });
  return <Header categories={categories} />;
}
