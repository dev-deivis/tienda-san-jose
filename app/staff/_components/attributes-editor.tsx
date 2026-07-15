'use client';

import { Plus, Trash2 } from 'lucide-react';

type AttributeRow = { key: string; value: string };

type Props = {
  rows: AttributeRow[];
  onChange: (rows: AttributeRow[]) => void;
};

export type { AttributeRow };

export default function AttributesEditor({ rows, onChange }: Props) {
  const addRow = () => {
    onChange([...rows, { key: '', value: '' }]);
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const updateKey = (index: number, newKey: string) => {
    const updated = rows.map((row, i) =>
      i === index ? { ...row, key: newKey } : row
    );
    onChange(updated);
  };

  const updateValue = (index: number, newValue: string) => {
    const updated = rows.map((row, i) =>
      i === index ? { ...row, value: newValue } : row
    );
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      {rows.length === 0 && (
        <p className="text-xs text-gray-400 italic">Sin atributos. Agrega uno con el botón.</p>
      )}

      {rows.map((row, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            value={row.key}
            onChange={(e) => updateKey(index, e.target.value)}
            placeholder="Clave (ej: color)"
            className="w-1/3 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40 focus:border-brand-purple"
          />
          <span className="text-gray-400 text-sm">:</span>
          <input
            type="text"
            value={row.value}
            onChange={(e) => updateValue(index, e.target.value)}
            placeholder="Valor (ej: blanco)"
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40 focus:border-brand-purple"
          />
          <button
            type="button"
            onClick={() => removeRow(index)}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
            title="Eliminar atributo"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1.5 text-sm text-brand-purple hover:text-brand-purple-dark transition-colors mt-1"
      >
        <Plus size={15} />
        Agregar atributo
      </button>
    </div>
  );
}

/** Convierte un objeto JSON a lista de rows para el editor */
export function objectToRows(obj: unknown): AttributeRow[] {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];
  return Object.entries(obj as Record<string, unknown>).map(([key, value]) => ({
    key,
    value: String(value),
  }));
}

/** Valida los rows y devuelve un error o null si todo está bien */
export function validateRows(rows: AttributeRow[]): string | null {
  const nonEmpty = rows.filter((r) => r.key.trim() !== '' || r.value.trim() !== '');
  const emptyKeys = nonEmpty.filter((r) => r.key.trim() === '');
  if (emptyKeys.length > 0) {
    return 'Hay atributos con clave vacía. Completa o elimina esos campos.';
  }
  const keys = nonEmpty.map((r) => r.key.trim());
  const duplicates = keys.filter((k, i) => keys.indexOf(k) !== i);
  if (duplicates.length > 0) {
    return `Claves duplicadas: ${[...new Set(duplicates)].join(', ')}. Cada clave debe ser única.`;
  }
  return null;
}

/** Convierte los rows a un objeto JSON para guardar */
export function rowsToObject(rows: AttributeRow[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const row of rows) {
    const k = row.key.trim();
    if (k) result[k] = row.value;
  }
  return result;
}
