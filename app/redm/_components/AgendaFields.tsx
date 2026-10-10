'use client';

import type { CSSProperties } from 'react';

const MONO = "'Libre Baskerville', 'Courier New', monospace";
const DIM  = '#C8BEA5';

/* Champs de saisie partagés par les agendas : calendrier pour la date (année RP = réelle − 136),
   menus pour l'heure et le type de rendez-vous. */

function parseRp(s: string): { day: number; month: number; year: number } | null {
  const p = (s ?? '').split('/');
  if (p.length !== 3) return null;
  const [d, m, y] = p.map(Number);
  if (!d || !m || !y) return null;
  return { day: d, month: m, year: y };
}
function rpToInputDate(s: string): string {
  const p = parseRp(s);
  if (!p) return '';
  const y = p.year < 1900 ? p.year + 136 : p.year;
  return `${y}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}
function inputToRpDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${Number(m[1]) - 136}` : '';
}
function splitHeure(s: string): { h: string; m: string } {
  const mt = (s ?? '').trim().match(/^(\d{1,2})\s*(?:[h:]\s*(\d{1,2})?)?$/i);
  if (!mt) return { h: '', m: '' };
  const h = Math.min(23, Number(mt[1]));
  const mm = Math.min(59, Number(mt[2] ?? 0));
  return { h: String(h).padStart(2, '0'), m: String((Math.round(mm / 5) * 5) % 60).padStart(2, '0') };
}
const HEURES  = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

export function DateRpField({ value, onChange, inp }: { value: string; onChange: (rpDate: string) => void; inp: CSSProperties }) {
  return (
    <>
      <input type="date" style={{ ...inp, cursor: 'pointer', colorScheme: 'dark' }}
        value={rpToInputDate(value)} onChange={e => onChange(inputToRpDate(e.target.value))} />
      {value && <div style={{ fontFamily: MONO, fontSize: 13, color: DIM, marginTop: 4 }}>Date RP : {value}</div>}
    </>
  );
}

export function HeureField({ value, onChange, inp }: { value: string; onChange: (heure: string) => void; inp: CSSProperties }) {
  const { h, m } = splitHeure(value);
  const setHM = (nh: string, nm: string) => onChange(nh ? `${nh}:${nm || '00'}` : '');
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <select style={{ ...inp, cursor: 'pointer' }} value={h} onChange={e => setHM(e.target.value, m)}>
        <option value="">--</option>
        {HEURES.map(x => <option key={x} value={x}>{x} h</option>)}
      </select>
      <span style={{ fontFamily: MONO, color: DIM }}>:</span>
      <select style={{ ...inp, cursor: 'pointer' }} value={h ? m : ''} disabled={!h} onChange={e => setHM(h, e.target.value)}>
        {!h && <option value="">--</option>}
        {MINUTES.map(x => <option key={x} value={x}>{x}</option>)}
      </select>
    </div>
  );
}

export function TypeSelect({ value, onChange, options, inp }: { value: string; onChange: (v: string) => void; options: string[]; inp: CSSProperties }) {
  return (
    <select style={{ ...inp, cursor: 'pointer' }} value={value} onChange={e => onChange(e.target.value)}>
      {value && !options.includes(value) && <option value={value}>{value}</option>}
      {options.map(t => <option key={t} value={t}>{t}</option>)}
    </select>
  );
}
