import { Truck, HeartHandshake, Users } from 'lucide-react';

const badges = [
  {
    icon: Truck,
    title: 'Envío seguro a todo EE.UU.',
    desc: 'Cada pedido empacado con cuidado y enviado de forma segura a cualquier estado.',
  },
  {
    icon: HeartHandshake,
    title: 'Piezas bendecidas antes de enviar',
    desc: 'Cada artículo recibe una bendición especial antes de llegar a tus manos.',
  },
  {
    icon: Users,
    title: 'Atención familiar y personalizada',
    desc: 'Somos una familia que atiende a tu familia. Escríbenos sin compromiso.',
  },
];

export function TrustBadges() {
  return (
    <section className="bg-white py-14 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        {badges.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex flex-col items-center text-center gap-3">
            <div className="p-3 rounded-full bg-brand-gold/10">
              <Icon size={28} className="text-brand-gold" />
            </div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
