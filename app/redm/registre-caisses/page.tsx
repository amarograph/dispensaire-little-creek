'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRedmSession } from '@/app/redm/_components/RedmSessionProvider';

const DISPLAY = "'Central Station', 'Georgia', serif";
const BODY    = "'Cormorant Garamond', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";

const T = {
  bg: '#102B3B', card: '#183746', border: 'rgba(139,90,43,0.30)', gold: '#D1B77C',
  text: '#EADCB9', muted: '#C8BEA5', dim: '#C8BEA5',
  green: '#5A9858', greenLight: '#7ABE78', red: '#DF9A88',
};

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
  date.setHours(0, 0, 0, 0);
  return date;
}
function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}
function fmtISO(d: Date): string {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
function fmtDay(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}
function fmtWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  return `${fmtDay(monday)} – ${fmtDay(sunday)} ${sunday.getFullYear()}`;
}
function fmt$(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' $';
}

export default function RegistreCaissesPage() {
  const router = useRouter();
  const { roles } = useRedmSession();

  const [monday,  setMonday]  = useState<Date>(() => getMonday(new Date()));
  const [dates,   setDates]   = useState<Set<string>>(new Set());
  const [rate,    setRate]    = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [error,   setError]   = useState('');
  const [notEligible, setNotEligible] = useState(false);

  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const fromISO = fmtISO(days[0]);
  const toISO   = fmtISO(days[6]);
  const todayISO = fmtISO(new Date());

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    fetch(`/api/redm/caisses?from=${fromISO}&to=${toISO}`)
      .then(async r => {
        if (r.status === 403) { setNotEligible(true); return null; }
        return r.json();
      })
      .then(d => {
        if (!d) return;
        setDates(new Set(d.dates ?? []));
        setRate(d.rate ?? null);
      })
      .catch(() => setError('Erreur réseau.'))
      .finally(() => setLoading(false));
  }, [fromISO, toISO]);

  useEffect(() => { load(); }, [load]);

  async function faireCaisse() {
    setMarking(true);
    setError('');
    try {
      const res = await fetch('/api/redm/caisses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: todayISO }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? 'Erreur serveur.');
        return;
      }
      const d = await res.json();
      setDates(prev => new Set(prev).add(d.date));
    } catch {
      setError('Erreur réseau.');
    } finally {
      setMarking(false);
    }
  }

  function prevWeek() { setMonday(m => addDays(m, -7)); }
  function nextWeek()  { setMonday(m => addDays(m, 7)); }
  function thisWeek()  { setMonday(getMonday(new Date())); }
  const isThisWeek = fmtISO(monday) === fmtISO(getMonday(new Date()));

  const count   = dates.size;
  const salaire = rate != null ? Math.round(count * rate * 100) / 100 : 0;
  const dejaFaitAujourdhui = dates.has(todayISO);

  return (
    <div style={{ fontFamily: BODY, maxWidth: 900, margin: '0 auto', padding: '32px 0 60px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
      `}</style>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <button onClick={() => router.push('/redm')} style={{
          fontFamily: MONO, fontSize: 14, background: 'transparent',
          border: `1px solid ${T.border}`, color: T.muted,
          padding: '8px 18px', cursor: 'pointer', letterSpacing: '0.1em',
        }}>← RETOUR</button>
        <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold, letterSpacing: '0.18em' }}>
          DISPENSAIRE · REGISTRE DES CAISSES
        </span>
      </div>

      <h1 style={{ fontFamily: DISPLAY, fontSize: 36, color: T.text, margin: '0 0 6px' }}>💰 Registre des Caisses</h1>
      <p style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.12em', marginBottom: 28 }}>
        SUIVI HEBDOMADAIRE DE VOS CAISSES QUOTIDIENNES
      </p>

      {loading && (
        <p style={{ fontFamily: MONO, fontSize: 14, color: T.muted, letterSpacing: '0.1em' }}>Chargement…</p>
      )}

      {notEligible && !loading && (
        <div style={{ background: 'rgba(139,64,64,0.06)', border: `1px solid rgba(139,64,64,0.30)`, borderRadius: 8, padding: '24px 28px' }}>
          <p style={{ fontFamily: MONO, fontSize: 14, color: T.red, letterSpacing: '0.08em', margin: 0 }}>
            Le registre des caisses ne s'applique pas à votre grade actuel.
          </p>
        </div>
      )}

      {!loading && !notEligible && (
        <>
          {/* Bouton faire sa caisse */}
          <div style={{
            background: T.card, border: `2px solid ${dejaFaitAujourdhui ? 'rgba(90,152,88,0.5)' : T.gold}`,
            padding: '28px 32px', textAlign: 'center', marginBottom: 28,
          }}>
            <button
              onClick={faireCaisse}
              disabled={marking || dejaFaitAujourdhui}
              style={{
                fontFamily: DISPLAY, fontSize: 24, letterSpacing: '0.04em',
                padding: '18px 48px', cursor: dejaFaitAujourdhui ? 'default' : 'pointer',
                background: dejaFaitAujourdhui ? 'rgba(90,152,88,0.15)' : 'rgba(209,183,124,0.18)',
                border: `2px solid ${dejaFaitAujourdhui ? T.green : T.gold}`,
                color: dejaFaitAujourdhui ? T.green : T.gold,
                opacity: marking ? 0.6 : 1,
                borderRadius: 8, transition: 'all 0.2s',
              }}
            >
              {dejaFaitAujourdhui ? '✔ Caisse faite aujourd\'hui' : marking ? 'Enregistrement…' : '✚ Faire ma caisse'}
            </button>
            {rate != null && (
              <p style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.1em', marginTop: 14 }}>
                TARIF DE VOTRE GRADE : {fmt$(rate)} / CAISSE
              </p>
            )}
            {error && (
              <p style={{ fontFamily: MONO, fontSize: 14, color: T.red, letterSpacing: '0.08em', marginTop: 10 }}>✕ {error}</p>
            )}
          </div>

          {/* Navigation semaine */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button onClick={prevWeek} style={{ fontFamily: MONO, fontSize: 14, background: T.card, border: `1px solid ${T.border}`, color: T.gold, padding: '8px 14px', cursor: 'pointer' }}>◀ Semaine précédente</button>
            <div style={{ fontFamily: DISPLAY, fontSize: 17, color: T.gold, minWidth: 200, textAlign: 'center' }}>{fmtWeekRange(monday)}</div>
            <button onClick={nextWeek} style={{ fontFamily: MONO, fontSize: 14, background: T.card, border: `1px solid ${T.border}`, color: T.gold, padding: '8px 14px', cursor: 'pointer' }}>Semaine suivante ▶</button>
            {!isThisWeek && (
              <button onClick={thisWeek} style={{ fontFamily: MONO, fontSize: 14, background: 'rgba(209,183,124,0.08)', border: `1px solid rgba(209,183,124,0.35)`, color: T.gold, padding: '8px 14px', cursor: 'pointer', letterSpacing: '0.08em' }}>
                AUJOURD'HUI
              </button>
            )}
          </div>

          {/* Détail des 7 jours */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 24 }}>
            {days.map((d, i) => {
              const iso  = fmtISO(d);
              const done = dates.has(iso);
              const isFuture = iso > todayISO;
              const isToday   = iso === todayISO;
              const missed    = !done && !isFuture && !isToday;
              return (
                <div key={iso} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '10px 18px',
                  background: T.card, border: `1px solid ${T.border}`,
                  borderLeft: `4px solid ${done ? T.green : missed ? T.red : 'rgba(139,90,43,0.25)'}`,
                }}>
                  <span style={{ fontFamily: DISPLAY, fontSize: 16, color: T.text, minWidth: 110 }}>{JOURS[i]}</span>
                  <span style={{ fontFamily: MONO, fontSize: 14, color: T.dim, minWidth: 60 }}>{fmtDay(d)}</span>
                  <span style={{ flex: 1 }} />
                  {done && <span style={{ fontFamily: MONO, fontSize: 14, color: T.green, letterSpacing: '0.08em' }}>✔ CAISSE FAITE</span>}
                  {missed && <span style={{ fontFamily: MONO, fontSize: 14, color: T.red, letterSpacing: '0.08em' }}>✕ NON FAITE LE {fmtDay(d).toUpperCase()}</span>}
                  {isToday && !done && <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold, letterSpacing: '0.08em' }}>● AUJOURD'HUI</span>}
                  {isFuture && <span style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.08em' }}>— À VENIR</span>}
                </div>
              );
            })}
          </div>

          {/* Stats semaine */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '18px 20px', textAlign: 'center' }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 30, color: T.gold }}>{count}</div>
              <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, marginTop: 4, letterSpacing: '0.1em' }}>CAISSES CETTE SEMAINE</div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '18px 20px', textAlign: 'center' }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 30, color: '#A8B991' }}>{fmt$(salaire)}</div>
              <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, marginTop: 4, letterSpacing: '0.1em' }}>SALAIRE DE LA SEMAINE</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
