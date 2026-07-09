'use client';

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
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {optional && <span className="text-gray-400 font-normal ml-1">(opcional)</span>}
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

export function ShippingForm({ values, errors, onChange }: Props) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="font-serif text-xl font-bold text-gray-900 mb-6">
        Información de envío
      </h2>

      <div className="flex flex-col gap-5">
        {/* Nombre y Apellido */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre" error={errors.nombre}>
            <input
              type="text"
              value={values.nombre}
              onChange={(e) => onChange('nombre', e.target.value)}
              placeholder="María"
              className={inputClass(errors.nombre)}
            />
          </Field>
          <Field label="Apellido" error={errors.apellido}>
            <input
              type="text"
              value={values.apellido}
              onChange={(e) => onChange('apellido', e.target.value)}
              placeholder="González"
              className={inputClass(errors.apellido)}
            />
          </Field>
        </div>

        {/* Email */}
        <Field label="Correo electrónico" error={errors.email}>
          <input
            type="email"
            value={values.email}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="maria@ejemplo.com"
            className={inputClass(errors.email)}
          />
        </Field>

        {/* Teléfono */}
        <Field label="Teléfono" error={errors.telefono}>
          <input
            type="tel"
            value={values.telefono}
            onChange={(e) => onChange('telefono', e.target.value)}
            placeholder="(239) 555-0100"
            className={inputClass(errors.telefono)}
          />
        </Field>

        {/* Dirección línea 1 */}
        <Field label="Dirección" error={errors.direccion1}>
          <input
            type="text"
            value={values.direccion1}
            onChange={(e) => onChange('direccion1', e.target.value)}
            placeholder="1234 Calle Principal"
            className={inputClass(errors.direccion1)}
          />
        </Field>

        {/* Dirección línea 2 */}
        <Field label="Dirección (línea 2)" error={errors.direccion2} optional>
          <input
            type="text"
            value={values.direccion2}
            onChange={(e) => onChange('direccion2', e.target.value)}
            placeholder="Apt, Suite, Edificio..."
            className={inputClass(errors.direccion2)}
          />
        </Field>

        {/* Ciudad y Código Postal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Ciudad" error={errors.ciudad}>
            <input
              type="text"
              value={values.ciudad}
              onChange={(e) => onChange('ciudad', e.target.value)}
              placeholder="Bonita Springs"
              className={inputClass(errors.ciudad)}
            />
          </Field>
          <Field label="Código Postal" error={errors.codigoPostal}>
            <input
              type="text"
              value={values.codigoPostal}
              onChange={(e) => onChange('codigoPostal', e.target.value)}
              placeholder="34135"
              maxLength={5}
              className={inputClass(errors.codigoPostal)}
            />
          </Field>
        </div>

        {/* Estado */}
        <Field label="Estado" error={errors.estado}>
          <select
            value={values.estado}
            onChange={(e) => onChange('estado', e.target.value)}
            className={inputClass(errors.estado)}
          >
            <option value="">Selecciona un estado</option>
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

export function validateShipping(values: ShippingFormData): ShippingFormErrors {
  const errs: ShippingFormErrors = {};

  if (!values.nombre.trim()) errs.nombre = 'El nombre es obligatorio';
  if (!values.apellido.trim()) errs.apellido = 'El apellido es obligatorio';
  if (!values.email.trim()) {
    errs.email = 'El email es obligatorio';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errs.email = 'Formato de email inválido';
  }
  if (!values.telefono.trim()) errs.telefono = 'El teléfono es obligatorio';
  if (!values.direccion1.trim()) errs.direccion1 = 'La dirección es obligatoria';
  if (!values.ciudad.trim()) errs.ciudad = 'La ciudad es obligatoria';
  if (!values.estado) errs.estado = 'El estado es obligatorio';
  if (!values.codigoPostal.trim()) {
    errs.codigoPostal = 'El código postal es obligatorio';
  } else if (!/^\d{5}$/.test(values.codigoPostal)) {
    errs.codigoPostal = 'El código postal debe tener 5 dígitos';
  }

  return errs;
}
