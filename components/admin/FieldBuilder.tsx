'use client';

import { useState } from 'react';
import { createField, deleteField } from '@/actions/fields';
import type { Template, TemplateField, FieldType, TableColumn } from '@/types';

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'short_text', label: 'Texte court' },
  { value: 'long_text', label: 'Texte long' },
  { value: 'number', label: 'Nombre' },
  { value: 'datetime', label: 'Date/Heure' },
  { value: 'select', label: 'Sélection unique' },
  { value: 'checkbox', label: 'Case à cocher' },
  { value: 'multi_select', label: 'Sélection multiple' },
  { value: 'table', label: 'Tableau' },
];

interface NewFieldState {
  key: string;
  label: string;
  field_type: FieldType;
  required: boolean;
  options: string;
  table_columns: TableColumn[];
  default_value: string;
}

const DEFAULT_FIELD: NewFieldState = {
  key: '',
  label: '',
  field_type: 'short_text',
  required: false,
  options: '',
  table_columns: [],
  default_value: '',
};

export function FieldBuilder({
  template,
  initialFields,
}: {
  template: Template;
  initialFields: TemplateField[];
}) {
  const [fields, setFields] = useState(initialFields);
  const [adding, setAdding] = useState(false);
  const [newField, setNewField] = useState<NewFieldState>(DEFAULT_FIELD);
  const [saving, setSaving] = useState(false);
  const [newCol, setNewCol] = useState({ key: '', label: '' });

  async function handleCreate() {
    if (!newField.key || !newField.label) return;
    setSaving(true);

    const options = ['select', 'multi_select'].includes(newField.field_type)
      ? newField.options
          .split('\n')
          .map(o => o.trim())
          .filter(Boolean)
      : undefined;

    const created = await createField(template.id, {
      key: newField.key
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, ''),
      label: newField.label,
      field_type: newField.field_type,
      required: newField.required,
      options,
      table_columns:
        newField.field_type === 'table'
          ? newField.table_columns
          : undefined,
      default_value: newField.default_value || undefined,
      sort_order: fields.length,
    });

    setFields(prev => [...prev, created as TemplateField]);
    setNewField(DEFAULT_FIELD);
    setAdding(false);
    setSaving(false);
  }

  async function handleDelete(field: TemplateField) {
    if (!confirm(`Supprimer le champ "${field.label}" ?`)) return;
    await deleteField(field.id, template.id);
    setFields(prev => prev.filter(f => f.id !== field.id));
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Champs : {template.name}</h1>
          <p className="text-sm text-gray-400">
            Définir les champs du formulaire dynamique
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm"
        >
          + Ajouter un champ
        </button>
      </div>

      <div className="space-y-3 mb-6">
        {fields.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-gray-900 rounded-xl border border-gray-800">
            Aucun champ. Ajoutez le premier.
          </div>
        )}
        {fields.map(field => (
          <div
            key={field.id}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start justify-between"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-white">
                  {field.label}
                </span>
                <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded font-mono">
                  {field.key}
                </span>
                <span className="text-xs bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded">
                  {FIELD_TYPES.find(t => t.value === field.field_type)?.label}
                </span>
                {field.required && (
                  <span className="text-xs text-red-400">*requis</span>
                )}
              </div>
              {field.options && field.options.length > 0 && (
                <div className="mt-1 text-xs text-gray-500">
                  Options : {field.options.join(', ')}
                </div>
              )}
              {field.table_columns && field.table_columns.length > 0 && (
                <div className="mt-1 text-xs text-gray-500">
                  Colonnes : {field.table_columns.map(c => c.label).join(', ')}
                </div>
              )}
            </div>
            <button
              onClick={() => handleDelete(field)}
              className="text-xs text-red-400 hover:text-red-300 ml-4"
            >
              Supprimer
            </button>
          </div>
        ))}
      </div>

      {adding && (
        <div className="bg-gray-900 border border-blue-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-200 mb-4">
            Nouveau champ
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500">Clé (variable)</label>
              <input
                value={newField.key}
                onChange={e =>
                  setNewField(p => ({ ...p, key: e.target.value }))
                }
                placeholder="patient_name"
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-gray-600 mt-1">
                Utilisé dans : {'{{'}field.clé{'}}'}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Libellé</label>
              <input
                value={newField.label}
                onChange={e =>
                  setNewField(p => ({ ...p, label: e.target.value }))
                }
                placeholder="Nom du patient"
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Type</label>
              <select
                value={newField.field_type}
                onChange={e =>
                  setNewField(p => ({
                    ...p,
                    field_type: e.target.value as FieldType,
                  }))
                }
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {FIELD_TYPES.map(t => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 mt-5">
              <input
                type="checkbox"
                id="required"
                checked={newField.required}
                onChange={e =>
                  setNewField(p => ({ ...p, required: e.target.checked }))
                }
                className="accent-blue-600"
              />
              <label htmlFor="required" className="text-sm text-gray-300">
                Champ requis
              </label>
            </div>

            {['select', 'multi_select'].includes(newField.field_type) && (
              <div className="col-span-2">
                <label className="text-xs text-gray-500">
                  Options (une par ligne)
                </label>
                <textarea
                  value={newField.options}
                  onChange={e =>
                    setNewField(p => ({ ...p, options: e.target.value }))
                  }
                  rows={4}
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                  className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            )}

            {newField.field_type === 'table' && (
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-2 block">
                  Colonnes du tableau
                </label>
                <div className="space-y-2 mb-3">
                  {newField.table_columns.map((col, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2"
                    >
                      <span className="text-xs font-mono text-blue-400">
                        {col.key}
                      </span>
                      <span className="text-xs text-gray-300">{col.label}</span>
                      <button
                        onClick={() =>
                          setNewField(p => ({
                            ...p,
                            table_columns: p.table_columns.filter(
                              (_, j) => j !== i
                            ),
                          }))
                        }
                        className="ml-auto text-xs text-red-400"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={newCol.key}
                    onChange={e =>
                      setNewCol(p => ({ ...p, key: e.target.value }))
                    }
                    placeholder="clé"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                  <input
                    value={newCol.label}
                    onChange={e =>
                      setNewCol(p => ({ ...p, label: e.target.value }))
                    }
                    placeholder="Libellé"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => {
                      if (!newCol.key || !newCol.label) return;
                      setNewField(p => ({
                        ...p,
                        table_columns: [
                          ...p.table_columns,
                          { key: newCol.key, label: newCol.label },
                        ],
                      }));
                      setNewCol({ key: '', label: '' });
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            )}

            <div className="col-span-2">
              <label className="text-xs text-gray-500">
                Valeur par défaut (optionnel)
              </label>
              <input
                value={newField.default_value}
                onChange={e =>
                  setNewField(p => ({ ...p, default_value: e.target.value }))
                }
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCreate}
              disabled={saving || !newField.key || !newField.label}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm"
            >
              {saving ? 'Création...' : 'Créer le champ'}
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setNewField(DEFAULT_FIELD);
              }}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-6 py-2 rounded-lg text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}