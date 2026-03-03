'use client';

import { useState } from 'react';
import type { TemplateField } from '@/types';

interface FieldRendererProps {
  field: TemplateField;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function FieldRenderer({ field, value, onChange }: FieldRendererProps) {
  const label = (
    <label className="block text-sm font-medium text-gray-200 mb-1.5">
      {field.label}
      {field.required && <span className="text-red-400 ml-1">*</span>}
    </label>
  );

  const baseInput =
    'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition';

  switch (field.field_type) {
    case 'short_text':
      return (
        <div>
          {label}
          <input
            type="text"
            value={(value as string) ?? ''}
            onChange={e => onChange(e.target.value)}
            className={baseInput}
          />
        </div>
      );

    case 'long_text':
      return (
        <div>
          {label}
          <textarea
            value={(value as string) ?? ''}
            onChange={e => onChange(e.target.value)}
            rows={5}
            className={`${baseInput} resize-y`}
          />
        </div>
      );

    case 'number':
      return (
        <div>
          {label}
          <input
            type="number"
            value={(value as string) ?? ''}
            onChange={e => onChange(e.target.value)}
            className={baseInput}
          />
        </div>
      );

    case 'datetime':
      return (
        <div>
          {label}
          <input
            type="datetime-local"
            value={(value as string) ?? ''}
            onChange={e => onChange(e.target.value)}
            className={baseInput}
          />
        </div>
      );

    case 'select':
      return (
        <div>
          {label}
          <select
            value={(value as string) ?? ''}
            onChange={e => onChange(e.target.value)}
            className={baseInput}
          >
            <option value="">-- Sélectionner --</option>
            {(field.options ?? []).map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );

    case 'checkbox':
      return (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id={field.key}
            checked={(value as boolean) ?? false}
            onChange={e => onChange(e.target.checked)}
            className="w-4 h-4 accent-blue-600"
          />
          {label}
        </div>
      );

    case 'multi_select':
      return (
        <div>
          {label}
          <div className="space-y-2">
            {(field.options ?? []).map(opt => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={((value as string[]) ?? []).includes(opt)}
                  onChange={e => {
                    const current = (value as string[]) ?? [];
                    if (e.target.checked) {
                      onChange([...current, opt]);
                    } else {
                      onChange(current.filter(v => v !== opt));
                    }
                  }}
                  className="accent-blue-600"
                />
                <span className="text-sm text-gray-300">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      );

    case 'table':
      return (
        <TableField
          field={field}
          value={value as TableRow[]}
          onChange={onChange}
        />
      );

    default:
      return null;
  }
}

interface TableRow {
  [key: string]: string;
}

function TableField({
  field,
  value,
  onChange,
}: {
  field: TemplateField;
  value: TableRow[];
  onChange: (v: unknown) => void;
}) {
  const cols = field.table_columns ?? [];
  const rows = value ?? [];

  function addRow() {
    const emptyRow: TableRow = {};
    cols.forEach(c => {
      emptyRow[c.key] = '';
    });
    onChange([...rows, emptyRow]);
  }

  function updateCell(rowIdx: number, colKey: string, val: string) {
    const updated = rows.map((row, i) =>
      i === rowIdx ? { ...row, [colKey]: val } : row
    );
    onChange(updated);
  }

  function removeRow(rowIdx: number) {
    onChange(rows.filter((_, i) => i !== rowIdx));
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-200 mb-2">
        {field.label}
        {field.required && <span className="text-red-400 ml-1">*</span>}
      </label>

      <div className="rounded-lg border border-gray-700 overflow-hidden">
        {cols.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800">
                {cols.map(col => (
                  <th
                    key={col.key}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-400"
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-3 py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => (
                <tr key={rowIdx} className="border-t border-gray-800">
                  {cols.map(col => (
                    <td key={col.key} className="px-2 py-1">
                      <input
                        value={row[col.key] ?? ''}
                        onChange={e =>
                          updateCell(rowIdx, col.key, e.target.value)
                        }
                        className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-1">
                    <button
                      type="button"
                      onClick={() => removeRow(rowIdx)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={cols.length + 1}
                    className="px-3 py-4 text-center text-xs text-gray-600"
                  >
                    Aucune ligne. Cliquez sur "Ajouter" pour commencer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="mt-2 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition"
      >
        + Ajouter une ligne
      </button>
    </div>
  );
}