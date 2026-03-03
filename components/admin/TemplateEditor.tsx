'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateTemplate } from '@/actions/templates';
import type { Template } from '@/types';

export function TemplateEditor({ template }: { template: Template }) {
  const router = useRouter();
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description ?? '');
  const [body, setBody] = useState(template.body);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fieldKeys = template.template_fields?.map(f => f.key) ?? [];

  async function handleSave() {
    setSaving(true);
    await updateTemplate(template.id, { name, description, body });
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  }

  function insertVar(v: string) {
    setBody(prev => prev + `{{${v}}}`);
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Éditer : {template.name}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/admin/templates/${template.id}/fields`)}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm"
          >
            ⚙️ Champs
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {saved ? '✓ Sauvegardé' : saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">
              Informations
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Nom</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">
              Variables disponibles
            </h2>
            <p className="text-xs text-gray-500 mb-2">Champs :</p>
            <div className="space-y-1 mb-3">
              {fieldKeys.length === 0 && (
                <p className="text-xs text-gray-600 italic">
                  Aucun champ défini
                </p>
              )}
              {fieldKeys.map(key => (
                <button
                  key={key}
                  onClick={() => insertVar(`field.${key}`)}
                  className="block w-full text-left text-xs bg-gray-800 hover:bg-gray-700 text-blue-400 px-2 py-1 rounded font-mono transition"
                >
                  {'{{'}field.{key}{'}}'}
                </button>
              ))}
            </div>

            <p className="text-xs text-gray-500 mb-1">Conditionnel :</p>
            <div className="text-xs font-mono bg-gray-800 rounded p-2 text-gray-400 select-all mb-3">
              {'[[IF field.KEY]]'}<br />
              {'  ...contenu...'}<br />
              {'[[END]]'}
            </div>

            <p className="text-xs text-gray-500 mb-1">Paramètres :</p>
            <button
              onClick={() => insertVar('settings.NOM_HOPITAL')}
              className="block w-full text-left text-xs bg-gray-800 hover:bg-gray-700 text-amber-400 px-2 py-1 rounded font-mono transition"
            >
              {'{{'}settings.NOM_HOPITAL{'}}'}
            </button>
          </div>
        </div>

        <div className="col-span-2">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">
              Corps du document
            </h2>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={30}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-blue-500 resize-none"
              placeholder={`Exemple:\n\n=== RAPPORT MÉDICAL ===\n\nPatient : {{field.patient_name}}\nDate : {{field.date}}\n\nHôpital : {{settings.NOM_HOPITAL}}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}