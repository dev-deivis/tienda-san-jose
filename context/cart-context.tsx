'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { useAuth } from '@/context/auth-context';

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

function itemKey(productId: number, variante?: string) {
  return `${productId}::${variante ?? ''}`;
}

/** Fusiona un producto en la lista (suma si ya existe, agrega si no). */
function mergeIntoList(
  list: CartItem[],
  product: Omit<CartItem, 'cantidad'>,
  cantidad: number
): CartItem[] {
  const k = itemKey(product.productId, product.variante);
  const exists = list.find((i) => itemKey(i.productId, i.variante) === k);
  if (exists) {
    return list.map((i) =>
      itemKey(i.productId, i.variante) === k
        ? { ...i, cantidad: i.cantidad + cantidad }
        : i
    );
  }
  return [...list, { ...product, cantidad }];
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();

  const [items, setItems] = useState<CartItem[]>([]);
  const [localHydrated, setLocalHydrated] = useState(false);

  // Referencia a los items del localStorage para la fusión (no estado, evita re-renders)
  const guestItemsRef = useRef<CartItem[]>([]);

  // Rastrea el userId anterior para detectar login/logout.
  // undefined = auth aún no resuelto (estado inicial)
  const prevUserIdRef = useRef<number | null | undefined>(undefined);

  // ── 1. Leer localStorage al montar ──────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: CartItem[] = JSON.parse(stored);
        guestItemsRef.current = parsed;
        // Mostrar items del localStorage inmediatamente mientras se resuelve auth
        setItems(parsed);
      }
    } catch {}
    setLocalHydrated(true);
  }, []);

  // ── 2. Guardar en localStorage (solo en modo invitado) ───────────────────
  useEffect(() => {
    if (!localHydrated || user) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    guestItemsRef.current = items;
  }, [items, localHydrated, user]);

  // ── 3. Cargar carrito desde la BD ────────────────────────────────────────
  const loadFromDB = useCallback(async () => {
    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const data: { items: CartItem[] } = await res.json();
        setItems(data.items);
      }
    } catch {}
  }, []);

  // ── 4. Fusionar carrito de invitado con BD y cargar ─────────────────────
  const mergeAndLoad = useCallback(async () => {
    const guestItems = guestItemsRef.current;
    if (guestItems.length > 0) {
      try {
        const res = await fetch('/api/cart/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: guestItems }),
        });
        if (res.ok) {
          const data: { items: CartItem[] } = await res.json();
          setItems(data.items);
          guestItemsRef.current = [];
          localStorage.removeItem(STORAGE_KEY);
          return;
        }
      } catch {}
    }
    // Sin items de invitado o falló la fusión → solo cargar desde BD
    await loadFromDB();
  }, [loadFromDB]);

  // ── 5. Reaccionar a cambios de sesión ────────────────────────────────────
  // Usa user?.id como dependencia para no re-disparar al cambiar propiedades
  // del objeto user que no afectan la lógica del carrito.
  useEffect(() => {
    if (authLoading || !localHydrated) return;

    const currentUserId = user?.id ?? null;
    const prevUserId = prevUserIdRef.current;
    if (prevUserId === undefined) {
      // Auth resuelto por primera vez
      prevUserIdRef.current = currentUserId;
      if (currentUserId !== null) {
        // Ya estaba logueado al cargar la página → fusionar/cargar
        mergeAndLoad();
      }
      // Si es invitado → los items del localStorage ya están en estado
      return;
    }

    if (prevUserId === null && currentUserId !== null) {
      // El usuario acaba de iniciar sesión
      mergeAndLoad();
    }

    if (prevUserId !== null && currentUserId === null) {
      // El usuario cerró sesión → limpiar carrito
      setItems([]);
      guestItemsRef.current = [];
      localStorage.removeItem(STORAGE_KEY);
    }

    prevUserIdRef.current = currentUserId;
  }, [user?.id, authLoading, localHydrated, mergeAndLoad]);

  // ── Operaciones del carrito ───────────────────────────────────────────────

  const addItem = useCallback(
    (product: Omit<CartItem, 'cantidad'>, cantidad = 1) => {
      // Actualización optimista inmediata
      setItems((prev) => mergeIntoList(prev, product, cantidad));
      if (user) {
        // Sincronizar con BD en background
        fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.productId,
            cantidad,
            variante: product.variante,
          }),
        }).catch(() => {});
      }
    },
    [user]
  );

  const removeItem = useCallback(
    (productId: number, variante?: string) => {
      setItems((prev) =>
        prev.filter(
          (i) => itemKey(i.productId, i.variante) !== itemKey(productId, variante)
        )
      );
      if (user) {
        fetch('/api/cart', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, variante }),
        }).catch(() => {});
      }
    },
    [user]
  );

  const updateQuantity = useCallback(
    (productId: number, variante: string | undefined, nuevaCantidad: number) => {
      if (nuevaCantidad < 1) {
        removeItem(productId, variante);
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          itemKey(i.productId, i.variante) === itemKey(productId, variante)
            ? { ...i, cantidad: nuevaCantidad }
            : i
        )
      );
      if (user) {
        fetch('/api/cart', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, variante, cantidad: nuevaCantidad }),
        }).catch(() => {});
      }
    },
    [user, removeItem]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    guestItemsRef.current = [];
    if (!user) localStorage.removeItem(STORAGE_KEY);
  }, [user]);

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
