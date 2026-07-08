'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type CartItem = {
  productId: number;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen: string;
  variante?: string;
};

type CartContextType = {
  items: CartItem[];
  addItem: (product: Omit<CartItem, 'cantidad'>, cantidad?: number) => void;
  removeItem: (productId: number, variante?: string) => void;
  updateQuantity: (productId: number, variante: string | undefined, nuevaCantidad: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
};

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = 'tsj-cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Cargar desde localStorage al montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {}
    setHydrated(true);
  }, []);

  // Guardar en localStorage en cada cambio (solo después de hidratar)
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const key = (productId: number, variante?: string) =>
    `${productId}::${variante ?? ''}`;

  const addItem = useCallback((product: Omit<CartItem, 'cantidad'>, cantidad = 1) => {
    setItems((prev) => {
      const k = key(product.productId, product.variante);
      const exists = prev.find((i) => key(i.productId, i.variante) === k);
      if (exists) {
        return prev.map((i) =>
          key(i.productId, i.variante) === k
            ? { ...i, cantidad: i.cantidad + cantidad }
            : i
        );
      }
      return [...prev, { ...product, cantidad }];
    });
  }, []);

  const removeItem = useCallback((productId: number, variante?: string) => {
    setItems((prev) =>
      prev.filter((i) => key(i.productId, i.variante) !== key(productId, variante))
    );
  }, []);

  const updateQuantity = useCallback(
    (productId: number, variante: string | undefined, nuevaCantidad: number) => {
      if (nuevaCantidad < 1) {
        removeItem(productId, variante);
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          key(i.productId, i.variante) === key(productId, variante)
            ? { ...i, cantidad: nuevaCantidad }
            : i
        )
      );
    },
    [removeItem]
  );

  const clearCart = useCallback(() => setItems([]), []);

  const getTotal = useCallback(
    () => items.reduce((sum, i) => sum + i.precio * i.cantidad, 0),
    [items]
  );

  const getItemCount = useCallback(
    () => items.reduce((sum, i) => sum + i.cantidad, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, getTotal, getItemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
