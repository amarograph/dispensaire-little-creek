'use client';

import Link from 'next/link';
import { useState } from 'react';
import { updateTemplate, deleteTemplate } from '@/actions/templates';
import type { Template, Universe } from '@/types';

export function TemplateList({
  templates,
  universe,
}: {
  templates: Template[];
  universe: Universe;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  async function togglePublish(t: Template) {
    setLoading(t.id);
    await updateTemplate(t.id, { published: !t.published });
    setLoading(null);
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce template ?')) return;
    setLoading(id);
    await deleteTemplate(id);
    setLoading(null);
  }

  if (!templates.length) {
    return (
      <div className="text-center py-16 text-gray-500">
        <div className="text-4xl mb-3">📄</div>
        <p>Aucun template pour cet univers.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {templates.map(t => (
        <div
          key={t.id}
          className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-2 h-2 rounded-full ${
                t.published ? 'bg-green-400' : 'bg-gray-600'
              }`}
            />
            <div>
              <div className="font-medium text-white">{t.name}</div>
              {t.description && (
                <div className="text-sm text-gray-400">{t.description}</div>
              )}
              <div className="text-xs text-gray-600 mt-1">
                {t.template_fields?.length ?? 0} champ(s)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                t.published
                  ? 'bg-green-900/50 text-green-400'
                  : 'bg-gray-800 text-gray-500'
              }`}
            >
              {t.published ? 'Publié' : 'Brouillon'}
            </span>
            <Link
              href={`/admin/templates/${t.id}/fields`}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition"
            >
              Champs
            </Link>
            <Link
              href={`/admin/templates/${t.id}`}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition"
            >
              Éditer
            </Link>
            <button
              onClick={() => togglePublish(t)}
              disabled={loading === t.id}
              className={`text-xs px-3 py-1.5 rounded-lg transition ${
                t.published
                  ? 'bg-orange-900/50 hover:bg-orange-900 text-orange-400'
                  : 'bg-green-900/50 hover:bg-green-900 text-green-400'
              }`}
            >
              {t.published ? 'Dépublier' : 'Publier'}
            </button>
            <button
              onClick={() => handleDelete(t.id)}
              disabled={loading === t.id}
              className="text-xs bg-red-900/30 hover:bg-red-900/60 text-red-400 px-3 py-1.5 rounded-lg transition"
            >
              Supprimer
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}