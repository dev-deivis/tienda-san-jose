'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type CurrentUser = {
  id: number;
  email: string;
  nombre: string | null;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  createdAt: string;
};

type AuthContextType = {
  user: CurrentUser | null;
  loading: boolean;
  /** Actualiza el usuario en el contexto (usar tras login/registro exitoso). */
  setUser: (user: CurrentUser | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data: { user: CurrentUser | null }) => setUser(data.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
