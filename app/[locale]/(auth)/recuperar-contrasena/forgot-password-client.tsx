'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Dictionary } from '@/app/[locale]/dictionaries';

type Props = {
  dict: Dictionary['forgotPassword'];
  authDict: Dictionary['auth'];
  locale: string;
};

export function ForgotPasswordClient({ dict, authDict, locale }: Props) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? dict.genericError);
        return;
      }

      setSubmitted(true);
    } catch {
      setError(dict.genericError);
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
          {dict.title}
        </h1>
        <p className="text-sm text-gray-400 mt-1">{dict.subtitle}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8">
        {submitted ? (
          /* Estado de éxito — mensaje genérico */
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
            <h2 className="font-semibold text-gray-800 text-lg">
              {dict.successTitle}
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              {dict.successMessage}
            </p>
            <Link
              href={`/${locale}/login`}
              className="mt-2 text-sm text-brand-purple font-medium hover:underline"
            >
              {dict.backToLogin}
            </Link>
          </div>
        ) : (
          /* Formulario */
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                {dict.emailLabel}
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
              {loading ? dict.sending : dict.submitButton}
            </button>

            <p className="text-center text-sm text-gray-500">
              <Link
                href={`/${locale}/login`}
                className="text-brand-purple font-medium hover:underline"
              >
                {dict.backToLogin}
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
