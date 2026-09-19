'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const DISPLAY = "'Rye', 'Georgia', serif";
const BODY    = "'Josefin Slab', 'Georgia', serif";
const MONO    = "'Special Elite', 'Courier New', monospace";
const T = { bg: '#1A1208', card: '#1F1610', border: 'rgba(139,90,43,0.30)', gold: '#C8A850', text: '#E8D9C0', muted: '#8B7355', dim: '#5A4A35' };

type StatutRDV = 'CONFIRMÉ' | 'EN ATTENTE' | 'ANNULÉ' | 'PASSÉ';
interface RendezVous {
  id: string; patientNom: string; date: string; heure: string;
  type: string; statut: StatutRDV; notes: string; createdAt: string;
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

const STATUT_COL:  Record<StatutRDV, string> = { 'CONFIRMÉ': '#4A6048', 'EN ATTENTE': '#C8A850', 'ANNULÉ': '#8B4040', 'PASSÉ': '#5A4A35' };
const STATUT_ICON: Record<StatutRDV, string> = { 'CONFIRMÉ': '✔', 'EN ATTENTE': '⏳', 'ANNULÉ': '✕', 'PASSÉ': '◉' };
const inp: React.CSSProperties = { fontFamily: MONO, fontSize: 16, background: 'rgba(0,0,0,0.25)', border: `1px solid rgba(139,90,43,0.30)`, color: T.text, padding: '9px 14px', outline: 'none', boxSizing: 'border-box', width: '100%' };
const lbl: React.CSSProperties = { fontFamily: MONO, fontSize: 13, color: T.dim, letterSpacing: '0.12em', marginBottom: 5, display: 'block' };
const EMPTY = { patientNom: '', date: '', heure: '', type: 'Consultation', statut: 'EN ATTENTE' as StatutRDV, notes: '' };
const STATUTS: StatutRDV[] = ['EN ATTENTE', 'CONFIRMÉ', 'PASSÉ', 'ANNULÉ'];

const MONTH_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS_FR  = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

/** Parse a date string DD/MM/YYYY → { day, month, year } or null */
function parseDate(s: string): { day: number; month: number; year: number } | null {
  const parts = s.split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y) return null;
  return { day: d, month: m, year: y };
}

/** Format a JS Date to DD/MM/YYYY (RP year − 136) */
function formatDate(dt: Date): string {
  const d = String(dt.getDate()).padStart(2, '0');
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}/${dt.getFullYear() - 136}`;
}

/** Build calendar grid: array of 6 rows × 7 cols, each cell = { date: Date, inMonth: boolean } */
function buildGrid(year: number, month: number) {
  // month is 1-based
  const firstDay = new Date(year, month - 1, 1);
  // Monday = 0, Sunday = 6
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const grid: { date: Date; inMonth: boolean }[][] = [];
  let current = new Date(year, month - 1, 1 - startOffset);
  for (let row = 0; row < 6; row++) {
    const week: { date: Date; inMonth: boolean }[] = [];
    for (let col = 0; col < 7; col++) {
      week.push({ date: new Date(current), inMonth: current.getMonth() === month - 1 });
      current.setDate(current.getDate() + 1);
    }
    grid.push(week);
  }
  return grid;
}

export default function AgendaPage() {
  const router = useRouter();
  const [rdvs,        setRdvs]        = useState<RendezVous[]>([]);
  const [hydrated,    setHydrated]    = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [panelOpen,   setPanelOpen]   = useState(false);
  const [editing,     setEditing]     = useState<RendezVous | null>(null);
  const [form,        setForm]        = useState({ ...EMPTY });
  const [delConfirm,  setDelConfirm]  = useState<string | null>(null);

  // Calendar navigation
  const today = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1); // 1-based

  // Day detail panel (shown in panel when day clicked but no specific RDV)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  /* ── Chargement depuis Redis ── */
  useEffect(() => {
    fetch('/api/agenda')
      .then(r => r.json())
      .then((data: RendezVous[]) => { setRdvs(data); setHydrated(true); })
      .catch(() => setHydrated(true));
  }, []);

  /* ── Sauvegarde dans Redis ── */
  async function saveToServer(newRdvs: RendezVous[]) {
    setSaving(true);
    try { await fetch('/api/agenda', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRdvs) }); }
    finally { setSaving(false); }
  }


  /* ── Navigation mois ── */
  function prevMonth() {
    if (calMonth === 1) { setCalMonth(12); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 12) { setCalMonth(1); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  }

  /* ── Ouvrir panel ── */
  function openNewForDay(day: Date) {
    setEditing(null);
    setForm({ ...EMPTY, date: formatDate(day) });
    setSelectedDay(day);
    setPanelOpen(true);
  }
  function openEdit(r: RendezVous, e: React.MouseEvent) {
    e.stopPropagation();
    setEditing(r);
    setForm({ patientNom: r.patientNom, date: r.date, heure: r.heure, type: r.type, statut: r.statut, notes: r.notes });
    setSelectedDay(null);
    setPanelOpen(true);
  }
  function openNew() {
    setEditing(null);
    setForm({ ...EMPTY, date: formatDate(today) });
    setSelectedDay(null);
    setPanelOpen(true);
  }

  /* ── Soumettre RDV ── */
  async function submit() {
    if (!form.patientNom.trim()) return;
    let newRdvs: RendezVous[];
    if (editing) newRdvs = rdvs.map(r => r.id === editing.id ? { ...editing, ...form } : r);
    else         newRdvs = [{ id: uid(), createdAt: new Date().toISOString(), ...form }, ...rdvs];
    setRdvs(newRdvs);
    await saveToServer(newRdvs);
    setPanelOpen(false);
  }

  /* ── Cycler statut ── */
  async function cycleStatut(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const newRdvs = rdvs.map(r => r.id !== id ? r : { ...r, statut: STATUTS[(STATUTS.indexOf(r.statut) + 1) % STATUTS.length] });
    setRdvs(newRdvs);
    await saveToServer(newRdvs);
  }

  /* ── Supprimer RDV ── */
  async function deleteRdv(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const newRdvs = rdvs.filter(r => r.id !== id);
    setRdvs(newRdvs);
    setDelConfirm(null);
    await saveToServer(newRdvs);
  }

  /* ── Helpers calendrier ── */
  const grid = buildGrid(calYear, calMonth);

  function rdvsForDay(day: Date): RendezVous[] {
    const key = formatDate(day);
    return rdvs
      .filter(r => r.date === key)
      .sort((a, b) => a.heure.localeCompare(b.heure));
  }

  function isToday(day: Date) {
    return day.getDate() === today.getDate()
      && day.getMonth() === today.getMonth()
      && day.getFullYear() === today.getFullYear();
  }

  /* ── Rendu ── */
  return (
    <div style={{ fontFamily: BODY }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rye&family=Josefin+Slab:wght@300;400;600;700&family=Special+Elite&display=swap');
        @keyframes slide-in { from { transform: translateX(100%); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        @keyframes pulse    { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }
        @keyframes fade-in  { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: translateY(0) } }
        .cal-day { transition: background 0.15s, border-color 0.15s; }
        .cal-day:hover { background: rgba(200,168,80,0.07) !important; border-color: rgba(200,168,80,0.35) !important; }
        .rdv-badge { transition: opacity 0.12s; cursor: pointer; }
        .rdv-badge:hover { opacity: 0.75; }
        .nav-btn { transition: background 0.15s, color 0.15s; }
        .nav-btn:hover { background: rgba(200,168,80,0.15) !important; color: #C8A850 !important; }
        * { box-sizing: border-box; }
      `}</style>

      {/* ── En-tête ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <button onClick={() => router.push('/redm/cabinet')}
            className="nav-btn"
            style={{ fontFamily: MONO, fontSize: 15, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '8px 18px', cursor: 'pointer', letterSpacing: '0.1em' }}>
            ← RETOUR
          </button>
          <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold, letterSpacing: '0.16em' }}>CABINET · AGENDA</span>
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            {saving && <span style={{ fontFamily: MONO, fontSize: 12, color: T.dim }}>⟳ sync...</span>}
            <span style={{ fontFamily: MONO, fontSize: 13, color: notifStatus === 'ok' ? '#4A6048' : '#5A4A35', display: 'flex', alignItems: 'center', gap: 5, animation: notifStatus === 'ok' ? 'pulse 1s ease 2' : 'none' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: notifStatus === 'ok' ? '#4A8048' : '#3A3028', display: 'inline-block' }} />
              {notifStatus === 'ok' ? 'NOTIF ENVOYÉE' : 'DISCORD ACTIF'}
            </span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: DISPLAY, fontSize: 33, color: T.gold, margin: 0, lineHeight: 1 }}>Agenda des Rendez-vous</h1>
            <div style={{ fontFamily: MONO, fontSize: 13, color: T.dim, marginTop: 6, letterSpacing: '0.08em' }}>
              🔔 Notification Discord automatique 4h avant chaque rendez-vous · données sauvegardées sur le serveur
            </div>
          </div>
          <button onClick={openNew}
            style={{ fontFamily: MONO, fontSize: 14, letterSpacing: '0.1em', padding: '9px 20px', cursor: 'pointer', background: 'rgba(72,104,120,0.25)', color: '#88AAC0', border: '1px solid rgba(72,104,120,0.5)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            ✚ NOUVEAU RDV
          </button>
        </div>
      </div>

      {/* ── Bloc calendrier ── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '0 0 2px' }}>

        {/* Navigation mois */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px 14px', borderBottom: `1px solid ${T.border}` }}>
          <button onClick={prevMonth}
            className="nav-btn"
            style={{ fontFamily: MONO, fontSize: 19, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, width: 38, height: 38, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ‹
          </button>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 30, color: T.gold, letterSpacing: '0.04em', lineHeight: 1 }}>
              {MONTH_FR[calMonth - 1]}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 15, color: T.muted, letterSpacing: '0.15em', marginTop: 3 }}>
              {calYear - 136}
            </div>
          </div>

          <button onClick={nextMonth}
            className="nav-btn"
            style={{ fontFamily: MONO, fontSize: 19, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, width: 38, height: 38, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ›
          </button>
        </div>

        {/* En-têtes jours */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${T.border}` }}>
          {DAYS_FR.map((d, i) => (
            <div key={d} style={{
              fontFamily: MONO, fontSize: 13, letterSpacing: '0.14em', color: i >= 5 ? T.gold : T.muted,
              textAlign: 'center', padding: '8px 4px', borderRight: i < 6 ? `1px solid ${T.border}` : 'none'
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Grille jours */}
        {!hydrated
          ? <div style={{ padding: '48px', textAlign: 'center', fontFamily: MONO, fontSize: 15, color: T.dim }}>Chargement…</div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {grid.flatMap((week, wi) =>
                week.map((cell, di) => {
                  const dayRdvs  = rdvsForDay(cell.date);
                  const todayDay = isToday(cell.date);
                  const isWeekend = di >= 5;
                  const isLastRow = wi === grid.length - 1;
                  const isLastCol = di === 6;

                  return (
                    <div
                      key={`${wi}-${di}`}
                      className="cal-day"
                      onClick={() => openNewForDay(cell.date)}
                      style={{
                        minHeight: 108,
                        padding: '8px 8px 6px',
                        borderRight: !isLastCol ? `1px solid ${T.border}` : 'none',
                        borderBottom: !isLastRow ? `1px solid ${T.border}` : 'none',
                        background: todayDay
                          ? 'rgba(200,168,80,0.08)'
                          : isWeekend && cell.inMonth
                            ? 'rgba(200,168,80,0.02)'
                            : 'transparent',
                        cursor: 'pointer',
                        position: 'relative',
                        animation: cell.inMonth ? 'fade-in 0.2s ease' : undefined,
                      }}
                    >
                      {/* Numéro du jour */}
                      <div style={{
                        fontFamily: todayDay ? DISPLAY : MONO,
                        fontSize: todayDay ? 15 : 12,
                        color: todayDay
                          ? T.gold
                          : cell.inMonth
                            ? isWeekend ? 'rgba(200,168,80,0.7)' : T.muted
                            : T.dim,
                        opacity: cell.inMonth ? 1 : 0.35,
                        marginBottom: dayRdvs.length > 0 ? 5 : 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}>
                        {todayDay && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 22, height: 22, borderRadius: '50%',
                            background: T.gold, color: T.bg,
                            fontFamily: MONO, fontSize: 14, fontWeight: 700,
                          }}>
                            {cell.date.getDate()}
                          </span>
                        )}
                        {!todayDay && cell.date.getDate()}
                      </div>

                      {/* Badges RDV */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {dayRdvs.slice(0, 3).map(r => (
                          <div
                            key={r.id}
                            className="rdv-badge"
                            onClick={e => openEdit(r, e)}
                            title={`${r.heure} · ${r.patientNom} · ${r.type}`}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              background: `${STATUT_COL[r.statut]}22`,
                              borderLeft: `2px solid ${STATUT_COL[r.statut]}`,
                              padding: '2px 5px',
                              overflow: 'hidden',
                            }}
                          >
                            <span style={{ fontFamily: MONO, fontSize: 12, color: STATUT_COL[r.statut], flexShrink: 0, letterSpacing: '0.04em' }}>
                              {r.heure || '—'}
                            </span>
                            <span style={{ fontFamily: BODY, fontSize: 13, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                              {r.patientNom}
                            </span>
                          </div>
                        ))}
                        {dayRdvs.length > 3 && (
                          <div style={{ fontFamily: MONO, fontSize: 12, color: T.dim, paddingLeft: 7 }}>
                            +{dayRdvs.length - 3} autre{dayRdvs.length - 3 > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>}
      </div>

      {/* ── Légende statuts ── */}
      <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap', paddingLeft: 2 }}>
        {STATUTS.map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ display: 'inline-block', width: 3, height: 12, background: STATUT_COL[s] }} />
            <span style={{ fontFamily: MONO, fontSize: 12, color: T.muted, letterSpacing: '0.1em' }}>{s}</span>
          </div>
        ))}
        <span style={{ fontFamily: MONO, fontSize: 12, color: T.dim, marginLeft: 'auto' }}>
          {rdvs.length} RDV total · cliquer un jour pour ajouter · cliquer un badge pour modifier
        </span>
      </div>

      {/* ── Panel slide-in (créer / éditer) ── */}
      {panelOpen && (
        <>
          <div onClick={() => setPanelOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 40 }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 440, background: T.bg, borderLeft: `2px solid ${T.gold}`, zIndex: 50, overflowY: 'auto', animation: 'slide-in 0.25s ease', padding: '28px 26px 40px' }}>

            {/* En-tête panel */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.gold }}>{editing ? '✎ Modifier le RDV' : '✚ Nouveau RDV'}</div>
                {form.date && (
                  <div style={{ fontFamily: MONO, fontSize: 13, color: T.muted, marginTop: 4, letterSpacing: '0.1em' }}>
                    {form.date}
                  </div>
                )}
              </div>
              <button onClick={() => setPanelOpen(false)} style={{ background: 'transparent', border: 'none', color: T.muted, fontSize: 24, cursor: 'pointer', padding: 4 }}>✕</button>
            </div>

            {/* Formulaire */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>NOM DU PATIENT *</label>
                <input style={inp} value={form.patientNom} onChange={e => setForm(f => ({ ...f, patientNom: e.target.value }))} placeholder="Nom complet" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={lbl}>DATE</label>
                  <input style={inp} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} placeholder="JJ/MM/AAAA" />
                </div>
                <div>
                  <label style={lbl}>HEURE</label>
                  <input style={inp} value={form.heure} onChange={e => setForm(f => ({ ...f, heure: e.target.value }))} placeholder="ex : 14h30" />
                </div>
              </div>
              <div>
                <label style={lbl}>TYPE DE SÉANCE</label>
                <input style={inp} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} placeholder="Consultation, Suivi, Hypnose…" />
              </div>
              <div>
                <label style={lbl}>STATUT</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value as StatutRDV }))}>
                  {STATUTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>NOTES</label>
                <textarea style={{ ...inp, resize: 'vertical', minHeight: 70 }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Remarques, rappels…" />
              </div>

              <div style={{ background: 'rgba(88,120,88,0.12)', border: '1px solid rgba(88,120,88,0.3)', padding: '10px 14px', fontFamily: MONO, fontSize: 13, color: '#6A9A6A', letterSpacing: '0.08em' }}>
                🔔 Une notification Discord sera envoyée automatiquement 4h avant ce rendez-vous, même si le site est fermé
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={submit}
                  disabled={!form.patientNom.trim()}
                  style={{ flex: 1, fontFamily: MONO, fontSize: 15, letterSpacing: '0.12em', padding: '12px', cursor: form.patientNom.trim() ? 'pointer' : 'not-allowed', background: form.patientNom.trim() ? 'rgba(72,104,120,0.35)' : 'rgba(255,255,255,0.04)', color: form.patientNom.trim() ? '#88AAC0' : T.dim, border: `2px solid ${form.patientNom.trim() ? 'rgba(72,104,120,0.6)' : 'rgba(255,255,255,0.06)'}`, marginTop: 6 }}>
                  {editing ? '✔ ENREGISTRER' : '✔ PLANIFIER LE RDV'}
                </button>
              </div>

              {/* Actions supplémentaires si édition */}
              {editing && (
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button
                    onClick={e => cycleStatut(editing.id, e)}
                    style={{ flex: 1, fontFamily: MONO, fontSize: 13, padding: '8px', cursor: 'pointer', background: `${STATUT_COL[editing.statut]}18`, color: STATUT_COL[editing.statut], border: `1px solid ${STATUT_COL[editing.statut]}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    {STATUT_ICON[editing.statut]} Changer statut → {STATUTS[(STATUTS.indexOf(editing.statut) + 1) % STATUTS.length]}
                  </button>
                  {delConfirm === editing.id
                    ? <button onClick={e => deleteRdv(editing.id, e)} style={{ fontFamily: MONO, fontSize: 13, padding: '8px 12px', cursor: 'pointer', background: '#8B404025', color: '#C06060', border: '1px solid #8B404060', whiteSpace: 'nowrap' }}>Confirmer ✕</button>
                    : <button onClick={() => setDelConfirm(editing.id)} style={{ fontFamily: MONO, fontSize: 13, padding: '8px 12px', cursor: 'pointer', background: 'transparent', color: '#8B6060', border: '1px solid rgba(139,64,64,0.3)', whiteSpace: 'nowrap' }}>Supprimer ✕</button>}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
