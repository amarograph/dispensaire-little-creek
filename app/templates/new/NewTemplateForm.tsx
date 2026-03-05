'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createTemplate } from '@/actions/templates';

export default function NewTemplatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultUniverse = searchParams.get('universe') ?? 'fivem';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const formData = new FormData(e.currentTarget);
      const template = await createTemplate(formData);
      router.push(`/admin/templates/${template.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
    setLoading(false);
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Nouveau template</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4"
      >
        <div>
          <label className="text-sm text-gray-400">Univers</label>
          <select
            name="universe"
            defaultValue={defaultUniverse}
            className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="fivem">🏥 FiveM — Hôpital moderne</option>
            <option value="redm">⚕️ RedM — Dispensaire 1890</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-400">Nom du template</label>
          <input
            name="name"
            required
            placeholder="Ex: Rapport d'admission"
            className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400">
            Description (optionnel)
          </label>
          <input
            name="description"
            placeholder="Courte description..."
            className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm"
        >
          {loading ? 'Création...' : 'Créer le template'}
        </button>
      </form>
    </div>
  );
}