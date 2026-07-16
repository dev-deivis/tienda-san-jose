import { Truck, HeartHandshake, Users } from 'lucide-react';
import type { Dictionary } from '@/app/[locale]/dictionaries';

type Props = { dict: Dictionary['trust'] };

export function TrustBadges({ dict }: Props) {
  const badges = [
    { icon: Truck,          title: dict.shippingTitle, desc: dict.shippingDesc },
    { icon: HeartHandshake, title: dict.blessedTitle,  desc: dict.blessedDesc  },
    { icon: Users,          title: dict.careTitle,     desc: dict.careDesc     },
  ];

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
