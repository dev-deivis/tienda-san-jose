'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { User, KeyRound, CheckCircle } from 'lucide-react';

const inputClass = (error?: boolean) =>
  `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-colors ${
    error
      ? 'border-red-400 focus:ring-red-200'
      : 'border-gray-200 focus:ring-brand-purple/20 focus:border-brand-purple'
  }`;

// ── Sección Perfil ─────────────────────────────────────────────────────────────

function ProfileSection({ email, initialNombre, initialPhone }: {
  email: string;
  initialNombre: string;
  initialPhone: string;
}) {
  const [nombre, setNombre] = useState(initialNombre);
  const [phone, setPhone] = useState(initialPhone);
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
      if (!res.ok) { setError('Error al guardar. Intenta de nuevo.'); return; }
      setSuccess(true);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <User size={18} className="text-brand-purple" strokeWidth={1.5} />
        <h2 className="font-semibold text-gray-800">Perfil</h2>
      </div>
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Nombre completo</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => { setNombre(e.target.value); setSuccess(false); }}
            placeholder="María González"
            className={inputClass()}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Teléfono</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setSuccess(false); }}
            placeholder="(239) 555-0100"
            className={inputClass()}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Correo electrónico</label>
          <input
            type="email"
            value={email}
            readOnly
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 bg-gray-50 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400">El email no se puede cambiar desde aquí.</p>
        </div>
        {success && (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm">
            <CheckCircle size={15} className="shrink-0" />
            ¡Cambios guardados correctamente!
          </div>
        )}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
        )}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-brand-purple text-white rounded-xl text-sm font-semibold hover:bg-brand-purple-dark transition-colors disabled:opacity-60"
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Sección Cambiar Contraseña ─────────────────────────────────────────────────

function PasswordSection() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) { setError('Las contraseñas nuevas no coinciden.'); return; }
    if (next.length < 6) { setError('La nueva contraseña debe tener al menos 6 caracteres.'); return; }
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      const res = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        if (data.error === 'WRONG_PASSWORD') setError('La contraseña actual no es correcta.');
        else setError('Error al cambiar la contraseña. Intenta de nuevo.');
        return;
      }
      setSuccess(true);
      setCurrent(''); setNext(''); setConfirm('');
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <KeyRound size={18} className="text-brand-purple" strokeWidth={1.5} />
        <h2 className="font-semibold text-gray-800">Cambiar contraseña</h2>
      </div>
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        {['Contraseña actual', 'Nueva contraseña', 'Confirmar nueva contraseña'].map((label, i) => {
          const val = [current, next, confirm][i];
          const setter = [setCurrent, setNext, setConfirm][i];
          return (
            <div key={label} className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">{label}</label>
              <input
                type="password"
                value={val}
                onChange={(e) => { setter(e.target.value); setSuccess(false); setError(null); }}
                placeholder="••••••"
                className={inputClass()}
              />
            </div>
          );
        })}
        {success && (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm">
            <CheckCircle size={15} className="shrink-0" />
            ¡Contraseña actualizada correctamente!
          </div>
        )}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
        )}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-brand-purple text-white rounded-xl text-sm font-semibold hover:bg-brand-purple-dark transition-colors disabled:opacity-60"
          >
            {saving ? 'Cambiando…' : 'Cambiar contraseña'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────

export default function AdminCuentaPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-2xl py-8 text-sm text-gray-400">Cargando…</div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-gray-800">Mi cuenta</h2>
        <p className="text-sm text-gray-500 mt-0.5">Gestiona tu perfil y contraseña de acceso</p>
      </div>
      <ProfileSection
        email={user.email}
        initialNombre={user.nombre ?? ''}
        initialPhone={user.phone ?? ''}
      />
      <PasswordSection />
    </div>
  );
}
