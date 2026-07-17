'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, type CurrentUser } from '@/context/auth-context';
import type { Dictionary } from '@/app/[locale]/dictionaries';

type Props = {
  dict: Dictionary['auth'];
  locale: string;
};

export function LoginClient({ dict, locale }: Props) {
  const router = useRouter();
  const { setUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? dict.connectionError);
        return;
      }

      // Actualizar AuthContext inmediatamente → dispara la fusión del carrito
      setUser(data.user as CurrentUser);

      const role: string = data.user?.role ?? 'CUSTOMER';
      if (role === 'ADMIN') router.push('/admin');
      else if (role === 'STAFF') router.push('/staff');
      else router.push(`/${locale}`);
    } catch {
      setError(dict.connectionError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt={dict.logoAlt}
          className="w-86 h-86 object-contain mx-auto"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-10 -mt-10">
        <div className="text-center mb-7">
          <h1 className="font-serif text-2xl font-bold text-brand-purple">
            {dict.loginTitle}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {dict.loginSubtitle}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              {dict.email}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={dict.emailPlaceholder}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-colors"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              {dict.password}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-colors"
            />
          </div>

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
            {loading ? dict.loggingIn : dict.loginButton}
          </button>

          <p className="text-center text-sm">
            <Link
              href={`/${locale}/recuperar-contrasena`}
              className="text-brand-purple hover:underline"
            >
              {dict.forgotPassword}
            </Link>
          </p>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {dict.noAccount}{' '}
          <Link
            href={`/${locale}/registro`}
            className="text-brand-purple font-medium hover:underline"
          >
            {dict.registerLink}
          </Link>
        </p>
      </div>
    </div>
  );
}
