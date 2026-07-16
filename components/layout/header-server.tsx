import { prisma } from '@/lib/prisma';
import { Header } from './header';
import type { Dictionary } from '@/app/[locale]/dictionaries';
import type { Locale } from '@/i18n/routing';

type Props = {
  dict: Dictionary['nav'];
  searchDict: Dictionary['search'];
  locale: Locale;
};

export async function HeaderServer({ dict, searchDict, locale }: Props) {
  const categories = await prisma.category.findMany({
    select: { id: true, nombre: true, slug: true },
    orderBy: { id: 'asc' },
  });
  return <Header categories={categories} dict={dict} searchDict={searchDict} locale={locale} />;
}
