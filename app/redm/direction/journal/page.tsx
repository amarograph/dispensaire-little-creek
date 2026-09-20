'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const DISPLAY = "'Central Station','Georgia',serif";
const BODY    = "'Cormorant Garamond','Georgia',serif";
const MONO    = "'Libre Baskerville','Courier New',monospace";

const T = {
  bg: '#102B3B', card: '#183746', gold: '#D1B77C', text: '#EADCB9',
  muted: '#C8BEA5', border: 'rgba(180,160,113,0.35)', dim: '#C8BEA5',
};

const CATEGORIES: { id: string; label: string; icon: string; color: string }[] = [
  { id: '',              label: 'Tout',         icon: '📋', color: '#D1B77C' },
  { id: 'certificats',   label: 'Certificats',  icon: '📄', color: '#7A9060' },
  { id: 'tarifs',        label: 'Tarifs',       icon: '🏷',  color: '#D1B77C' },
  { id: 'salaires',      label: 'Salaires',     icon: '💰', color: '#D4A840' },
  { id: 'stockage',      label: 'Stockage',     icon: '📦', color: '#D1B77C' },
  { id: 'medecins',      label: 'Médecins',     icon: '🩺', color: '#BAAAC6' },
  { id: 'entretiens',    label: 'Entretiens',   icon: '📋', color: '#5A7896' },
  { id: 'presences',     label: 'Présences',    icon: '📅', color: '#5A9858' },
  { id: 'cueilleurs',    label: 'Cueilleurs',   icon: '🌿', color: '#6A9860' },
];

function catMeta(category: string) {
  return CATEGORIES.find(c => c.id === category) ?? { label: category, icon: '•', color: '#C8BEA5' };
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface LogEntry {
  id: string;
  created_at: string;
  actor_discord_id: string;
  actor_name: string;
  actor_avatar: string | null;
  action: string;
  category: string;
  description: string;
  meta: Record<string, unknown>;
}

export default function JournalPage() {
  const router = useRouter();
  const [logs,       setLogs]       = useState<LogEntry[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [category,   setCategory]   = useState('');
  const [noTable,    setNoTable]    = useState(false);

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
    <div style={{ fontFamily: BODY, maxWidth: 960, margin: '0 auto', padding: '32px 0 60px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
        .jl-row:hover { background: rgba(209,183,124,0.04) !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <button onClick={() => router.push('/redm/direction')} style={{
          fontFamily: MONO, fontSize: 14, background: 'transparent',
          border: `1px solid ${T.border}`, color: T.muted,
          padding: '8px 18px', cursor: 'pointer', letterSpacing: '0.1em',
        }}>← RETOUR</button>
        <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold, letterSpacing: '0.18em' }}>
          DIRECTION · JOURNAL D'ACTIVITÉ
        </span>
      </div>

      <h1 style={{ fontFamily: DISPLAY, fontSize: 38, color: T.text, margin: '0 0 6px' }}>
        📜 Journal d'activité
      </h1>
      <p style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.14em', marginBottom: 28 }}>
        HISTORIQUE DES ACTIONS DE LA DIRECTION — DISPENSAIRE
      </p>

      {/* Filtres */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {CATEGORIES.map(c => {
          const active = category === c.id;
          return (
            <button key={c.id} onClick={() => setCategory(c.id)} style={{
              fontFamily: MONO, fontSize: 14, letterSpacing: '0.08em',
              background: active ? `${c.color}28` : 'transparent',
              border: `1px solid ${active ? c.color : 'rgba(209,183,124,0.25)'}`,
              color: active ? c.color : T.muted,
              padding: '6px 14px', cursor: 'pointer', borderRadius: 4,
              transition: 'all 0.15s',
            }}>
              {c.icon} {c.label.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Alerte table manquante */}
      {noTable && (
        <div style={{ background: 'rgba(200,100,40,0.10)', border: '1px solid rgba(200,100,40,0.35)', borderRadius: 8, padding: '20px 24px', marginBottom: 24 }}>
          <p style={{ fontFamily: MONO, fontSize: 14, color: '#D48040', letterSpacing: '0.1em', margin: 0 }}>
            ⚠ TABLE MANQUANTE — Exécuter la migration SQL dans Supabase :
          </p>
          <pre style={{ fontFamily: MONO, fontSize: 14, color: '#A87050', marginTop: 12, overflowX: 'auto', lineHeight: 1.7 }}>{`CREATE TABLE IF NOT EXISTS public.redm_logs (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  actor_discord_id TEXT NOT NULL,
  actor_name       TEXT NOT NULL,
  action           TEXT NOT NULL,
  category         TEXT NOT NULL,
  description      TEXT NOT NULL,
  meta             JSONB DEFAULT '{}'::JSONB
);
CREATE INDEX IF NOT EXISTS redm_logs_created_at_idx ON public.redm_logs (created_at DESC);
ALTER TABLE public.redm_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role full access" ON public.redm_logs USING (true) WITH CHECK (true);`}</pre>
        </div>
      )}

      {loading && (
        <p style={{ fontFamily: MONO, fontSize: 14, color: T.muted, letterSpacing: '0.1em' }}>
          Chargement…
        </p>
      )}

      {error && !noTable && (
        <p style={{ fontFamily: MONO, fontSize: 14, color: '#C84040', letterSpacing: '0.08em' }}>
          ✕ {error}
        </p>
      )}

      {!loading && !error && !noTable && logs.length === 0 && (
        <p style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.1em' }}>
          Aucune entrée pour le moment.
        </p>
      )}

      {!loading && logs.length > 0 && (
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
          {/* En-tête tableau */}
          <div style={{
            display: 'grid', gridTemplateColumns: '160px 180px 120px 1fr',
            background: 'rgba(209,183,124,0.08)', borderBottom: `1px solid ${T.border}`,
            padding: '10px 16px',
          }}>
            {['DATE', 'AUTEUR', 'SECTION', 'ACTION'].map(h => (
              <span key={h} style={{ fontFamily: MONO, fontSize: 14, color: T.gold, letterSpacing: '0.15em' }}>{h}</span>
            ))}
          </div>

          {/* Lignes */}
          {logs.map((log, i) => {
            const cat = catMeta(log.category);
            return (
              <div key={log.id} className="jl-row" style={{
                display: 'grid', gridTemplateColumns: '160px 180px 120px 1fr',
                padding: '12px 16px', alignItems: 'center', gap: 0,
                borderBottom: i < logs.length - 1 ? `1px solid rgba(180,160,113,0.18)` : 'none',
                background: 'transparent', transition: 'background 0.12s',
              }}>
                {/* Date */}
                <span style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.06em' }}>
                  {fmtDate(log.created_at)}
                </span>

                {/* Acteur */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {log.actor_avatar ? (
                    <img
                      src={`https://cdn.discordapp.com/avatars/${log.actor_discord_id}/${log.actor_avatar}.webp?size=32`}
                      alt=""
                      style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0 }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(209,183,124,0.15)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: T.gold }}>
                      {log.actor_name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                  <span style={{ fontFamily: BODY, fontSize: 14, color: T.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>
                    {log.actor_name}
                  </span>
                </div>

                {/* Catégorie */}
                <span style={{
                  fontFamily: MONO, fontSize: 14, letterSpacing: '0.1em',
                  background: `${cat.color}18`, border: `1px solid ${cat.color}50`,
                  color: cat.color, padding: '3px 8px', borderRadius: 3,
                  whiteSpace: 'nowrap', display: 'inline-block',
                }}>
                  {cat.icon} {cat.label.toUpperCase()}
                </span>

                {/* Description */}
                <span style={{ fontFamily: BODY, fontSize: 14, color: '#C8B898', paddingLeft: 8, lineHeight: 1.4 }}>
                  {log.description}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !noTable && (
        <p style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.1em', marginTop: 16, textAlign: 'right' }}>
          {logs.length} entrée{logs.length !== 1 ? 's' : ''} — 300 dernières au maximum
        </p>
      )}
    </div>
  );
}
