'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { MapPin, Plus, Star, Pencil, Trash2, X } from 'lucide-react';
import type { Dictionary } from '@/app/[locale]/dictionaries';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Address = {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  direccion1: string;
  direccion2: string | null;
  ciudad: string;
  estado: string;
  codigoPostal: string;
  pais: string;
  isDefault: boolean;
};

type AddressFormData = {
  nombre: string;
  apellido: string;
  telefono: string;
  direccion1: string;
  direccion2: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
  isDefault: boolean;
};

type FormErrors = Partial<Record<keyof AddressFormData, string>>;

type Props = {
  dict: Dictionary['account']['addresses'];
  locale: string;
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma',
  'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming',
];

const EMPTY_FORM: AddressFormData = {
  nombre: '', apellido: '', telefono: '',
  direccion1: '', direccion2: '', ciudad: '',
  estado: '', codigoPostal: '', isDefault: false,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputClass = (error?: string) =>
  `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-colors ${
    error
      ? 'border-red-400 focus:ring-red-200'
      : 'border-gray-200 focus:ring-brand-purple/20 focus:border-brand-purple'
  }`;

// ─── Componente principal ─────────────────────────────────────────────────────

export function AddressesClient({ dict, locale }: Props) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Estado del modal de formulario
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AddressFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Estado del modal de confirmación de eliminación
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [settingDefaultId, setSettingDefaultId] = useState<number | null>(null);
  const [defaultError, setDefaultError] = useState<string | null>(null);

  // ── Validación ───────────────────────────────────────────────────────────
  const validateForm = (data: AddressFormData): FormErrors => {
    const errs: FormErrors = {};
    if (!data.nombre.trim()) errs.nombre = dict.errorFirstName;
    if (!data.apellido.trim()) errs.apellido = dict.errorLastName;
    if (!data.telefono.trim()) errs.telefono = dict.errorPhone;
    if (!data.direccion1.trim()) errs.direccion1 = dict.errorAddress1;
    if (!data.ciudad.trim()) errs.ciudad = dict.errorCity;
    if (!data.estado) errs.estado = dict.errorState;
    if (!data.codigoPostal.trim()) {
      errs.codigoPostal = dict.errorZip;
    } else if (!/^\d{5}$/.test(data.codigoPostal.trim())) {
      errs.codigoPostal = dict.errorZipFormat;
    }
    return errs;
  };

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/account/addresses');
      if (!res.ok) {
        setFetchError(dict.loadError);
        return;
      }
      const data = await res.json() as Address[];
      setAddresses(data);
    } catch {
      setFetchError(dict.connectionError);
    } finally {
      setLoading(false);
    }
  }, [dict.loadError, dict.connectionError]);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  // ── Modal add/edit ───────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setSaveError(null);
    setModalOpen(true);
  };

  const openEdit = (addr: Address) => {
    setEditingId(addr.id);
    setForm({
      nombre: addr.nombre,
      apellido: addr.apellido,
      telefono: addr.telefono,
      direccion1: addr.direccion1,
      direccion2: addr.direccion2 ?? '',
      ciudad: addr.ciudad,
      estado: addr.estado,
      codigoPostal: addr.codigoPostal,
      isDefault: addr.isDefault,
    });
    setErrors({});
    setSaveError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const handleField = (field: keyof AddressFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSaveError(null);
  };

  const handleSave = async () => {
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const url = editingId ? `/api/account/addresses/${editingId}` : '/api/account/addresses';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        setSaveError(dict.errorGeneric);
        return;
      }

      setModalOpen(false);
      await fetchAddresses();
    } catch {
      setSaveError(dict.errorConnectionSave);
    } finally {
      setSaving(false);
    }
  };

  // ── Eliminar ─────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deletingId) return;
    setConfirmingDelete(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/account/addresses/${deletingId}`, { method: 'DELETE' });
      if (!res.ok) {
        setDeleteError(dict.errorDelete);
        return;
      }
      setDeletingId(null);
      await fetchAddresses();
    } catch {
      setDeleteError(dict.errorConnectionDelete);
    } finally {
      setConfirmingDelete(false);
    }
  };

  // ── Set default ──────────────────────────────────────────────────────────
  const setDefault = async (id: number) => {
    setSettingDefaultId(id);
    setDefaultError(null);
    try {
      const res = await fetch(`/api/account/addresses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!res.ok) {
        setDefaultError(dict.errorSetDefault);
        return;
      }
      await fetchAddresses();
    } catch {
      setDefaultError(dict.errorConnectionDefault);
    } finally {
      setSettingDefaultId(null);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-cream py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            <MapPin size={28} className="text-brand-purple" strokeWidth={1.5} />
            <div>
              <h1 className="font-serif text-2xl font-bold text-brand-purple">
                {dict.title}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">{dict.subtitle}</p>
            </div>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 bg-brand-purple text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-purple-dark transition-colors"
          >
            <Plus size={16} />
            {dict.add}
          </button>
        </div>

        {/* Error global (set default) */}
        {defaultError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
            {defaultError}
          </p>
        )}

        {/* Contenido principal */}
        {fetchError ? (
          <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center text-gray-400 text-sm">
            {fetchError}
          </div>
        ) : loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center text-gray-400 text-sm">
            {dict.loading}
          </div>
        ) : addresses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center">
            <MapPin size={36} className="text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm font-medium text-gray-600">{dict.empty}</p>
            <p className="text-xs text-gray-400 mt-1">{dict.emptyDesc}</p>
            <button
              onClick={openAdd}
              className="mt-5 inline-flex items-center gap-1.5 bg-brand-purple text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-brand-purple-dark transition-colors"
            >
              <Plus size={15} />
              {dict.addButton}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`bg-white rounded-2xl border p-5 transition-all ${
                  addr.isDefault ? 'border-brand-purple/40 shadow-sm' : 'border-gray-200'
                }`}
              >
                {/* Badge default */}
                {addr.isDefault && (
                  <div className="flex items-center gap-1 mb-3">
                    <Star size={13} className="text-brand-purple fill-brand-purple" />
                    <span className="text-xs font-semibold text-brand-purple">{dict.defaultBadge}</span>
                  </div>
                )}

                {/* Datos */}
                <p className="text-sm font-semibold text-gray-800">
                  {addr.nombre} {addr.apellido}
                </p>
                <p className="text-sm text-gray-600 mt-0.5">{addr.direccion1}</p>
                {addr.direccion2 && (
                  <p className="text-sm text-gray-600">{addr.direccion2}</p>
                )}
                <p className="text-sm text-gray-600">
                  {addr.ciudad}, {addr.estado} {addr.codigoPostal}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">{addr.telefono}</p>

                {/* Acciones */}
                <div className="flex items-center gap-3 mt-4 flex-wrap">
                  {!addr.isDefault && (
                    <button
                      onClick={() => setDefault(addr.id)}
                      disabled={settingDefaultId === addr.id}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand-purple transition-colors disabled:opacity-50"
                    >
                      <Star size={13} />
                      {settingDefaultId === addr.id ? dict.updatingDefault : dict.setDefault}
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(addr)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand-purple transition-colors"
                  >
                    <Pencil size={13} />
                    {dict.edit}
                  </button>
                  <button
                    onClick={() => { setDeleteError(null); setDeletingId(addr.id); }}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={13} />
                    {dict.delete}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Link volver */}
        <div className="mt-8">
          <Link
            href={`/${locale}/cuenta`}
            className="text-sm text-gray-500 hover:text-brand-purple transition-colors"
          >
            {dict.back}
          </Link>
        </div>
      </div>

      {/* ── Modal add/edit ──────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 py-8 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-auto">
            {/* Header modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">
                {editingId ? dict.editTitle : dict.addTitle}
              </h2>
              <button
                onClick={closeModal}
                disabled={saving}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formulario */}
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Nombre + Apellido */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">{dict.firstName}</label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => handleField('nombre', e.target.value)}
                    placeholder={dict.firstNamePlaceholder}
                    className={inputClass(errors.nombre)}
                  />
                  {errors.nombre && <p className="text-xs text-red-500">{errors.nombre}</p>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">{dict.lastName}</label>
                  <input
                    type="text"
                    value={form.apellido}
                    onChange={(e) => handleField('apellido', e.target.value)}
                    placeholder={dict.lastNamePlaceholder}
                    className={inputClass(errors.apellido)}
                  />
                  {errors.apellido && <p className="text-xs text-red-500">{errors.apellido}</p>}
                </div>
              </div>

              {/* Teléfono */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">{dict.phone}</label>
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={(e) => handleField('telefono', e.target.value)}
                  placeholder="(239) 555-0100"
                  className={inputClass(errors.telefono)}
                />
                {errors.telefono && <p className="text-xs text-red-500">{errors.telefono}</p>}
              </div>

              {/* Dirección 1 */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">{dict.address1}</label>
                <input
                  type="text"
                  value={form.direccion1}
                  onChange={(e) => handleField('direccion1', e.target.value)}
                  placeholder="1234 Main St"
                  className={inputClass(errors.direccion1)}
                />
                {errors.direccion1 && <p className="text-xs text-red-500">{errors.direccion1}</p>}
              </div>

              {/* Dirección 2 */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  {dict.address2}
                  <span className="text-gray-400 font-normal ml-1">{dict.address2Optional}</span>
                </label>
                <input
                  type="text"
                  value={form.direccion2}
                  onChange={(e) => handleField('direccion2', e.target.value)}
                  placeholder="Apt, Suite, Unit..."
                  className={inputClass()}
                />
              </div>

              {/* Ciudad + CP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">{dict.city}</label>
                  <input
                    type="text"
                    value={form.ciudad}
                    onChange={(e) => handleField('ciudad', e.target.value)}
                    placeholder={dict.cityPlaceholder}
                    className={inputClass(errors.ciudad)}
                  />
                  {errors.ciudad && <p className="text-xs text-red-500">{errors.ciudad}</p>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">{dict.zip}</label>
                  <input
                    type="text"
                    value={form.codigoPostal}
                    onChange={(e) => handleField('codigoPostal', e.target.value)}
                    placeholder="34135"
                    maxLength={5}
                    className={inputClass(errors.codigoPostal)}
                  />
                  {errors.codigoPostal && <p className="text-xs text-red-500">{errors.codigoPostal}</p>}
                </div>
              </div>

              {/* Estado */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">{dict.state}</label>
                <select
                  value={form.estado}
                  onChange={(e) => handleField('estado', e.target.value)}
                  className={inputClass(errors.estado)}
                >
                  <option value="">{dict.selectState}</option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.estado && <p className="text-xs text-red-500">{errors.estado}</p>}
              </div>

              {/* Default checkbox */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => handleField('isDefault', e.target.checked)}
                  className="w-4 h-4 rounded accent-brand-purple"
                />
                <span className="text-sm text-gray-700">{dict.setAsDefaultLabel}</span>
              </label>

              {/* Error */}
              {saveError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                  {saveError}
                </p>
              )}
            </div>

            {/* Footer modal */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={closeModal}
                disabled={saving}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                {dict.cancelButton}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-brand-purple text-white rounded-xl text-sm font-semibold hover:bg-brand-purple-dark transition-colors disabled:opacity-60"
              >
                {saving ? dict.saving : dict.saveButton}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmación eliminar ──────────────────────────────────────── */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-800 text-base">
                {dict.deleteTitle}
              </h3>
              <button
                onClick={() => { setDeletingId(null); setDeleteError(null); }}
                disabled={confirmingDelete}
                className="text-gray-400 hover:text-gray-600 ml-3 mt-0.5"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">{dict.deleteDesc}</p>
            {deleteError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 mb-4">
                {deleteError}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setDeletingId(null); setDeleteError(null); }}
                disabled={confirmingDelete}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                {dict.cancelButton}
              </button>
              <button
                onClick={confirmDelete}
                disabled={confirmingDelete}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {confirmingDelete ? dict.deleting : dict.deleteButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
