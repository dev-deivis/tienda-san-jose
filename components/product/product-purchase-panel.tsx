'use client';

import { useState } from 'react';
import { ShoppingCart, MapPin, Check } from 'lucide-react';

type Props = {
  product: {
    id: number;
    nombre: string;
    precio: number;
    descripcion: string | null;
    stock: number;
    attributes: Record<string, string> | null;
  };
};

export function ProductPurchasePanel({ product }: Props) {
  const [cantidad, setCantidad] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    // TODO: conectar con el carrito real
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  const attrs = product.attributes ?? {};

  return (
    <div className="flex flex-col gap-6">
      {/* Nombre y precio */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-gray-900 leading-tight">
          {product.nombre}
        </h1>
        <p className="mt-3 text-3xl font-bold text-brand-purple">
          ${product.precio.toFixed(2)}
        </p>
      </div>

      {/* Descripción corta */}
      {product.descripcion && (
        <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
          {product.descripcion}
        </p>
      )}

      {/* Atributos */}
      {Object.entries(attrs).length > 0 && (
        <div className="flex flex-col gap-3">
          {Object.entries(attrs).map(([key, val]) => {
            const label: Record<string, string> = {
              material: 'Material', edicion: 'Edición', tapa: 'Tapa',
              talla: 'Talla', color: 'Color', ocasion: 'Ocasión',
              duracion: 'Duración', peso: 'Peso',
            };
            return (
              <div key={key}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  {label[key] ?? key}
                </p>
                <span className="inline-block px-4 py-1.5 rounded-full bg-brand-purple/10 text-brand-purple text-sm font-medium border border-brand-purple/20">
                  {val}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Selector de cantidad */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Cantidad
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCantidad((c) => Math.max(1, c - 1))}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-brand-purple hover:text-brand-purple transition-colors text-lg font-medium"
          >
            −
          </button>
          <span className="w-10 text-center font-semibold text-gray-900">{cantidad}</span>
          <button
            onClick={() => setCantidad((c) => Math.min(product.stock, c + 1))}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-brand-purple hover:text-brand-purple transition-colors text-lg font-medium"
          >
            +
          </button>
          <span className="text-xs text-gray-400 ml-1">{product.stock} disponibles</span>
        </div>
      </div>

      {/* Botón agregar */}
      <button
        onClick={handleAdd}
        className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base transition-all duration-300 ${
          added
            ? 'bg-green-500 text-white'
            : 'bg-brand-purple text-white hover:bg-brand-purple-dark shadow-lg hover:shadow-xl hover:-translate-y-0.5'
        }`}
      >
        {added ? (
          <><Check size={20} /> ¡Agregado al carrito!</>
        ) : (
          <><ShoppingCart size={20} /> Agregar al carrito</>
        )}
      </button>

      {/* Envío */}
      <p className="flex items-center gap-1.5 text-xs text-gray-400">
        <MapPin size={13} className="text-brand-gold" />
        Envíos desde Bonita Springs, FL
      </p>
    </div>
  );
}
