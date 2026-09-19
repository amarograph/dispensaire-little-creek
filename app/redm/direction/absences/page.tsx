'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const DISPLAY = "'Rye', 'Georgia', serif";
const BODY    = "'Josefin Slab', Georgia, serif";
const MONO    = "'Special Elite', 'Courier New', monospace";
const COLOR   = '#8B4040';

interface Absence {
  id: string;
  discord_id: string;
  nom_rp: string;
  date_debut: string;
  date_fin: string;
  motif: string;
  note: string;
  statut: string;
  created_at: string;
}

const STATUT_COL: Record<string, string> = {
  'Absence':   '#C8A040',
  'Vue et lu': '#5A9A58',
  'Annulée':   '#C83030',
};

/* ── Helpers agenda (dates RP "20 Juin 1890" ↔ "DD/MM/YYYY_RP") ─────── */
const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin',
              'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function parseRpDate(s: string) {
  const parts = s.trim().split(/\s+/);
  if (parts.length !== 3) return null;
  const day   = parseInt(parts[0]);
  const month = MOIS.indexOf(parts[1]) + 1;
  const year  = parseInt(parts[2]);
  if (!day || month < 1 || !year) return null;
  return { day, month, year };
}

function rpDatesInRange(startStr: string, endStr: string): string[] {
  const s = parseRpDate(startStr);
  const e = parseRpDate(endStr);
  if (!s || !e) return [];
  const cur = new Date(s.year + 136, s.month - 1, s.day);
  const end = new Date(e.year + 136, e.month - 1, e.day);
  const dates: string[] = [];
  while (cur <= end && dates.length < 90) {
    const d = String(cur.getDate()).padStart(2, '0');
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const y = cur.getFullYear() - 136;
    dates.push(`${d}/${m}/${y}`);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

async function syncAbsenceAgenda(absence: Absence, action: 'add' | 'remove') {
  try {
    const raw = await fetch('/api/agenda-commun').then(r => r.json()).catch(() => []);
    const current: any[] = Array.isArray(raw) ? raw : [];
    const prefix = `abs_${absence.id}_`;
    const filtered = current.filter((e: any) => !String(e.id ?? '').startsWith(prefix));

    let next = filtered;
    if (action === 'add') {
      const dates = rpDatesInRange(absence.date_debut, absence.date_fin);
      if (dates.length === 0) return;
      const rangeNote = dates.length > 1
        ? `Du ${absence.date_debut} au ${absence.date_fin}`
        : absence.date_debut;
      const newEntries = dates.map(date => ({
        id:        `abs_${absence.id}_${date}`,
        patientNom: absence.nom_rp || 'Médecin',
        date,
        heure:     '—',
        type:      'Absence',
        statut:    'CONFIRMÉ',
        notes:     [rangeNote, absence.motif].filter(Boolean).join(' — '),
        createdAt: new Date().toISOString(),
      }));
      next = [...filtered, ...newEntries];
    }

    await fetch('/api/agenda-commun', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });
  } catch {
    /* sync best-effort */
  }
}

type FilterVal = 'Toutes' | 'Absence' | 'Vue et lu' | 'Annulée';
type StatutVal = 'Absence' | 'Vue et lu' | 'Annulée';

export default function AbsencesDirectionPage() {
  const router = useRouter();
  const [absences,   setAbsences]   = useState<Absence[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState<FilterVal>('Toutes');
  const [busy,       setBusy]       = useState<string | null>(null);
  const [msg,        setMsg]        = useState('');
  const [delConfirm, setDelConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/redm/absences')
      .then(r => r.json())
      .then(d => { if (d.absences) setAbsences(d.absences); })
      .finally(() => setLoading(false));
  }, []);

  // Sync agenda pour les absences "Vue et lu" dont les entrées manquent
  useEffect(() => {
    if (absences.length === 0) return;
    const approved = absences.filter(a => a.statut === 'Vue et lu');
    if (approved.length === 0) return;

    fetch('/api/agenda-commun').then(r => r.json()).then(async (raw: any) => {
      const current: any[] = Array.isArray(raw) ? raw : [];
      const missing = approved.filter(a =>
        !current.some((e: any) => String(e.id ?? '').startsWith(`abs_${a.id}_`))
      );
      if (missing.length === 0) return;

      let agenda = current;
      for (const abs of missing) {
        const dates = rpDatesInRange(abs.date_debut, abs.date_fin);
        if (dates.length === 0) continue;
        const rangeNote = dates.length > 1
          ? `Du ${abs.date_debut} au ${abs.date_fin}`
          : abs.date_debut;
        const entries = dates.map(date => ({
          id:        `abs_${abs.id}_${date}`,
          patientNom: abs.nom_rp || 'Médecin',
          date,
          heure:     '—',
          type:      'Absence',
          statut:    'CONFIRMÉ',
          notes:     [rangeNote, abs.motif].filter(Boolean).join(' — '),
          createdAt: new Date().toISOString(),
        }));
        const prefix = `abs_${abs.id}_`;
        agenda = [...agenda.filter((e: any) => !String(e.id ?? '').startsWith(prefix)), ...entries];
      }

      await fetch('/api/agenda-commun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agenda),
      });
    }).catch(() => {});
  }, [absences]);

  async function updateStatut(id: string, statut: StatutVal) {
    setBusy(id); setMsg('');
    try {
      const r = await fetch('/api/redm/absences', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, statut }),
      });
      const d = await r.json();
      if (d.error) { setMsg('Erreur : ' + d.error); return; }
      const absence = absences.find(a => a.id === id);
      setAbsences(prev => prev.map(a => a.id === id ? { ...a, statut } : a));
      if (absence) await syncAbsenceAgenda({ ...absence, statut }, statut === 'Vue et lu' ? 'add' : 'remove');
      const labels: Record<StatutVal, string> = {
        'Vue et lu': 'Marquée vue et lue.',
        'Annulée':   'Absence annulée.',
        'Absence':   'Statut réinitialisé.',
      };
      setMsg(labels[statut]);
      setTimeout(() => setMsg(''), 3000);
    } finally { setBusy(null); }
  }

  async function deleteAbsence(id: string) {
    setBusy(id); setMsg(''); setDelConfirm(null);
    try {
      const absence = absences.find(a => a.id === id);
      const r = await fetch('/api/redm/absences', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const d = await r.json();
      if (d.error) { setMsg('Erreur : ' + d.error); return; }
      if (absence) await syncAbsenceAgenda(absence, 'remove');
      setAbsences(prev => prev.filter(a => a.id !== id));
      setMsg('Absence supprimée.');
      setTimeout(() => setMsg(''), 3000);
    } finally { setBusy(null); }
  }

  const filtered = filter === 'Toutes' ? absences : absences.filter(a => a.statut === filter);

  const counts: Record<StatutVal, number> = {
    'Absence':   absences.filter(a => a.statut === 'Absence').length,
    'Vue et lu': absences.filter(a => a.statut === 'Vue et lu').length,
    'Annulée':   absences.filter(a => a.statut === 'Annulée').length,
  };

  const card: React.CSSProperties = {
    background: 'rgba(14,8,10,0.90)', border: '1px solid rgba(120,20,20,0.28)',
    borderRadius: 9, padding: '22px 26px',
  };

  return (
    <div style={{ fontFamily: BODY, maxWidth: 900, margin: '0 auto' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Rye&family=Josefin+Slab:wght@300;400;600;700&family=Special+Elite&display=swap');`}</style>

      {/* En-tête */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <button onClick={() => router.push('/redm/direction')}
            style={{ fontFamily: MONO, fontSize: 13, background: 'transparent', border: '1px solid rgba(200,168,80,0.35)', color: '#A08850', padding: '8px 18px', cursor: 'pointer', letterSpacing: '0.1em' }}>
            ← RETOUR
          </button>
          <span style={{ fontFamily: MONO, fontSize: 12, color: '#C8A850', letterSpacing: '0.18em' }}>
            DIRECTION · ABSENCES DÉCLARÉES
          </span>
        </div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 36, color: '#E8D8C0', margin: 0 }}>Absences Déclarées</h1>
        <p style={{ fontFamily: MONO, fontSize: 12, color: '#5A4A35', letterSpacing: '0.12em', marginTop: 8 }}>
          CONGÉS & INDISPONIBILITÉS DU PERSONNEL MÉDICAL
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {(['Absence', 'Vue et lu', 'Annulée'] as StatutVal[]).map(s => (
          <div key={s} style={{ ...card, textAlign: 'center', borderLeft: `4px solid ${STATUT_COL[s]}` }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 36, color: STATUT_COL[s], lineHeight: 1 }}>{counts[s]}</div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: '#7A5A40', letterSpacing: '0.14em', marginTop: 6 }}>{s.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['Toutes', 'Absence', 'Vue et lu', 'Annulée'] as FilterVal[]).map(f => {
          const active = filter === f;
          const col = f === 'Toutes' ? '#C8A850' : STATUT_COL[f];
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em',
              padding: '7px 16px', cursor: 'pointer',
              background: active ? `${col}22` : 'rgba(0,0,0,0.25)',
              border: `1px solid ${active ? col : 'rgba(120,20,20,0.25)'}`,
              color: active ? col : '#7A6050',
              borderRadius: 4, transition: 'all 0.14s',
            }}>
              {f.toUpperCase()} {f !== 'Toutes' ? `(${counts[f as StatutVal]})` : `(${absences.length})`}
            </button>
          );
        })}
        {msg && (
          <span style={{ fontFamily: BODY, fontSize: 13, color: msg.startsWith('Erreur') ? '#C83030' : '#5A9A58', alignSelf: 'center', marginLeft: 8 }}>
            {msg}
          </span>
        )}
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ fontFamily: BODY, color: '#9A8870', padding: 60, textAlign: 'center' }}>Chargement…</div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 18, color: '#5A4A38' }}>Aucune absence dans cette catégorie.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(a => {
            const sc = STATUT_COL[a.statut] ?? '#888';
            const isBusy = busy === a.id;
            return (
              <div key={a.id} style={{ ...card, borderLeft: `4px solid ${sc}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: DISPLAY, fontSize: 20, color: '#C8B8A0' }}>
                        {a.nom_rp || 'Médecin inconnu'}
                      </span>
                      <span style={{
                        fontFamily: MONO, fontSize: 9, padding: '2px 9px',
                        border: `1px solid ${sc}80`, background: `${sc}1A`,
                        color: sc, borderRadius: 3, letterSpacing: '0.1em', flexShrink: 0,
                      }}>{a.statut.toUpperCase()}</span>
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: COLOR, letterSpacing: '0.10em', marginBottom: 6 }}>
                      {a.motif}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: '#7A5A40', marginBottom: a.note ? 8 : 0 }}>
                      {a.date_debut} → {a.date_fin}
                    </div>
                    {a.note && (
                      <div style={{ fontFamily: BODY, fontSize: 13, color: '#9A8870', fontStyle: 'italic' }}>
                        « {a.note} »
                      </div>
                    )}
                    <div style={{ fontFamily: MONO, fontSize: 10, color: '#4A3A28', marginTop: 6 }}>
                      Soumis le {new Date(a.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flexShrink: 0 }}>
                    {a.statut !== 'Vue et lu' && (
                      <button onClick={() => updateStatut(a.id, 'Vue et lu')} disabled={isBusy} style={{
                        fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em',
                        padding: '7px 14px', cursor: isBusy ? 'default' : 'pointer',
                        background: 'rgba(90,154,88,0.12)', border: '1px solid rgba(90,154,88,0.50)',
                        color: '#5A9A58', borderRadius: 4, opacity: isBusy ? 0.5 : 1,
                        transition: 'all 0.14s',
                      }}>✔ VUE ET LU</button>
                    )}
                    {a.statut !== 'Annulée' && (
                      <button onClick={() => updateStatut(a.id, 'Annulée')} disabled={isBusy} style={{
                        fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em',
                        padding: '7px 14px', cursor: isBusy ? 'default' : 'pointer',
                        background: 'rgba(200,48,48,0.10)', border: '1px solid rgba(200,48,48,0.45)',
                        color: '#C83030', borderRadius: 4, opacity: isBusy ? 0.5 : 1,
                        transition: 'all 0.14s',
                      }}>✕ ANNULER</button>
                    )}
                    {a.statut !== 'Absence' && (
                      <button onClick={() => updateStatut(a.id, 'Absence')} disabled={isBusy} style={{
                        fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em',
                        padding: '7px 14px', cursor: isBusy ? 'default' : 'pointer',
                        background: 'rgba(200,160,64,0.10)', border: '1px solid rgba(200,160,64,0.35)',
                        color: '#C8A040', borderRadius: 4, opacity: isBusy ? 0.5 : 1,
                        transition: 'all 0.14s',
                      }}>↺ ABSENCE</button>
                    )}
                    {/* Supprimer */}
                    <div style={{ borderTop: '1px solid rgba(120,20,20,0.20)', paddingTop: 7, marginTop: 2 }}>
                      {delConfirm === a.id ? (
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button onClick={() => deleteAbsence(a.id)} disabled={isBusy} style={{
                            fontFamily: MONO, fontSize: 10, letterSpacing: '0.10em',
                            padding: '6px 10px', cursor: isBusy ? 'default' : 'pointer',
                            background: 'rgba(200,40,40,0.18)', border: '1px solid rgba(200,40,40,0.60)',
                            color: '#E05050', borderRadius: 4, opacity: isBusy ? 0.5 : 1,
                          }}>OUI</button>
                          <button onClick={() => setDelConfirm(null)} disabled={isBusy} style={{
                            fontFamily: MONO, fontSize: 10, letterSpacing: '0.10em',
                            padding: '6px 10px', cursor: 'pointer',
                            background: 'rgba(0,0,0,0.20)', border: '1px solid rgba(120,20,20,0.30)',
                            color: '#7A6050', borderRadius: 4,
                          }}>NON</button>
                        </div>
                      ) : (
                        <button onClick={() => setDelConfirm(a.id)} disabled={isBusy} style={{
                          fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em',
                          padding: '6px 14px', cursor: isBusy ? 'default' : 'pointer',
                          background: 'transparent', border: '1px solid rgba(120,20,20,0.35)',
                          color: '#7A4040', borderRadius: 4, opacity: isBusy ? 0.5 : 1,
                          transition: 'all 0.14s', width: '100%',
                        }}>⌫ SUPPRIMER</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
