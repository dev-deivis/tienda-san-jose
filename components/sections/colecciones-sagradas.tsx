import Link from 'next/link';

type Category = {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  imagen: string | null;
};

// Colores de fondo para categorías sin imagen (cicla por índice)
const FALLBACK_COLORS = [
  'bg-brand-purple',
  'bg-brand-magenta',
  'bg-brand-gold',
  'bg-brand-purple-dark',
  '#6B5B7B',
];

export function ColeccionesSagradas({ categories }: { categories: Category[] }) {
  return (
    <section className="bg-cream py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Encabezado */}
        <div className="text-center mb-12">
          <h2 className="font-serif text-4xl font-bold text-brand-purple">Colecciones Sagradas</h2>
          <p className="mt-3 text-gray-500 max-w-xl mx-auto text-base leading-relaxed">
            Encuentra inspiración y devoción en nuestras categorías principales, curadas con
            reverencia y atención al detalle.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-[200px] md:auto-rows-[220px]">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              href={`/categoria/${cat.slug}`}
              className={`relative overflow-hidden rounded-2xl group ${
                i === 0 ? 'col-span-2 row-span-2' : ''
              }`}
            >
              {cat.imagen ? (
                /* Imagen real de Cloudinary */
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cat.imagen}
                  alt={cat.nombre}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                /* Fallback: color sólido */
                <div
                  className={`absolute inset-0 ${FALLBACK_COLORS[i % 4]}`}
                />
              )}
              {/* Overlay degradado */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              {/* Texto */}
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                <h3
                  className={`font-serif font-bold text-white ${
                    i === 0 ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'
                  }`}
                >
                  {cat.nombre}
                </h3>
                {cat.descripcion && (
                  <p
                    className={`text-white/75 mt-1 leading-snug ${
                      i === 0
                        ? 'text-sm md:text-base line-clamp-2'
                        : 'text-xs line-clamp-1'
                    }`}
                  >
                    {cat.descripcion}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
