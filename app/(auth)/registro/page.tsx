'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, type CurrentUser } from '@/context/auth-context';

export default function RegistroPage() {
  const router = useRouter();
  const { setUser } = useAuth();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error al crear la cuenta');
        return;
      }

      // Actualizar AuthContext inmediatamente → dispara la fusión del carrito
      setUser(data.user as CurrentUser);

      // Registro siempre crea CUSTOMER → redirige a home
      router.push('/');
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo / Branding */}
      <div className="text-center mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Tienda San José"
          className="w-20 h-20 object-contain mx-auto mb-3"
        />
        <h1 className="font-serif text-2xl font-bold text-brand-purple">
          Crear cuenta
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Únete a la comunidad de Tienda San José
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Nombre */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Nombre completo
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="María González"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-colors"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-colors"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-colors"
            />
          </div>

          {/* Confirmar password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Confirmar contraseña
            </label>
            <input
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              placeholder="Repite tu contraseña"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-colors"
            />
          </div>

          {/* Nota sobre roles */}
          <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
            Las cuentas públicas se crean como <strong>Cliente</strong>. Los
            roles de Staff y Admin se asignan manualmente desde el panel de
            administración.
          </p>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-purple text-white rounded-xl font-semibold hover:bg-brand-purple-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link
            href="/login"
            className="text-brand-purple font-medium hover:underline"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
