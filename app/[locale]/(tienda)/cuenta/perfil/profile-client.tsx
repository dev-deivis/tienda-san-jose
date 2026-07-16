'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import type { Dictionary } from '@/app/[locale]/dictionaries';

type Props = {
  dict: Dictionary['account']['profile'];
  locale: string;
  initialData: { nombre: string; phone: string; email: string };
};

const inputClass = (error?: boolean) =>
  `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-colors ${
    error
      ? 'border-red-400 focus:ring-red-200'
      : 'border-gray-200 focus:ring-brand-purple/20 focus:border-brand-purple'
  }`;

export function ProfileClient({ dict, locale, initialData }: Props) {
  const [nombre, setNombre] = useState(initialData.nombre);
  const [phone, setPhone] = useState(initialData.phone);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), phone: phone.trim() }),
      });

      if (!res.ok) {
        setError(dict.saveError);
        return;
      }

      setSuccess(true);
    } catch {
      setError(dict.saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
      {/* Nombre */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">{dict.fullName}</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => { setNombre(e.target.value); setSuccess(false); }}
          placeholder={dict.fullNamePlaceholder}
          className={inputClass()}
        />
      </div>

      {/* Teléfono */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">{dict.phone}</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => { setPhone(e.target.value); setSuccess(false); }}
          placeholder={dict.phonePlaceholder}
          className={inputClass()}
        />
      </div>

      {/* Email — solo lectura */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">{dict.emailLabel}</label>
        <input
          type="email"
          value={initialData.email}
          readOnly
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 bg-gray-50 cursor-not-allowed"
        />
        <p className="text-xs text-gray-400 mt-0.5">{dict.emailReadonlyNote}</p>
      </div>

      {/* Feedback */}
      {success && (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm">
          <CheckCircle size={16} className="shrink-0" />
          {dict.saveSuccess}
        </div>
      )}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {/* Acciones */}
      <div className="flex items-center justify-between pt-1">
        <Link
          href={`/${locale}/cuenta`}
          className="text-sm text-gray-500 hover:text-brand-purple transition-colors"
        >
          {dict.back}
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 bg-brand-purple text-white rounded-xl text-sm font-semibold hover:bg-brand-purple-dark transition-colors disabled:opacity-60"
        >
          {saving ? dict.saving : dict.saveButton}
        </button>
      </div>
    </form>
  );
}
