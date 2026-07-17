'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Dictionary } from '@/app/[locale]/dictionaries';

type Props = {
  dict: Dictionary['forgotPassword'];
  authDict: Dictionary['auth'];
  locale: string;
  token: string;
};

export function ResetPasswordClient({ dict, authDict, locale, token }: Props) {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmar) {
      setError(dict.passwordMismatch);
      return;
    }

    if (password.length < 6) {
      setError(dict.passwordTooShort);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? dict.resetError);
        return;
      }

      setSuccess(true);
      // Redirigir al login después de 2 segundos
      setTimeout(() => router.push(`/${locale}/login`), 2000);
    } catch {
      setError(dict.resetError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt={authDict.logoAlt}
          className="w-20 h-20 object-contain mx-auto mb-3"
        />
        <h1 className="font-serif text-2xl font-bold text-brand-purple">
          {dict.resetTitle}
        </h1>
        <p className="text-sm text-gray-400 mt-1">{dict.resetSubtitle}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8">
        {success ? (
          /* Estado de éxito */
          <div className="flex flex-col items-center gap-4 text-center py-4">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {dict.resetSuccess}
            </p>
            <Link
              href={`/${locale}/login`}
              className="mt-2 text-sm text-brand-purple font-medium hover:underline"
            >
              {dict.goToLogin}
            </Link>
          </div>
        ) : (
          /* Formulario */
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                {dict.newPassword}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={dict.newPasswordPlaceholder}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                {dict.confirmPassword}
              </label>
              <input
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder={dict.confirmPasswordPlaceholder}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-colors"
              />
            </div>

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
              {loading ? dict.resetting : dict.resetButton}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
