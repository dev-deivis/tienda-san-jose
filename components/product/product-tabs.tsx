'use client';

import { useState } from 'react';

type Props = {
  descripcion: string | null;
  categorySlug: string;
};

const SHIPPING_TEXT = `Todos nuestros pedidos se procesan y envían desde Bonita Springs, FL en un plazo de 1-2 días hábiles. El tiempo estimado de entrega es de 3-7 días hábiles para todo Estados Unidos. Enviamos con USPS Priority Mail y UPS. Recibirás un número de seguimiento por correo electrónico una vez que tu pedido haya sido enviado.`;

function getCareText(slug: string): string {
  if (slug.includes('plata') || slug.includes('oro') || slug.includes('joyeria')) {
    return `Para mantener el brillo y la belleza de tus piezas de joyería: guárdalas en un lugar seco y alejado de la humedad, limpia con un paño suave de algodón, evita el contacto con perfumes, cremas y productos químicos, retíralas antes de bañarte o hacer ejercicio. Para piezas de plata 925, un paño especial antioxidante alargará su vida útil.`;
  }
  if (slug.includes('velas')) {
    return `Para un uso seguro de tus velas: nunca las dejes encendidas sin supervisión, mantenlas alejadas de corrientes de aire y materiales inflamables, colócalas sobre superficies resistentes al calor, recorta la mecha a 1 cm antes de cada uso para una llama limpia y pareja, y apágalas cuando queden menos de 2 cm de cera.`;
  }
  if (slug.includes('ropa')) {
    return `Para conservar la blancura y delicadeza de los artículos ceremoniales: lava a mano con agua fría y jabón neutro, no uses blanqueadores con cloro, seca a la sombra extendido sobre una superficie plana, plancha al revés con temperatura baja, guarda en bolsa de tela o papel de seda para evitar el amarillamiento.`;
  }
  return `Maneja cada artículo con cuidado y respeto. Guárdalo en un lugar seco, alejado de la luz solar directa y de la humedad. Limpia con un paño suave y seco. Para piezas de madera, aplica ocasionalmente aceite de oliva con un paño para mantener su lustre natural.`;
}

const TABS = ['Descripción', 'Envío', 'Cuidados'] as const;

export function ProductTabs({ descripcion, categorySlug }: Props) {
  const [active, setActive] = useState<typeof TABS[number]>('Descripción');

  const content: Record<typeof TABS[number], string> = {
    'Descripción': descripcion ?? 'Sin descripción disponible.',
    'Envío': SHIPPING_TEXT,
    'Cuidados': getCareText(categorySlug),
  };

  return (
    <div className="mt-12">
      {/* Tab buttons */}
      <div className="flex border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              active === tab
                ? 'border-brand-purple text-brand-purple'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      {/* Tab content */}
      <div className="py-6 text-gray-600 leading-relaxed text-sm max-w-3xl">
        {content[active]}
      </div>
    </div>
  );
}
