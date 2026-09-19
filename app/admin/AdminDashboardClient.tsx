'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import MemberRow from './access/MemberRow';

type Member = {
  user_id: string;
  discord_id: string;
  username: string;
  status: string;
  roles: string[];
  requested_at: string;
};

interface LogEntry {
  id: string;
  created_at: string;
  actor_discord_id: string;
  actor_name: string;
  actor_avatar: string | null;
  action: string;
  category: string;
  description: string;
}

const LOG_CATEGORIES: { id: string; label: string }[] = [
  { id: '',              label: 'Tout' },
  { id: 'certificats',   label: 'Certificats' },
  { id: 'tarifs',        label: 'Tarifs' },
  { id: 'salaires',      label: 'Salaires' },
  { id: 'stockage',      label: 'Stockage' },
  { id: 'medecins',      label: 'Médecins' },
  { id: 'entretiens',    label: 'Entretiens' },
  { id: 'presences',     label: 'Présences' },
  { id: 'cueilleurs',    label: 'Cueilleurs' },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="text-3xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs uppercase tracking-wide text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function LogsPanel() {
  const [logs,     setLogs]     = useState<LogEntry[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [category, setCategory] = useState('');
  const [noTable,  setNoTable]  = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    const url = `/api/redm/logs${category ? `?category=${category}` : ''}`;
    fetch(url)
      .then(r => r.json())
      .then(d => {
        if (d.missing_table) { setNoTable(true); setLogs([]); return; }
        if (d.error) { setError(d.error); return; }
        setLogs(d.logs ?? []);
      })
      .catch(() => setError('Erreur réseau.'))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {LOG_CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition ${
              category === c.id
                ? 'bg-yellow-900/30 border-yellow-700 text-yellow-400'
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-600'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {noTable && (
        <p className="text-sm text-orange-400">
          ⚠ Table de logs manquante — voir <code>/api/redm/logs</code> pour la migration SQL à exécuter.
        </p>
      )}
      {loading && <p className="text-sm text-gray-500">Chargement…</p>}
      {error && !noTable && <p className="text-sm text-red-400">✕ {error}</p>}
      {!loading && !error && !noTable && logs.length === 0 && (
        <p className="text-sm text-gray-500">Aucune entrée pour le moment.</p>
      )}

      {!loading && logs.length > 0 && (
        <div className="border border-gray-800 rounded-xl overflow-hidden">
          {logs.map((log, i) => (
            <div
              key={log.id}
              className={`flex items-center gap-4 px-4 py-3 ${i < logs.length - 1 ? 'border-b border-gray-800' : ''}`}
            >
              <span className="text-xs text-gray-500 font-mono w-36 flex-shrink-0">{fmtDate(log.created_at)}</span>
              <span className="text-sm text-white font-medium w-40 flex-shrink-0 truncate">{log.actor_name}</span>
              <span className="text-xs text-yellow-400 bg-yellow-900/20 border border-yellow-800/40 px-2 py-0.5 rounded-full w-28 flex-shrink-0 text-center">
                {log.category}
              </span>
              <span className="text-sm text-gray-300 flex-1">{log.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardClient({ members }: { members: Member[] }) {
  const [tab, setTab] = useState<'utilisateurs' | 'logs'>('utilisateurs');

  const pending  = members.filter(m => m.status === 'pending');
  const approved = members.filter(m => m.status === 'approved');

  return (
    <div>
      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <span className="text-yellow-500">⚙</span>
            <span className="text-yellow-500 tracking-wide">PANNEAU ADMIN</span>
          </h1>
          <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">
            Dispensaire de Little Creek · Accès restreint
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/redm-dashboard" className="text-xs bg-gray-900 border border-gray-800 hover:border-gray-600 text-gray-300 px-4 py-2 rounded-lg transition">
            🏛 Accueil RedM
          </Link>
          <Link href="/redm" className="text-xs bg-gray-900 border border-gray-800 hover:border-gray-600 text-gray-400 px-4 py-2 rounded-lg transition">
            ← Retour
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard value={members.length} label="Utilisateurs" color="#E8D9C0" />
        <StatCard value={pending.length} label="En attente" color="#D4A840" />
        <StatCard value={approved.length} label="Actifs" color="#5A9A58" />
      </div>

      {/* Onglets */}
      <div className="flex gap-2 mb-6 border-b border-gray-800">
        {([['utilisateurs', 'Utilisateurs'], ['logs', 'Logs']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`text-sm px-4 py-2.5 -mb-px border-b-2 transition ${
              tab === id ? 'border-yellow-500 text-yellow-400' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'utilisateurs' && (
        <div className="space-y-10">
          <div>
            <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-3">
              ⏳ En attente de whitelist ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun utilisateur en attente.</p>
            ) : (
              <div className="space-y-2">
                {pending.map(m => <MemberRow key={m.user_id} member={m} />)}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-3">
              👥 Membres du dispensaire ({approved.length})
            </h2>
            {approved.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun membre pour le moment.</p>
            ) : (
              <div className="space-y-2">
                {approved.map(m => <MemberRow key={m.user_id} member={m} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'logs' && <LogsPanel />}
    </div>
  );
}
