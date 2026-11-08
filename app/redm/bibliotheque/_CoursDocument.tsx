'use client';

import { useEffect, useState } from 'react';
import type { Bloc, Cours } from './_cours';
import { Livre } from './_Livre';

const DISPLAY = "'Central Station', 'Georgia', serif";
const BODY    = "'Cormorant Garamond', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";
const T = { card: '#183746', paper: '#214452', border: 'rgba(139,90,43,0.30)', text: '#EADCB9', muted: '#C8BEA5', dim: '#C8BEA5', sepia: '#D4B896' };

interface Groupe { titre: string | null; partie?: string; blocs: Bloc[] }

/* Découpe le document : un groupe par titre de chapitre (h1) ; « Partie … » s'affiche comme séparateur */
function grouper(blocs: Bloc[]): Groupe[] {
  const out: Groupe[] = [{ titre: null, blocs: [] }];
  let partie: string | undefined;
  for (const b of blocs) {
    if (b.t === 'partie') { partie = b.x; out.push({ titre: null, partie, blocs: [] }); continue; }
    if (b.t === 'h1') { out.push({ titre: b.x, blocs: [] }); partie = undefined; continue; }
    out[out.length - 1].blocs.push(b);
  }
  return out.filter(g => g.titre !== null || g.partie || g.blocs.length > 0);
}

function Rendu({ blocs, c, l }: { blocs: Bloc[]; c: string; l: string }) {
  return (
    <>
      {blocs.map((b, i) => {
        switch (b.t) {
          case 'p':
            return <p key={i} style={{ fontFamily: BODY, fontSize: 18, lineHeight: 1.75, color: T.text, margin: '0 0 12px' }}>{b.x}</p>;
          case 'h2':
            return (
              <div key={i} style={{ margin: '22px 0 10px', paddingBottom: 6, borderBottom: `1px solid ${c}55` }}>
                <span style={{ fontFamily: MONO, fontSize: 14, color: l, letterSpacing: '0.16em' }}>{b.x.toUpperCase()}</span>
              </div>
            );
          case 'h3':
            return /[:：]$/.test(b.x)
              ? <p key={i} style={{ fontFamily: DISPLAY, fontSize: 18, color: l, margin: '14px 0 6px', letterSpacing: '0.02em' }}>{b.x}</p>
              : <h4 key={i} style={{ fontFamily: DISPLAY, fontSize: 21, color: T.sepia, margin: '20px 0 8px', fontWeight: 400, letterSpacing: '0.03em' }}>{b.x}</h4>;
          case 'ul':
            return (
              <ul key={i} style={{ listStyle: 'none', margin: '0 0 14px', padding: 0 }}>
                {b.items.map((it, j) => (
                  <li key={j} style={{ position: 'relative', paddingLeft: 24, marginBottom: 7, fontFamily: BODY, fontSize: 18, lineHeight: 1.65, color: T.text }}>
                    <span style={{ position: 'absolute', left: 4, top: 1, color: l, fontSize: 13 }}>◆</span>
                    {it.x}
                    {it.sub.length > 0 && (
                      <ul style={{ listStyle: 'none', margin: '6px 0 2px', padding: 0 }}>
                        {it.sub.map((s, k) => (
                          <li key={k} style={{ position: 'relative', paddingLeft: 22, marginBottom: 4, fontSize: 17, color: T.muted }}>
                            <span style={{ position: 'absolute', left: 4, top: 0, color: l }}>○</span>{s}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={i} start={b.start} style={{ margin: '0 0 14px', padding: '0 0 0 28px', fontFamily: BODY, fontSize: 18, lineHeight: 1.65, color: T.text }}>
                {b.items.map((it, j) => <li key={j} style={{ marginBottom: 7, paddingLeft: 4 }}>{it}</li>)}
              </ol>
            );
          case 'table':
            return (
              <div key={i} style={{ overflowX: 'auto', margin: '6px 0 16px', border: `1px solid ${c}55` }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 460 }}>
                  <thead>
                    <tr>{b.head.map((h, j) => <th key={j} style={{ textAlign: 'left', padding: '10px 14px', fontFamily: MONO, fontSize: 14, letterSpacing: '0.1em', color: l, background: `${c}30`, borderBottom: `1px solid ${c}66` }}>{h.toUpperCase()}</th>)}</tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j} style={{ background: j % 2 ? 'rgba(0,0,0,0.12)' : 'transparent' }}>
                        {r.map((cell, k) => <td key={k} style={{ padding: '9px 14px', fontFamily: BODY, fontSize: 17, lineHeight: 1.5, color: k === 0 ? T.text : T.muted, fontWeight: k === 0 ? 600 : 400, verticalAlign: 'top', borderBottom: `1px solid ${c}25` }}>{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          default:
            return null;
        }
      })}
    </>
  );
}

function CoursContinu({ cours }: { cours: Cours }) {
  const { c, l } = cours;
  const groupes = grouper(cours.blocs);
  const chapitres = groupes.filter(g => g.titre).map(g => g.titre as string);
  const aller = (n: number) => document.getElementById(`cours-${cours.id}-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  let numero = -1;

  return (
    <div style={{ marginTop: 50 }}>
      {/* Bandeau */}
      <div style={{ textAlign: 'center', marginBottom: 30, padding: '36px 20px', background: T.card, border: `1px solid ${c}60`, position: 'relative', overflow: 'hidden' }}>
        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => (
          <div key={pos} style={{ position: 'absolute', top: pos.includes('top') ? 12 : 'auto', bottom: pos.includes('bottom') ? 12 : 'auto', left: pos.includes('left') ? 12 : 'auto', right: pos.includes('right') ? 12 : 'auto', width: 28, height: 28, borderTop: pos.includes('top') ? `2px solid ${c}90` : 'none', borderBottom: pos.includes('bottom') ? `2px solid ${c}90` : 'none', borderLeft: pos.includes('left') ? `2px solid ${c}90` : 'none', borderRight: pos.includes('right') ? `2px solid ${c}90` : 'none' }} />
        ))}
        <div style={{ fontFamily: MONO, fontSize: 14, color: l, letterSpacing: '0.3em', marginBottom: 10 }}>✦ {cours.kicker} ✦</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 32, color: l, margin: '0 0 8px', letterSpacing: '0.04em', lineHeight: 1.25 }}>{cours.icon} {cours.titre}</h2>
        {cours.sous && <div style={{ fontFamily: DISPLAY, fontSize: 18, color: T.muted, marginBottom: 6 }}>{cours.sous}</div>}
        <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.12em', marginBottom: 14 }}>DISPENSAIRE DE LITTLE CREEK · L’AN 1890</div>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${l}, transparent)`, margin: '0 auto' }} />
      </div>

      {/* Sommaire */}
      {chapitres.length >= 3 && (
        <div style={{ marginBottom: 28, padding: '18px 24px', background: T.card, border: `1px solid ${c}40`, borderLeft: `4px solid ${l}` }}>
          <div style={{ fontFamily: MONO, fontSize: 14, color: l, letterSpacing: '0.2em', marginBottom: 10 }}>SOMMAIRE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {chapitres.map((t, n) => (
              <button key={n} onClick={() => aller(n)} style={{ textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '3px 0', fontFamily: BODY, fontSize: 18, color: T.muted }}>
                <span style={{ color: l, marginRight: 8 }}>›</span>{t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Contenu */}
      {groupes.map((g, gi) => {
        const n = g.titre ? ++numero : -1;
        if (!g.titre && g.partie) {
          return (
            <div key={gi} style={{ margin: '38px 0 22px', textAlign: 'center' }}>
              <div style={{ fontFamily: MONO, fontSize: 14, color: l, letterSpacing: '0.2em', marginBottom: 6 }}>✦ ✦ ✦</div>
              <div style={{ fontFamily: DISPLAY, fontSize: 26, color: l, letterSpacing: '0.04em' }}>{g.partie}</div>
              {g.blocs.length > 0 && <div style={{ textAlign: 'left', marginTop: 18 }}><Rendu blocs={g.blocs} c={c} l={l} /></div>}
            </div>
          );
        }
        return (
          <div key={gi} id={g.titre ? `cours-${cours.id}-${n}` : undefined} style={{ marginBottom: 26, background: T.paper, border: `1px solid ${c}40`, borderTop: `3px solid ${c}`, padding: '24px 30px 14px', scrollMarginTop: 80 }}>
            {g.titre && <h3 style={{ fontFamily: DISPLAY, fontSize: 25, color: l, margin: '0 0 16px', letterSpacing: '0.03em', fontWeight: 400, lineHeight: 1.3 }}>{g.titre}</h3>}
            <Rendu blocs={g.blocs} c={c} l={l} />
          </div>
        );
      })}
    </div>
  );
}

/* Affichage en livre (par défaut) ou en lecture continue */
export function CoursDocument({ cours }: { cours: Cours }) {
  const [mode, setMode] = useState<'livre' | 'continu'>('livre');
  useEffect(() => {
    try { if (localStorage.getItem('biblio-mode') === 'continu') setMode('continu'); } catch { /* stockage indisponible */ }
  }, []);
  const choisir = (m: 'livre' | 'continu') => {
    setMode(m);
    try { localStorage.setItem('biblio-mode', m); } catch { /* stockage indisponible */ }
  };
  return (
    <div style={{ marginTop: 30 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 14 }}>
        {(['livre', 'continu'] as const).map(m => (
          <button key={m} onClick={() => choisir(m)} style={{ fontFamily: MONO, fontSize: 13, letterSpacing: '0.1em', padding: '7px 16px', cursor: 'pointer', background: mode === m ? 'rgba(209,183,124,0.14)' : 'transparent', color: mode === m ? '#D1B77C' : T.muted, border: `1px solid ${mode === m ? '#D1B77C' : T.border}` }}>
            {m === 'livre' ? '📖 LIVRE' : '📜 LECTURE CONTINUE'}
          </button>
        ))}
      </div>
      {mode === 'livre' ? <Livre cours={cours} /> : <CoursContinu cours={cours} />}
    </div>
  );
}
