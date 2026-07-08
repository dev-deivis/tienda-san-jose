'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type ArcGalleryHeroProps = {
  images: string[];
  startAngle?: number;
  endAngle?: number;
  radiusLg?: number;
  radiusMd?: number;
  radiusSm?: number;
  cardSizeLg?: number;
  cardSizeMd?: number;
  cardSizeSm?: number;
  className?: string;
};

export const ArcGalleryHero: React.FC<ArcGalleryHeroProps> = ({
  images,
  startAngle = 20,
  endAngle = 160,
  radiusLg = 480,
  radiusMd = 360,
  radiusSm = 260,
  cardSizeLg = 120,
  cardSizeMd = 100,
  cardSizeSm = 80,
  className = '',
}) => {
  const [dimensions, setDimensions] = useState({ radius: radiusLg, cardSize: cardSizeLg });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setDimensions({ radius: radiusSm, cardSize: cardSizeSm });
      } else if (width < 1024) {
        setDimensions({ radius: radiusMd, cardSize: cardSizeMd });
      } else {
        setDimensions({ radius: radiusLg, cardSize: cardSizeLg });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [radiusLg, radiusMd, radiusSm, cardSizeLg, cardSizeMd, cardSizeSm]);

  const count = Math.max(images.length, 2);
  const step = (endAngle - startAngle) / (count - 1);

  return (
    <section
      className={`relative overflow-hidden bg-cream text-gray-900 min-h-screen flex flex-col ${className}`}
    >
      <div
        className="relative mx-auto"
        style={{ width: '100%', height: dimensions.radius * 1.2 }}
      >
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2">
          {images.map((src, i) => {
            const angle = startAngle + step * i;
            const angleRad = (angle * Math.PI) / 180;
            const x = Math.cos(angleRad) * dimensions.radius;
            const y = Math.sin(angleRad) * dimensions.radius;

            return (
              <div
                key={i}
                className="absolute opacity-0 animate-fade-in-up"
                style={{
                  width: dimensions.cardSize,
                  height: dimensions.cardSize,
                  left: `calc(50% + ${x}px)`,
                  bottom: `${y}px`,
                  transform: `translate(-50%, 50%)`,
                  animationDelay: `${i * 100}ms`,
                  animationFillMode: 'forwards',
                  zIndex: count - i,
                }}
              >
                <div
                  className="rounded-2xl shadow-xl overflow-hidden ring-1 ring-brand-gold/30 bg-white transition-transform hover:scale-105 w-full h-full"
                  style={{ transform: `rotate(${angle / 4}deg)` }}
                >
                  <img
                    src={src}
                    alt={`Artículo ${i + 1}`}
                    className="block w-full h-full object-cover"
                    draggable={false}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://placehold.co/400x400/3D1560/FDF8F3?text=TSJ`;
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="relative z-10 flex-1 flex items-center justify-center px-6 -mt-64 md:-mt-80 lg:-mt-96 opacity-0 animate-fade-in"
        style={{ animationDelay: '800ms', animationFillMode: 'forwards' }}
      >
        <div className="text-center max-w-2xl px-6">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="Logo Tienda San José"
              width={580}
              height={580}
              className="object-contain drop-shadow-md"
              priority
            />
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-brand-purple">
            Bendiciones en cada detalle
          </h1>
          <p className="mt-4 text-lg text-gray-600 leading-relaxed">
            Tu tienda de confianza en Bonita Springs, Florida, para artículos religiosos que celebran
            la fe y la familia. Descubre nuestra cuidada selección de piezas con significado profundo.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/categoria/articulos-religiosos"
              className="w-full sm:w-auto px-7 py-3 rounded-full bg-brand-purple text-white hover:bg-brand-purple-dark transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
            >
              Explorar Catálogo
            </Link>
            <Link
              href="/nosotros"
              className="w-full sm:w-auto px-7 py-3 rounded-full border-2 border-brand-gold text-brand-purple hover:bg-brand-gold/10 transition-all duration-200 font-medium"
            >
              Nuestra Historia
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translate(-50%, 60%); }
          to   { opacity: 1; transform: translate(-50%, 50%); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation-name: fade-in-up;
          animation-duration: 0.8s;
          animation-timing-function: ease-out;
        }
        .animate-fade-in {
          animation-name: fade-in;
          animation-duration: 0.8s;
          animation-timing-function: ease-out;
        }
      `}</style>
    </section>
  );
};
