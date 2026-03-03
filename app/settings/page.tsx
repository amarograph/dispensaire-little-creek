'use client';

import { useEffect, useState } from 'react';
import { getSettings, upsertSetting } from '@/actions/settings';
import type { Universe } from '@/types';

const DEFAULT_KEYS = [
  'NOM_HOPITAL',
  'SOUS_TITRE',
  'ADRESSE',
  'TELEPHONE',
  'MEDECIN_CHEF',
];

export default function SettingsPage() {
  const [universe, setUniverse] = useState<Universe>('fivem');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings(universe).then(setSettings);
  }, [universe]);

  async function save() {
    setSaving(true);
    await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        upsertSetting(universe, key, value)
      )
    );
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Paramètres univers</h1>

      <div className="flex gap-2 mb-6">
        {(['fivem', 'redm'] as Universe[]).map(u => (
          <button
            key={u}
            onClick={() => setUniverse(u)}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              universe === u
                ? u === 'fivem'
                  ? 'bg-blue-600 text-white'
                  : 'bg-amber-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {u === 'fivem' ? '🏥 FiveM' : '⚕️ RedM'}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        {DEFAULT_KEYS.map(key => (
          <div key={key}>
            <label className="text-xs text-gray-500 font-mono">
              {`{{settings.${key}}}`}
            </label>
            <input
              value={settings[key] ?? ''}
              onChange={e =>
                setSettings(p => ({ ...p, [key]: e.target.value }))
              }
              className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              placeholder={key}
            />
          </div>
        ))}

        <button
          onClick={save}
          disabled={saving}
          className={`w-full rounded-lg py-2.5 text-sm mt-2 transition ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white'
          }`}
        >
          {saved
            ? '✓ Sauvegardé !'
            : saving
            ? 'Sauvegarde...'
            : 'Sauvegarder les paramètres'}
        </button>
      </div>
    </div>
  );
}