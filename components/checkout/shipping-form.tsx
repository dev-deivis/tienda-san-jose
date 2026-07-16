'use client';

import type { Dictionary } from '@/app/[locale]/dictionaries';

export type ShippingFormData = {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion1: string;
  direccion2: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
};

export type ShippingFormErrors = Partial<Record<keyof ShippingFormData, string>>;

type Props = {
  values: ShippingFormData;
  errors: ShippingFormErrors;
  onChange: (field: keyof ShippingFormData, value: string) => void;
  dict: Dictionary['shipping'];
};

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

function Field({
  label,
  error,
  children,
  optional,
  optionalLabel,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  optional?: boolean;
  optionalLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {optional && <span className="text-gray-400 font-normal ml-1">{optionalLabel}</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

const inputClass = (error?: string) =>
  `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-colors ${
    error
      ? 'border-red-400 focus:ring-red-200'
      : 'border-gray-200 focus:ring-brand-purple/20 focus:border-brand-purple'
  }`;

export function ShippingForm({ values, errors, onChange, dict }: Props) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="font-serif text-xl font-bold text-gray-900 mb-6">
        {dict.formTitle}
      </h2>

      <div className="flex flex-col gap-5">
        {/* Nombre y Apellido */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={dict.firstName} error={errors.nombre}>
            <input
              type="text"
              value={values.nombre}
              onChange={(e) => onChange('nombre', e.target.value)}
              placeholder={dict.firstNamePlaceholder}
              className={inputClass(errors.nombre)}
            />
          </Field>
          <Field label={dict.lastName} error={errors.apellido}>
            <input
              type="text"
              value={values.apellido}
              onChange={(e) => onChange('apellido', e.target.value)}
              placeholder={dict.lastNamePlaceholder}
              className={inputClass(errors.apellido)}
            />
          </Field>
        </div>

        {/* Email */}
        <Field label={dict.email} error={errors.email}>
          <input
            type="email"
            value={values.email}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder={dict.emailPlaceholder}
            className={inputClass(errors.email)}
          />
        </Field>

        {/* Teléfono */}
        <Field label={dict.phone} error={errors.telefono}>
          <input
            type="tel"
            value={values.telefono}
            onChange={(e) => onChange('telefono', e.target.value)}
            placeholder={dict.phonePlaceholder}
            className={inputClass(errors.telefono)}
          />
        </Field>

        {/* Dirección línea 1 */}
        <Field label={dict.address} error={errors.direccion1}>
          <input
            type="text"
            value={values.direccion1}
            onChange={(e) => onChange('direccion1', e.target.value)}
            placeholder={dict.addressPlaceholder}
            className={inputClass(errors.direccion1)}
          />
        </Field>

        {/* Dirección línea 2 */}
        <Field label={dict.address2} error={errors.direccion2} optional optionalLabel={dict.optional}>
          <input
            type="text"
            value={values.direccion2}
            onChange={(e) => onChange('direccion2', e.target.value)}
            placeholder={dict.address2Placeholder}
            className={inputClass(errors.direccion2)}
          />
        </Field>

        {/* Ciudad y Código Postal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={dict.city} error={errors.ciudad}>
            <input
              type="text"
              value={values.ciudad}
              onChange={(e) => onChange('ciudad', e.target.value)}
              placeholder={dict.cityPlaceholder}
              className={inputClass(errors.ciudad)}
            />
          </Field>
          <Field label={dict.zip} error={errors.codigoPostal}>
            <input
              type="text"
              value={values.codigoPostal}
              onChange={(e) => onChange('codigoPostal', e.target.value)}
              placeholder={dict.zipPlaceholder}
              maxLength={5}
              className={inputClass(errors.codigoPostal)}
            />
          </Field>
        </div>

        {/* Estado */}
        <Field label={dict.state} error={errors.estado}>
          <select
            value={values.estado}
            onChange={(e) => onChange('estado', e.target.value)}
            className={inputClass(errors.estado)}
          >
            <option value="">{dict.statePlaceholder}</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  );
}

export function validateShipping(values: ShippingFormData, dict: Dictionary['shipping']): ShippingFormErrors {
  const errs: ShippingFormErrors = {};

  if (!values.nombre.trim()) errs.nombre = dict.errorFirstName;
  if (!values.apellido.trim()) errs.apellido = dict.errorLastName;
  if (!values.email.trim()) {
    errs.email = dict.errorEmail;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errs.email = dict.errorEmailFormat;
  }
  if (!values.telefono.trim()) errs.telefono = dict.errorPhone;
  if (!values.direccion1.trim()) errs.direccion1 = dict.errorAddress;
  if (!values.ciudad.trim()) errs.ciudad = dict.errorCity;
  if (!values.estado) errs.estado = dict.errorState;
  if (!values.codigoPostal.trim()) {
    errs.codigoPostal = dict.errorZip;
  } else if (!/^\d{5}$/.test(values.codigoPostal)) {
    errs.codigoPostal = dict.errorZipFormat;
  }

  return errs;
}
