import { HeaderServer } from '@/components/layout/header-server';
import { Footer } from '@/components/layout/footer';

export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HeaderServer />
      <main>{children}</main>
      <Footer />
    </>
  );
}
