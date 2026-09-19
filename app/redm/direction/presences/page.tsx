'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const DISPLAY = "'Rye', 'Georgia', serif";
const BODY    = "'Josefin Slab', Georgia, serif";
const MONO    = "'Special Elite', 'Courier New', monospace";

const T = {
  bg: '#120A0A', card: '#1A1008', paper: '#1F1610',
  border: 'rgba(139,90,43,0.30)', gold: '#C8A850',
  text: '#E8D9C0', muted: '#8B7355', dim: '#5A4A35', sepia: '#D4B896',
  green: '#5A9858', greenLight: '#7ABE78',
};

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

type Medecin = {
  discord_id: string; username: string;
  rp_prenom: string; rp_nom: string;
  grade: string;
};

/* ── Utilitaires semaine ─────────────────────────────────────────── */
function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

function fmtISO(d: Date): string {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function fmtDay(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

function fmtWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  return `${fmtDay(monday)} – ${fmtDay(sunday)} ${sunday.getFullYear()}`;
}

export default function PresencesPage() {
  const router = useRouter();

  const [monday,    setMonday]    = useState<Date>(() => getMonday(new Date()));
  const [medecins,  setMedecins]  = useState<Medecin[]>([]);
  const [presences, setPresences] = useState<Set<string>>(new Set()); // "discord_id|YYYY-MM-DD"
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState<string | null>(null); // "discord_id|date" en cours

  /* Semaine courante */
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const fromISO = fmtISO(days[0]);
  const toISO   = fmtISO(days[6]);

  const key = (discordId: string, date: string) => `${discordId}|${date}`;

  /* Chargement médecins (une seule fois) */
  useEffect(() => {
    fetch('/api/admin/redm-medecins')
      .then(r => r.json())
      .then(d => { if (d.medecins) setMedecins(d.medecins); });
  }, []);

  /* Chargement présences pour la semaine */
  const loadPresences = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/redm-presences?from=${fromISO}&to=${toISO}`)
      .then(r => r.json())
      .then(d => {
        const s = new Set<string>();
        for (const p of (d.presences ?? [])) s.add(key(p.discord_id, p.date));
        setPresences(s);
      })
      .finally(() => setLoading(false));
  }, [fromISO, toISO]);

  useEffect(() => { loadPresences(); }, [loadPresences]);

  /* Toggle présence */
  async function toggle(discordId: string, date: string) {
    const k = key(discordId, date);
    setSaving(k);
    // Optimiste
    setPresences(prev => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
    try {
      await fetch('/api/admin/redm-presences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discord_id: discordId, date }),
      });
    } catch {
      // Revert si erreur
      setPresences(prev => {
        const next = new Set(prev);
        if (next.has(k)) next.delete(k); else next.add(k);
        return next;
      });
    } finally {
      setSaving(null);
    }
  }

  /* Navigation semaine */
  function prevWeek() { setMonday(m => addDays(m, -7)); }
  function nextWeek() { setMonday(m => addDays(m, 7));  }
  function thisWeek() { setMonday(getMonday(new Date())); }

  const isThisWeek = fmtISO(monday) === fmtISO(getMonday(new Date()));
  const todayISO   = fmtISO(new Date());

  return (
    <div style={{ fontFamily: BODY, background: T.bg, minHeight: '100vh', padding: '32px 28px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rye&family=Josefin+Slab:wght@300;400;600;700&family=Special+Elite&display=swap');
        .pres-check { transition: background 0.12s, border-color 0.12s; }
        .pres-check:hover { border-color: rgba(90,152,88,0.80) !important; background: rgba(90,152,88,0.10) !important; cursor: pointer; }
        .pres-row:hover td { background: rgba(200,168,80,0.03); }
      `}</style>

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <button onClick={() => router.push('/redm/direction')}
          style={{ fontFamily: MONO, fontSize: 14, background: 'transparent', border: `1px solid rgba(200,168,80,0.35)`, color: '#A08850', padding: '8px 18px', cursor: 'pointer', letterSpacing: '0.1em' }}>
          ← RETOUR
        </button>
        <span style={{ fontFamily: MONO, fontSize: 13, color: T.gold, letterSpacing: '0.18em' }}>DIRECTION · PRÉSENCES</span>
      </div>

      {/* En-tête */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 36, color: T.text, margin: '0 0 6px' }}>📅 Feuille de Présences</h1>
        <p style={{ fontFamily: MONO, fontSize: 12, color: T.muted, letterSpacing: '0.12em', margin: 0 }}>
          DISPENSAIRE DE WEST ELIZABETH · SUIVI DE PRÉSENCE HEBDOMADAIRE
        </p>
      </div>

      {/* Contrôles semaine */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={prevWeek}
          style={{ fontFamily: MONO, fontSize: 14, background: T.card, border: `1px solid ${T.border}`, color: T.sepia, padding: '9px 16px', cursor: 'pointer' }}>
          ◀ Semaine précédente
        </button>
        <div style={{ fontFamily: DISPLAY, fontSize: 18, color: T.gold, minWidth: 220, textAlign: 'center' }}>
          {fmtWeekRange(monday)}
        </div>
        <button onClick={nextWeek}
          style={{ fontFamily: MONO, fontSize: 14, background: T.card, border: `1px solid ${T.border}`, color: T.sepia, padding: '9px 16px', cursor: 'pointer' }}>
          Semaine suivante ▶
        </button>
        {!isThisWeek && (
          <button onClick={thisWeek}
            style={{ fontFamily: MONO, fontSize: 12, background: 'rgba(200,168,80,0.08)', border: `1px solid rgba(200,168,80,0.35)`, color: T.gold, padding: '9px 16px', cursor: 'pointer', letterSpacing: '0.08em' }}>
            AUJOURD'HUI
          </button>
        )}
      </div>

      {/* Tableau */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', fontFamily: MONO, fontSize: 14, color: T.muted, letterSpacing: '0.12em' }}>
          CHARGEMENT…
        </div>
      ) : medecins.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', fontFamily: MONO, fontSize: 14, color: T.muted, letterSpacing: '0.12em' }}>
          AUCUN MÉDECIN ENREGISTRÉ
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${T.border}` }}>
            {/* En-tête colonnes */}
            <thead>
              <tr>
                <th style={{
                  background: 'rgba(200,168,80,0.10)', borderBottom: `1px solid ${T.border}`,
                  borderRight: `1px solid ${T.border}`, padding: '14px 20px',
                  fontFamily: MONO, fontSize: 11, color: T.gold, letterSpacing: '0.18em',
                  textAlign: 'left', minWidth: 200, position: 'sticky', left: 0, zIndex: 2,
                }}>
                  NOM & PRÉNOM
                </th>
                {days.map((d, i) => {
                  const iso = fmtISO(d);
                  const isToday = iso === todayISO;
                  return (
                    <th key={iso} style={{
                      background: isToday ? 'rgba(90,152,88,0.10)' : 'rgba(200,168,80,0.06)',
                      borderBottom: `1px solid ${T.border}`,
                      borderRight: i < 6 ? `1px solid ${T.border}` : 'none',
                      padding: '10px 14px', fontFamily: MONO, fontSize: 11,
                      color: isToday ? T.greenLight : T.gold,
                      letterSpacing: '0.12em', textAlign: 'center', minWidth: 110,
                    }}>
                      <div>{JOURS[i]}</div>
                      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{fmtDay(d)}</div>
                      {isToday && <div style={{ fontSize: 9, color: T.green, marginTop: 2, letterSpacing: '0.1em' }}>AUJOURD'HUI</div>}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {medecins.map((m, idx) => {
                const nomRP = (m.rp_prenom || m.rp_nom)
                  ? `${m.rp_prenom} ${m.rp_nom}`.trim()
                  : m.username;
                return (
                  <tr key={m.discord_id} className="pres-row"
                    style={{ borderBottom: idx < medecins.length - 1 ? `1px solid rgba(139,90,43,0.12)` : 'none' }}>
                    {/* Colonne nom */}
                    <td style={{
                      padding: '12px 20px', borderRight: `1px solid ${T.border}`,
                      background: T.card, position: 'sticky', left: 0, zIndex: 1,
                    }}>
                      <div style={{ fontFamily: DISPLAY, fontSize: 16, color: T.text, lineHeight: 1.2 }}>{nomRP}</div>
                    </td>
                    {/* Cellules jours */}
                    {days.map((d, i) => {
                      const iso  = fmtISO(d);
                      const k    = key(m.discord_id, iso);
                      const pres = presences.has(k);
                      const busy = saving === k;
                      const isToday = iso === todayISO;
                      return (
                        <td key={iso} style={{
                          padding: '10px 14px', textAlign: 'center',
                          borderRight: i < 6 ? `1px solid rgba(139,90,43,0.10)` : 'none',
                          background: isToday ? 'rgba(90,152,88,0.04)' : 'transparent',
                        }}>
                          <div
                            className="pres-check"
                            onClick={() => !busy && toggle(m.discord_id, iso)}
                            style={{
                              width: 28, height: 28, margin: '0 auto',
                              border: pres ? `2px solid ${T.green}` : `2px solid rgba(139,90,43,0.35)`,
                              background: pres ? `rgba(90,152,88,0.20)` : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 16, color: pres ? T.greenLight : 'transparent',
                              opacity: busy ? 0.5 : 1,
                              borderRadius: 3,
                            }}
                          >
                            {pres ? '✓' : ''}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Légende */}
      <div style={{ marginTop: 20, display: 'flex', gap: 24, fontFamily: MONO, fontSize: 11, color: T.muted, letterSpacing: '0.1em' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 18, height: 18, border: `2px solid ${T.green}`, background: 'rgba(90,152,88,0.20)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: T.greenLight }}>✓</div>
          PRÉSENT
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 18, height: 18, border: '2px solid rgba(139,90,43,0.35)', borderRadius: 2 }} />
          ABSENT
        </div>
      </div>
    </div>
  );
}
