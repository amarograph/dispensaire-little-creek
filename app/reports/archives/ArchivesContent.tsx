'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Archive } from '@/types';

export default function ArchivesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const highlight = searchParams.get('highlight');

  const [archives, setArchives] = useState<Archive[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPdf, setLoadingPdf] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    universe: 'all',
    dateFrom: '',
    dateTo: '',
    search: '',
  });

  const supabase = createClient();

  const loadArchives = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('archives')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter.universe !== 'all') {
      query = query.eq('universe', filter.universe);
    }
    if (filter.dateFrom) {
      query = query.gte('created_at', filter.dateFrom);
    }
    if (filter.dateTo) {
      query = query.lte('created_at', filter.dateTo + 'T23:59:59');
    }
    if (filter.search) {
      query = query.ilike('patient_name', `%${filter.search}%`);
    }

    const { data } = await query;
    setArchives(data ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    loadArchives();
  }, [loadArchives]);

  async function viewPdf(archive: Archive) {
    setLoadingPdf(archive.id);
    const { data } = await supabase.storage
      .from('pdf-archives')
      .createSignedUrl(archive.storage_path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    setLoadingPdf(null);
  }

  async function duplicateReport(archive: Archive) {
    router.push(
      `/reports/${archive.template_id}?prefill=${encodeURIComponent(
        JSON.stringify(archive.field_values)
      )}`
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Archives</h1>
          <p className="text-sm text-gray-400 mt-1">
            Stockage permanent — Aucune suppression possible
          </p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-gray-500">Univers</label>
            <select
              value={filter.universe}
              onChange={e =>
                setFilter(p => ({ ...p, universe: e.target.value }))
              }
              className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
            >
              <option value="all">Tous</option>
              <option value="redm">⚕️ RedM</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Patient</label>
            <input
              value={filter.search}
              onChange={e =>
                setFilter(p => ({ ...p, search: e.target.value }))
              }
              placeholder="Rechercher..."
              className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Date début</label>
            <input
              type="date"
              value={filter.dateFrom}
              onChange={e =>
                setFilter(p => ({ ...p, dateFrom: e.target.value }))
              }
              className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Date fin</label>
            <input
              type="date"
              value={filter.dateTo}
              onChange={e =>
                setFilter(p => ({ ...p, dateTo: e.target.value }))
              }
              className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : archives.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-3">🗄️</div>
          <p>Aucune archive trouvée.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {archives.map(archive => (
            <div
              key={archive.id}
              className={`bg-gray-900 border rounded-xl p-5 flex items-start justify-between transition ${
                highlight === archive.id
                  ? 'border-blue-500 shadow-lg shadow-blue-900/20'
                  : 'border-gray-800'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-2xl">
                  ⚕️
                </div>
                <div>
                  <div className="font-medium text-white">
                    {archive.patient_name}
                    {highlight === archive.id && (
                      <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        Nouveau
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    {archive.template_name}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {new Date(archive.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div className="text-xs text-gray-600 font-mono">
                    {archive.filename}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => viewPdf(archive)}
                  disabled={loadingPdf === archive.id}
                  className="text-sm bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 px-3 py-1.5 rounded-lg transition"
                >
                  {loadingPdf === archive.id ? '⟳' : '👁 Voir'}
                </button>
                {archive.template_id && (
                  <button
                    onClick={() => duplicateReport(archive)}
                    className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition"
                  >
                    📋 Dupliquer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}