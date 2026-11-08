'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Bloc, Cours } from './_cours';

/* Lecteur en forme de livre : couverture, page de titre, sommaire, pages à tourner (double page sur grand écran,
   page seule sur petit écran), clic / flèches / balayage pour tourner. Le texte est découpé en pages d'après sa hauteur réelle. */

const DISPLAY = "'Central Station', 'Georgia', serif";
const BODY    = "'Cormorant Garamond', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";
const INK = '#2a1e12', SOFT = '#5b4a36', GOLD = '#DCC585';
const DUR = 780;                 // durée d'une page qui se tourne (ms)
const PAD_X = 42, PAD_TOP = 34, PAD_BOTTOM = 56;

function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const m = (v: number) => Math.round(Math.min(255, v * f)).toString(16).padStart(2, '0');
  return `#${m((n >> 16) & 255)}${m((n >> 8) & 255)}${m(n & 255)}`;
}

/* ───────── Découpage du contenu en « atomes » (unités qu'on ne coupe pas) ───────── */

type Atom =
  | { k: 'h1'; x: string; ch: number }
  | { k: 'partie'; x: string }
  | { k: 'h2' | 'h3' | 'p'; x: string }
  | { k: 'li'; x: string; sub: string[] }
  | { k: 'oli'; n: number; x: string }
  | { k: 'tbl'; head: string[]; rows: string[][] };

const GARDE_AVEC_SUITE = new Set(['h1', 'partie', 'h2', 'h3']);

function atomes(blocs: Bloc[]): Atom[] {
  const out: Atom[] = [];
  let ch = -1;
  for (const b of blocs) {
    if (b.t === 'h1') out.push({ k: 'h1', x: b.x, ch: ++ch });
    else if (b.t === 'partie') out.push({ k: 'partie', x: b.x });
    else if (b.t === 'h2' || b.t === 'h3' || b.t === 'p') out.push({ k: b.t, x: b.x });
    else if (b.t === 'ul') b.items.forEach(it => out.push({ k: 'li', x: it.x, sub: it.sub }));
    else if (b.t === 'ol') b.items.forEach((x, i) => out.push({ k: 'oli', n: b.start + i, x }));
    else if (b.t === 'table') for (let i = 0; i < b.rows.length; i += 6) out.push({ k: 'tbl', head: b.head, rows: b.rows.slice(i, i + 6) });
  }
  return out;
}

/* Remplit les pages une à une ; un titre reste toujours avec ce qui le suit */
function paginer(a: Atom[], h: number[], H: number): number[][] {
  const pages: number[][] = [];
  let cur: number[] = [];
  let y = 0;
  for (let i = 0; i < a.length; i++) {
    let besoin = h[i];
    if (GARDE_AVEC_SUITE.has(a[i].k)) {
      let j = i;
      while (GARDE_AVEC_SUITE.has(a[j].k) && j + 1 < a.length) { j++; besoin += h[j]; }
    }
    if (cur.length && y + besoin > H) { pages.push(cur); cur = []; y = 0; }
    cur.push(i);
    y += h[i];
  }
  if (cur.length) pages.push(cur);
  return pages;
}

/* ───────── Rendu d'un atome (encre sur parchemin) ───────── */

function AtomView({ a, c, first }: { a: Atom; c: string; first?: boolean }) {
  const mt = (v: number) => (first ? 0 : v);
  const base: React.CSSProperties = { display: 'flow-root' };
  switch (a.k) {
    case 'h1':
      return (
        <div style={base}>
          <div style={{ textAlign: 'center', margin: `${mt(16)}px 0 14px` }}>
            <div style={{ color: c, fontSize: 17, lineHeight: 1 }}>❦</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 21, color: c, letterSpacing: '0.04em', lineHeight: 1.3, margin: '6px 0 9px' }}>{a.x}</div>
            <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${c}, transparent)` }} />
          </div>
        </div>
      );
    case 'partie':
      return (
        <div style={base}>
          <div style={{ textAlign: 'center', margin: `${mt(22)}px 0 18px` }}>
            <div style={{ fontFamily: MONO, fontSize: 13, color: c, letterSpacing: '0.3em' }}>✦ ✦ ✦</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 24, color: c, margin: '8px 0', lineHeight: 1.3 }}>{a.x}</div>
          </div>
        </div>
      );
    case 'h2':
      return (
        <div style={base}>
          <div style={{ margin: `${mt(14)}px 0 8px`, paddingBottom: 4, borderBottom: `1px solid ${c}66` }}>
            <span style={{ fontFamily: MONO, fontSize: 12.5, color: c, letterSpacing: '0.15em' }}>{a.x.toUpperCase()}</span>
          </div>
        </div>
      );
    case 'h3':
      return (
        <div style={base}>
          {/[:：]$/.test(a.x)
            ? <p style={{ fontFamily: DISPLAY, fontSize: 16.5, color: c, margin: `${mt(9)}px 0 4px` }}>{a.x}</p>
            : <p style={{ fontFamily: DISPLAY, fontSize: 18.5, color: INK, margin: `${mt(12)}px 0 5px`, letterSpacing: '0.02em' }}>{a.x}</p>}
        </div>
      );
    case 'p':
      return <div style={base}><p style={{ fontFamily: BODY, fontSize: 17, lineHeight: 1.6, color: INK, margin: '0 0 9px', textAlign: 'justify', hyphens: 'auto' }}>{a.x}</p></div>;
    case 'li':
      return (
        <div style={base}>
          <div style={{ position: 'relative', paddingLeft: 20, margin: '0 0 6px', fontFamily: BODY, fontSize: 17, lineHeight: 1.55, color: INK }}>
            <span style={{ position: 'absolute', left: 3, top: 1, color: c, fontSize: 11 }}>◆</span>
            {a.x}
            {a.sub.map((s, i) => (
              <div key={i} style={{ position: 'relative', paddingLeft: 18, marginTop: 3, fontSize: 16, color: SOFT }}>
                <span style={{ position: 'absolute', left: 2, top: 0, color: c }}>○</span>{s}
              </div>
            ))}
          </div>
        </div>
      );
    case 'oli':
      return (
        <div style={base}>
          <div style={{ position: 'relative', paddingLeft: 26, margin: '0 0 6px', fontFamily: BODY, fontSize: 17, lineHeight: 1.55, color: INK }}>
            <span style={{ position: 'absolute', left: 0, top: 0, fontFamily: DISPLAY, color: c, fontSize: 15 }}>{a.n}.</span>
            {a.x}
          </div>
        </div>
      );
    case 'tbl':
      return (
        <div style={base}>
          <table style={{ width: '100%', borderCollapse: 'collapse', margin: '4px 0 12px', fontSize: 15 }}>
            <thead>
              <tr>{a.head.map((h, j) => <th key={j} style={{ textAlign: 'left', padding: '6px 8px', fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.08em', color: c, borderBottom: `2px solid ${c}88` }}>{h.toUpperCase()}</th>)}</tr>
            </thead>
            <tbody>
              {a.rows.map((r, j) => (
                <tr key={j}>{r.map((cell, k) => <td key={k} style={{ padding: '6px 8px', fontFamily: BODY, fontSize: 15.5, lineHeight: 1.4, color: k === 0 ? INK : SOFT, fontWeight: k === 0 ? 700 : 400, verticalAlign: 'top', borderBottom: `1px solid ${c}33` }}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

/* ───────── Pages ───────── */

type PageDef =
  | { kind: 'cover' } | { kind: 'title' } | { kind: 'end' } | { kind: 'blank' }
  | { kind: 'toc'; from: number; to: number }
  | { kind: 'content'; atoms: number[] };

interface Ctx {
  cours: Cours; c: string; atoms: Atom[];
  chapitres: { titre: string; page: number }[];
  aller: (page: number) => void; total: number;
}

function Ornement({ c }: { c: string }) {
  return <div style={{ textAlign: 'center', color: c, letterSpacing: '0.4em', fontSize: 14 }}>❦ ✦ ❦</div>;
}

function Cover({ cours }: { cours: Cours }) {
  const dark = shade(cours.c, 0.42), mid = shade(cours.c, 0.62);
  return (
    <div style={{ position: 'absolute', inset: 0, borderRadius: '4px 12px 12px 4px', background: `radial-gradient(ellipse at 30% 20%, ${mid}, ${dark} 70%)`, boxShadow: 'inset 0 0 60px rgba(0,0,0,0.55)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 26, background: 'linear-gradient(to right, rgba(0,0,0,0.5), rgba(255,255,255,0.05) 60%, transparent)' }} />
      <div style={{ position: 'absolute', inset: 22, border: `2px solid ${GOLD}aa`, borderRadius: 6 }} />
      <div style={{ position: 'absolute', inset: 30, border: `1px solid ${GOLD}66`, borderRadius: 4 }} />
      <div style={{ position: 'absolute', inset: '0 0 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 15%' }}>
        <div style={{ fontFamily: MONO, fontSize: 12, color: GOLD, letterSpacing: '0.28em', marginBottom: 18 }}>✦ {cours.kicker} ✦</div>
        <div style={{ fontSize: 52, marginBottom: 14, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))' }}>{cours.icon}</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 'clamp(20px, 2.6vw, 30px)', color: GOLD, lineHeight: 1.3, textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>{cours.titre}</div>
        <div style={{ width: 90, height: 1, background: `linear-gradient(to right, transparent, ${GOLD}, transparent)`, margin: '20px 0 14px' }} />
        <div style={{ fontFamily: MONO, fontSize: 11.5, color: `${GOLD}cc`, letterSpacing: '0.2em' }}>DISPENSAIRE DE LITTLE CREEK</div>
        <div style={{ fontFamily: MONO, fontSize: 11.5, color: `${GOLD}cc`, letterSpacing: '0.2em', marginTop: 4 }}>L’AN 1890</div>
      </div>
    </div>
  );
}

function PageBody({ def, idx, ctx }: { def: PageDef; idx: number; ctx: Ctx }) {
  const { cours, c } = ctx;
  const pair = idx % 2 === 1; // page de gauche : numéro à gauche
  switch (def.kind) {
    case 'blank':
      return null;
    case 'title':
      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 14 }}>
          <Ornement c={c} />
          <div style={{ fontFamily: MONO, fontSize: 12, color: c, letterSpacing: '0.24em' }}>{cours.kicker}</div>
          <div style={{ fontSize: 40 }}>{cours.icon}</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 25, color: INK, lineHeight: 1.3 }}>{cours.titre}</div>
          {cours.sous && <div style={{ fontFamily: BODY, fontSize: 17, fontStyle: 'italic', color: SOFT, lineHeight: 1.4 }}>{cours.sous}</div>}
          <div style={{ width: 100, height: 1, background: `linear-gradient(to right, transparent, ${c}, transparent)` }} />
          <div style={{ fontFamily: MONO, fontSize: 11.5, color: SOFT, letterSpacing: '0.2em' }}>DISPENSAIRE DE LITTLE CREEK</div>
          <div style={{ fontFamily: MONO, fontSize: 11.5, color: SOFT, letterSpacing: '0.2em' }}>L’AN 1890</div>
          <Ornement c={c} />
        </div>
      );
    case 'toc':
      return (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 24, color: c }}>Sommaire</div>
            <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${c}, transparent)`, marginTop: 8 }} />
          </div>
          {ctx.chapitres.slice(def.from, def.to).map((ch, i) => (
            <button key={i} onClick={e => { e.stopPropagation(); ctx.aller(ch.page); }}
              style={{ display: 'flex', alignItems: 'baseline', gap: 6, width: '100%', textAlign: 'left', background: 'none', border: 'none', borderBottom: `1px dotted ${c}55`, padding: '7px 0', cursor: 'pointer', fontFamily: BODY, fontSize: 16.5, color: INK, lineHeight: 1.3 }}>
              <span style={{ flex: 1 }}>{ch.titre}</span>
              <span style={{ fontFamily: MONO, fontSize: 12, color: c }}>{ch.page}</span>
            </button>
          ))}
        </div>
      );
    case 'end':
      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12 }}>
          <Ornement c={c} />
          <div style={{ fontFamily: DISPLAY, fontSize: 28, color: c, letterSpacing: '0.3em' }}>FIN</div>
          <div style={{ fontFamily: BODY, fontSize: 16, fontStyle: 'italic', color: SOFT }}>{cours.titre}</div>
          <div style={{ fontFamily: MONO, fontSize: 11.5, color: SOFT, letterSpacing: '0.2em' }}>DISPENSAIRE DE LITTLE CREEK · 1890</div>
          <Ornement c={c} />
        </div>
      );
    case 'content':
      return (
        <div>
          <div style={{ display: 'flex', justifyContent: pair ? 'flex-start' : 'flex-end', marginBottom: 6, fontFamily: MONO, fontSize: 10.5, color: SOFT, letterSpacing: '0.16em', opacity: 0.8 }}>
            {pair ? cours.kicker : cours.titre.toUpperCase()}
          </div>
          {def.atoms.map((ai, j) => <AtomView key={ai} a={ctx.atoms[ai]} c={c} first={j === 0} />)}
        </div>
      );
    default:
      return null;
  }
}

/* Une page du livre (feuille de parchemin avec numéro) */
function Feuille({ def, idx, side, w, h, ctx }: { def: PageDef | null; idx: number; side: 'left' | 'right'; w: number; h: number; ctx: Ctx }) {
  if (!def) return <div style={{ width: w, height: h }} />;
  const left = side === 'left';
  if (def.kind === 'cover') return <div style={{ position: 'relative', width: w, height: h }}><Cover cours={ctx.cours} /></div>;
  const numbered = def.kind === 'content' || def.kind === 'toc';
  return (
    <div style={{
      position: 'relative', width: w, height: h, overflow: 'hidden',
      background: left
        ? 'linear-gradient(to right, #f1e3c2 0%, #f6ebcf 70%, #e3d0a2 100%)'
        : 'linear-gradient(to right, #e3d0a2 0%, #f6ebcf 30%, #f1e3c2 100%)',
      borderRadius: left ? '6px 0 0 6px' : '0 6px 6px 0',
      boxShadow: left
        ? '-1px 0 0 #d9c698, -3px 0 0 #efe2c0, -4px 0 0 #cdb887, -6px 0 0 #ebdcb6, -7px 0 0 #bfa970, -10px 4px 16px rgba(0,0,0,0.45)'
        : '1px 0 0 #d9c698, 3px 0 0 #efe2c0, 4px 0 0 #cdb887, 6px 0 0 #ebdcb6, 7px 0 0 #bfa970, 10px 4px 16px rgba(0,0,0,0.45)',
    }}>
      {/* ombre de la reliure */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, ...(left ? { right: 0 } : { left: 0 }), width: '9%', background: `linear-gradient(to ${left ? 'left' : 'right'}, rgba(70,45,15,0.30), rgba(70,45,15,0.08) 55%, transparent)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: PAD_X, right: PAD_X, top: PAD_TOP, bottom: PAD_BOTTOM, overflow: 'hidden' }}>
        <PageBody def={def} idx={idx} ctx={ctx} />
      </div>
      {numbered && (
        <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, textAlign: 'center', fontFamily: DISPLAY, fontSize: 14, color: SOFT }}>— {idx} —</div>
      )}
    </div>
  );
}

/* ───────── Le livre ───────── */

export function Livre({ cours }: { cours: Cours }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const measRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, vh: 800 });
  const [fontTick, setFontTick] = useState(0);
  const [contenu, setContenu] = useState<number[][] | null>(null);
  const [pos, setPos] = useState(0);                       // page « de tête » : couverture, ou page de gauche de la double page
  const [flip, setFlip] = useState<null | { dir: 1 | -1; to: number; go: boolean }>(null);
  const [slide, setSlide] = useState<1 | -1>(1);
  const touchX = useRef<number | null>(null);

  const c = useMemo(() => shade(cours.c, 0.8), [cours.c]);
  const atoms = useMemo(() => atomes(cours.blocs), [cours.blocs]);

  /* dimensions */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const maj = () => setBox({ w: el.clientWidth, vh: window.innerHeight });
    maj();
    const ro = new ResizeObserver(maj);
    ro.observe(el);
    window.addEventListener('resize', maj);
    return () => { ro.disconnect(); window.removeEventListener('resize', maj); };
  }, []);
  useEffect(() => { document.fonts?.ready.then(() => setFontTick(t => t + 1)).catch(() => {}); }, []);

  const two = box.w >= 860;
  const bookW = two ? Math.min(box.w, 1180) : Math.min(box.w, 600);
  const pageW = two ? bookW / 2 : bookW;
  const hMax = Math.max(520, Math.min(box.vh - 250, 800));
  const H = Math.round(Math.max(480, Math.min(hMax, pageW * (two ? 1.5 : 1.7))));
  const innerW = Math.max(160, Math.floor(pageW - PAD_X * 2));
  const innerH = H - PAD_TOP - PAD_BOTTOM - 20;            // 20 px de marge pour l'en-tête courant

  /* pagination d'après la hauteur réelle du texte */
  useLayoutEffect(() => {
    if (!box.w || !measRef.current) return;
    const hs = Array.from(measRef.current.children).map(k => (k as HTMLElement).getBoundingClientRect().height);
    setContenu(paginer(atoms, hs, innerH));
  }, [atoms, innerW, innerH, box.w, fontTick]);

  const chapitresAtomes = useMemo(() => atoms.map((a, i) => ({ a, i })).filter(x => x.a.k === 'h1'), [atoms]);
  const capacite = Math.max(6, Math.floor((innerH - 70) / 40));
  const nbToc = chapitresAtomes.length ? Math.ceil(chapitresAtomes.length / capacite) : 0;

  const pages = useMemo<PageDef[]>(() => {
    if (!contenu) return [];
    const p: PageDef[] = [{ kind: 'cover' }, { kind: 'title' }];
    for (let i = 0; i < nbToc; i++) p.push({ kind: 'toc', from: i * capacite, to: (i + 1) * capacite });
    contenu.forEach(atomsDePage => p.push({ kind: 'content', atoms: atomsDePage }));
    p.push({ kind: 'end' });
    if ((p.length - 1) % 2 === 1) p.push({ kind: 'blank' });
    return p;
  }, [contenu, nbToc, capacite]);

  const chapitres = useMemo(() => {
    if (!contenu) return [];
    const debut = 2 + nbToc;
    return chapitresAtomes.map(({ a, i }) => ({ titre: (a as { x: string }).x, page: debut + Math.max(0, contenu.findIndex(pg => pg.includes(i))) }));
  }, [contenu, chapitresAtomes, nbToc]);

  /* navigation */
  const visibles = useMemo(() => (two ? pages : pages.filter(p => p.kind !== 'blank')), [two, pages]);
  const nbSpreads = Math.ceil((pages.length - 1) / 2) + 1;
  const spread = pos === 0 ? 0 : Math.ceil(pos / 2);
  const posDeSpread = (s: number) => (s === 0 ? 0 : 2 * s - 1);
  const reduit = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const tourner = useCallback((dir: 1 | -1) => {
    if (!pages.length) return;
    if (two) {
      if (flip) return;
      const to = spread + dir;
      if (to < 0 || to >= nbSpreads) return;
      if (reduit) { setPos(posDeSpread(to)); return; }
      setFlip({ dir, to, go: false });
    } else {
      setSlide(dir);
      setPos(p => Math.max(0, Math.min(visibles.length - 1, p + dir)));
    }
  }, [pages.length, two, flip, spread, nbSpreads, reduit, visibles.length]);

  const aller = useCallback((page: number) => {
    if (!pages.length) return;
    if (two) {
      const to = page === 0 ? 0 : Math.ceil(page / 2);
      if (to === spread) return;
      if (flip) return;
      if (reduit) { setPos(posDeSpread(to)); return; }
      setFlip({ dir: to > spread ? 1 : -1, to, go: false });
    } else {
      setSlide(page >= pos ? 1 : -1);
      setPos(Math.max(0, Math.min(visibles.length - 1, page)));
    }
  }, [pages.length, two, spread, flip, reduit, pos, visibles.length]);

  /* déroulement de l'animation de page */
  useEffect(() => {
    if (!flip) return;
    if (!flip.go) {
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setFlip(f => (f ? { ...f, go: true } : f))));
      return () => cancelAnimationFrame(id);
    }
    const t = setTimeout(() => { setPos(posDeSpread(flip.to)); setFlip(null); }, DUR + 40);
    return () => clearTimeout(t);
  }, [flip]);

  /* quand on change de mode d'affichage ou de pagination, rester dans les bornes */
  useEffect(() => {
    if (!pages.length) return;
    setFlip(null);
    setPos(p => Math.max(0, Math.min(two ? pages.length - 1 : visibles.length - 1, p)));
  }, [two, pages.length, visibles.length]);

  /* clavier */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { tourner(1); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { tourner(-1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tourner]);

  const ctx: Ctx = { cours, c, atoms, chapitres, aller, total: pages.length };
  const L = (s: number): number | null => (s === 0 ? null : 2 * s - 1 < pages.length ? 2 * s - 1 : null);
  const R = (s: number): number | null => (s === 0 ? 0 : 2 * s < pages.length ? 2 * s : null);
  const def = (i: number | null): PageDef | null => (i === null ? null : pages[i] ?? null);

  const cible = flip ? flip.to : spread;
  const decale = two && cible === 0;

  /* contenu des deux demi-pages fixes et de la feuille qui tourne */
  let gauche: number | null, droite: number | null, avant: number | null = null, arriere: number | null = null;
  if (flip && flip.dir === 1) { gauche = L(spread); droite = R(flip.to); avant = R(spread); arriere = L(flip.to); }
  else if (flip) { gauche = L(flip.to); droite = R(spread); avant = R(flip.to); arriere = L(spread); }
  else { gauche = L(spread); droite = R(spread); }

  const surClicDroite = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a')) return;
    tourner(1);
  };
  const surClicGauche = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a')) return;
    tourner(-1);
  };

  const info = !pages.length ? '' : two
    ? (spread === 0 ? 'Couverture' : `Pages ${L(spread) ?? ''}${R(spread) !== null && pages[R(spread) as number]?.kind !== 'blank' ? ` – ${R(spread)}` : ''} sur ${pages.length - (pages[pages.length - 1].kind === 'blank' ? 2 : 1)}`)
    : (pos === 0 ? 'Couverture' : `Page ${pos} sur ${visibles.length - 1}`);

  const premier = two ? spread === 0 : pos === 0;
  const dernier = two ? spread >= nbSpreads - 1 : pos >= visibles.length - 1;

  return (
    <div ref={wrapRef} style={{ width: '100%', userSelect: 'none' }}>
      <style>{`
        @keyframes bk-in-next { from { opacity: 0; transform: translateX(34px) } to { opacity: 1; transform: none } }
        @keyframes bk-in-prev { from { opacity: 0; transform: translateX(-34px) } to { opacity: 1; transform: none } }
        .bk-ctrl { font-family: Libre Baskerville, Courier New, monospace; font-size: 13px; letter-spacing: 0.12em; padding: 9px 18px; cursor: pointer; background: rgba(0,0,0,0.3); color: #EADCB9; border: 1px solid rgba(209,183,124,0.45); }
        .bk-ctrl:hover:not(:disabled) { background: rgba(209,183,124,0.14); }
        .bk-ctrl:disabled { opacity: 0.35; cursor: default; }
      `}</style>

      {/* mesure (invisible) */}
      <div ref={measRef} aria-hidden style={{ position: 'absolute', left: -99999, top: 0, width: innerW, visibility: 'hidden', pointerEvents: 'none' }}>
        {atoms.map((a, i) => <div key={i}><AtomView a={a} c={c} /></div>)}
      </div>

      {!pages.length ? (
        <div style={{ textAlign: 'center', padding: 60, fontFamily: MONO, fontSize: 14, color: '#C8BEA5' }}>⟳ MISE EN PAGE DU LIVRE…</div>
      ) : (
        <>
          {/* table de lecture */}
          <div style={{ padding: '34px 0 26px', background: 'radial-gradient(ellipse at 50% 40%, #3a2a1a 0%, #20150c 70%, #150d07 100%)', border: '1px solid rgba(139,90,43,0.45)', overflow: 'hidden' }}>
            <div
              onTouchStart={e => { touchX.current = e.touches[0].clientX; }}
              onTouchEnd={e => {
                if (touchX.current === null) return;
                const dx = e.changedTouches[0].clientX - touchX.current;
                touchX.current = null;
                if (dx < -50) tourner(1); else if (dx > 50) tourner(-1);
              }}
              style={{ width: bookW, margin: '0 auto', height: H, position: 'relative', perspective: 2600, transform: decale ? `translateX(${-bookW / 4}px)` : 'none', transition: two ? `transform ${DUR - 120}ms ease-in-out` : 'none' }}>
              {two ? (
                <>
                  <div style={{ position: 'absolute', left: 0, top: 0, cursor: premier ? 'default' : 'w-resize' }} onClick={surClicGauche}>
                    <Feuille def={def(gauche)} idx={gauche ?? 0} side="left" w={pageW} h={H} ctx={ctx} />
                  </div>
                  <div style={{ position: 'absolute', left: pageW, top: 0, cursor: dernier ? 'default' : 'e-resize' }} onClick={surClicDroite}>
                    <Feuille def={def(droite)} idx={droite ?? 0} side="right" w={pageW} h={H} ctx={ctx} />
                  </div>
                  {flip && (
                    <div style={{
                      position: 'absolute', left: pageW, top: 0, width: pageW, height: H, transformStyle: 'preserve-3d', transformOrigin: 'left center', zIndex: 5,
                      transform: `rotateY(${flip.dir === 1 ? (flip.go ? -180 : 0) : (flip.go ? 0 : -180)}deg)`,
                      transition: flip.go ? `transform ${DUR}ms ease-in-out` : 'none',
                    }}>
                      <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                        <Feuille def={def(avant)} idx={avant ?? 0} side="right" w={pageW} h={H} ctx={ctx} />
                      </div>
                      <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                        <Feuille def={def(arriere)} idx={arriere ?? 0} side="left" w={pageW} h={H} ctx={ctx} />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div key={pos} style={{ position: 'absolute', inset: 0, animation: `${slide === 1 ? 'bk-in-next' : 'bk-in-prev'} 320ms ease-out` }}
                  onClick={e => { if ((e.target as HTMLElement).closest('button, a')) return; const r = e.currentTarget.getBoundingClientRect(); tourner(e.clientX - r.left > r.width * 0.4 ? 1 : -1); }}>
                  <Feuille def={visibles[pos] ?? null} idx={pos} side="right" w={pageW} h={H} ctx={ctx} />
                </div>
              )}
            </div>
          </div>

          {/* commandes */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            <button className="bk-ctrl" onClick={() => tourner(-1)} disabled={premier || !!flip}>‹ PAGE PRÉCÉDENTE</button>
            {nbToc > 0 && <button className="bk-ctrl" onClick={() => aller(2)} disabled={!!flip}>📑 SOMMAIRE</button>}
            <span style={{ fontFamily: MONO, fontSize: 12.5, color: '#C8BEA5', letterSpacing: '0.1em', minWidth: 150, textAlign: 'center' }}>{info}</span>
            <button className="bk-ctrl" onClick={() => tourner(1)} disabled={dernier || !!flip}>PAGE SUIVANTE ›</button>
          </div>
          <div style={{ textAlign: 'center', marginTop: 8, fontFamily: MONO, fontSize: 11.5, color: '#C8BEA5', opacity: 0.7, letterSpacing: '0.08em' }}>
            Cliquez sur une page, utilisez les flèches ← → du clavier ou balayez pour tourner les pages
          </div>
        </>
      )}
    </div>
  );
}
