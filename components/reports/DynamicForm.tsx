'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { submitReport } from '@/actions/reports';
import type { Template } from '@/types';
import { FieldRenderer } from './FieldRenderer';

export function DynamicForm({
  template,
  settings,
}: {
  template: Template;
  settings: Record<string, string>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefill = searchParams.get('prefill');

  const fields = [...(template.template_fields ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    fields.forEach(f => {
      if (f.default_value) init[f.key] = f.default_value;
      if (f.field_type === 'table') init[f.key] = [];
      if (f.field_type === 'multi_select') init[f.key] = [];
      if (f.field_type === 'checkbox') init[f.key] = false;
    });
    if (prefill) {
      try {
        const prefillValues = JSON.parse(decodeURIComponent(prefill));
        return { ...init, ...prefillValues };
      } catch {}
    }
    return init;
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function updateValue(key: string, value: unknown) {
    setValues(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    for (const field of fields) {
      if (field.required) {
        const val = values[field.key];
        const isEmpty =
          val === undefined ||
          val === null ||
          val === '' ||
          val === false ||
          (Array.isArray(val) && val.length === 0);
        if (isEmpty) {
          setError(`Le champ "${field.label}" est requis.`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const archiveId = await submitReport(template.id, values, settings);
      router.push(`/archives?highlight=${archiveId}`);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors de la génération du rapport.'
      );
    }
    setSubmitting(false);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-300 mb-4 transition"
        >
          ← Retour
        </button>
        <h1 className="text-2xl font-bold">{template.name}</h1>
        {template.description && (
          <p className="text-gray-400 text-sm mt-1">{template.description}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
          {fields.map(field => (
            <FieldRenderer
              key={field.id}
              field={field}
              value={values[field.key]}
              onChange={val => updateValue(field.key, val)}
            />
          ))}
          {fields.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">
              Ce template n'a pas encore de champs.
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg py-3 transition flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="animate-spin">⟳</span>
                Génération du PDF...
              </>
            ) : (
              <>📄 Générer et Archiver</>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg px-6 py-3 transition"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}