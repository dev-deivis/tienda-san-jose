'use client';

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import type { Dictionary } from '@/app/[locale]/dictionaries';

type Props = {
  dict: Dictionary['changePassword'];
};

export function ChangePasswordClient({ dict }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNew, setConfirmNew] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword !== confirmNew) {
      setError(dict.errorMismatch);
      return;
    }

    if (newPassword.length < 6) {
      setError(dict.errorTooShort);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'WRONG_PASSWORD') {
          setError(dict.errorWrongPassword);
        } else if (data.error === 'UNAUTHORIZED') {
          setError(dict.errorUnauthorized);
        } else if (data.error === 'PASSWORD_TOO_SHORT') {
          setError(dict.errorTooShort);
        } else {
          setError(dict.errorGeneric);
        }
        return;
      }

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNew('');
    } catch {
      setError(dict.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8">
      {success ? (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <CheckCircle size={48} className="text-green-500" strokeWidth={1.5} />
          <div>
            <h2 className="font-semibold text-gray-900 text-lg">{dict.successTitle}</h2>
            <p className="text-sm text-gray-500 mt-1">{dict.successDesc}</p>
          </div>
          <button
            onClick={() => setSuccess(false)}
            className="mt-2 text-sm text-brand-purple font-medium hover:underline"
          >
            {dict.submitButton}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Contraseña actual */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              {dict.currentPassword}
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={dict.currentPasswordPlaceholder}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-colors"
            />
          </div>

          {/* Nueva contraseña */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              {dict.newPassword}
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={dict.newPasswordPlaceholder}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-colors"
            />
          </div>

          {/* Confirmar nueva contraseña */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              {dict.confirmNewPassword}
            </label>
            <input
              type="password"
              value={confirmNew}
              onChange={(e) => setConfirmNew(e.target.value)}
              placeholder={dict.confirmNewPasswordPlaceholder}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-colors"
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
            {loading ? dict.submitting : dict.submitButton}
          </button>
        </form>
      )}
    </div>
  );
}
