'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Search, X, ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Dictionary } from '@/app/[locale]/dictionaries';

type SearchProduct = {
  id: number;
  nombre: string;
  precio: number;
  imagen: string | null;
  images: { url: string }[];
};

type Props = {
  navDict: Dictionary['nav'];
  searchDict: Dictionary['search'];
};

const DEBOUNCE_MS = 300;

export function SearchOverlay({ navDict, searchDict }: Props) {
  // show: controla si el DOM del overlay está montado
  // animate: controla las clases CSS de transición (siempre sigue a show con ~10ms de delay)
  const [show, setShow] = useState(false);
  const [animate, setAnimate] = useState(false);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false); // ¿ya se hizo al menos una búsqueda?

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const router = useRouter();

  // Abrir overlay
  const open = useCallback(() => {
    setShow(true);
    // Pequeño delay para que el DOM esté listo antes de animar
    setTimeout(() => setAnimate(true), 10);
  }, []);

  // Cerrar overlay con animación de salida
  const close = useCallback(() => {
    setAnimate(false);
    setTimeout(() => {
      setShow(false);
      setQuery('');
      setResults([]);
      setSearched(false);
    }, 200);
  }, []);

  // Autofocus al abrir
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [show]);

  // Cerrar con Escape
  useEffect(() => {
    if (!show) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [show, close]);

  // Bloquear scroll del body mientras el overlay está abierto
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [show]);

  // Búsqueda con debounce + AbortController
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    const q = query.trim();

    if (!q || q.length < 2) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      // Cancelar request anterior
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      try {
        const res = await fetch(
          `/api/products/search?q=${encodeURIComponent(q)}`,
          { signal: abortRef.current.signal }
        );
        if (!res.ok) throw new Error('Error en búsqueda');
        const data = await res.json() as SearchProduct[];
        setResults(data);
        setSearched(true);
      } catch (err) {
        // Ignorar AbortError (request cancelado intencionalmente)
        if (err instanceof Error && err.name === 'AbortError') return;
        setResults([]);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  const handleResultClick = () => {
    close();
  };

  const handleVerTodos = () => {
    close();
    router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
  };

  const showResults = searched && query.trim().length >= 2;

  return (
    <>
      {/* Botón lupa en el header */}
      <button
        onClick={open}
        className="p-2 text-gray-600 hover:text-brand-purple transition-colors"
        aria-label={navDict.searchLabel}
      >
        <Search size={20} />
      </button>

      {/* Overlay */}
      {show && (
        <div
          className={`fixed inset-0 z-[60] flex flex-col items-center transition-opacity duration-200 ${
            animate ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={close}
          />

          {/* Panel de búsqueda — ocupa la parte superior */}
          <div
            className={`relative w-full max-w-2xl mx-4 mt-24 sm:mt-32 transition-all duration-200 ${
              animate ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
            }`}
          >
            {/* Input */}
            <div className="relative flex items-center bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              <Search size={20} className="ml-4 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={navDict.searchPlaceholder}
                className="flex-1 px-4 py-4 text-base text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
              />
              {loading && (
                <div className="mr-3 w-4 h-4 border-2 border-brand-purple/30 border-t-brand-purple rounded-full animate-spin shrink-0" />
              )}
              <button
                onClick={close}
                className="mr-3 p-1.5 text-gray-400 hover:text-gray-700 transition-colors shrink-0"
                aria-label={navDict.closeSearch}
              >
                <X size={18} />
              </button>
            </div>

            {/* Resultados */}
            {showResults && (
              <div className="mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                {results.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-gray-500 text-center">
                    {searchDict.noResults.replace('{query}', query.trim())}
                  </p>
                ) : (
                  <>
                    <ul className="divide-y divide-gray-100">
                      {results.map((product) => {
                        const imgSrc = product.images[0]?.url ?? product.imagen ?? null;
                        return (
                          <li key={product.id}>
                            <Link
                              href={`/producto/${product.id}`}
                              onClick={handleResultClick}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                            >
                              {/* Imagen miniatura */}
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                {imgSrc ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={imgSrc}
                                    alt={product.nombre}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <ImageIcon size={20} strokeWidth={1} />
                                  </div>
                                )}
                              </div>

                              {/* Nombre y precio */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 group-hover:text-brand-purple transition-colors line-clamp-1">
                                  {product.nombre}
                                </p>
                                <p className="text-sm font-bold text-brand-purple mt-0.5">
                                  ${product.precio.toFixed(2)}
                                </p>
                              </div>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>

                    {/* Ver todos */}
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                      <button
                        onClick={handleVerTodos}
                        className="text-sm text-brand-purple hover:text-brand-purple-dark font-medium transition-colors"
                      >
                        {searchDict.viewAll.replace('{query}', query.trim())}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
