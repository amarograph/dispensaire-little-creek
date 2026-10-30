'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRedmSession } from '@/app/redm/_components/RedmSessionProvider';
import { ImageViewer } from '@/app/redm/_components/ImageViewer';
import { isAdmin as checkIsAdmin } from '@/lib/permissions';

const DISPLAY = "'Central Station', 'Georgia', serif";
const BODY    = "'Cormorant Garamond', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";
const T = { bg: '#102B3B', card: '#183746', border: 'rgba(139,90,43,0.30)', gold: '#D1B77C', text: '#EADCB9', muted: '#C8BEA5', dim: '#C8BEA5' };
const OK = '#A8B991', KO = '#DF9A88';

interface Enigme { titre: string; date: string; enonce: string; reponse: string; groupe?: string; }
interface Affiche { id: string; titre: string; url: string; createdAt: string; auteur: string; }
interface Recompense { id: string; rang: string; titre: string; description: string; gagnant: string; }
interface Participant { id: string; prenom: string; nom: string; notes: string; reponses: (boolean | null)[]; reponsesBonus?: (boolean | null)[]; createdAt: string; auteur: string; }
interface Evenement { id: string; nom: string; icon: string; description: string; couleur: string; visible?: boolean; enigmes: Enigme[]; bonus?: Enigme[]; recompenses?: Recompense[]; affiches: Affiche[]; participants: Participant[]; }

const ROMAINS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
function romain(i: number) { return ROMAINS[i] ?? String(i + 1); }
function versIndex(jeton: string, total: number): number {
  const t = jeton.trim().toUpperCase();
  if (/^FINALE?$/.test(t)) return total - 1;
  const r = ROMAINS.indexOf(t);
  if (r >= 0) return r;
  const d = parseInt(t, 10);
  return isNaN(d) ? -1 : d - 1;
}

/* Reconnaît un texte du type :
   « 25 octobre — Énigme I / La visiteuse de minuit / « énoncé » / Réponse : Un fantôme. » (une ou plusieurs énigmes) */
function analyserEnigmes(texte: string, actuelles: Enigme[]): { liste: Enigme[]; nb: number } {
  const liste = actuelles.map(x => ({ ...x }));
  type Bloc = { idx: number; date: string; titre: string; enonce: string[]; reponse: string; etat: 'titre' | 'enonce' | 'reponse' };
  const blocs: Bloc[] = [];
  let cur: Bloc | null = null;
  for (const brut of texte.replace(/\r/g, '').split('\n')) {
    const l = brut.trim();
    const h = l.match(/^(?:\d+\s*[.)]\s*)?(.*?)[—–-]+\s*[ÉEé]nigme\s+(\S+)\s*$/i);
    if (h) { cur = { idx: versIndex(h[2], liste.length), date: h[1].trim(), titre: '', enonce: [], reponse: '', etat: 'titre' }; blocs.push(cur); continue; }
    if (!cur || !l) continue;
    if (/^r[ée]ponse\s*:/i.test(l)) { cur.etat = 'reponse'; cur.reponse = l.replace(/^r[ée]ponse\s*:\s*/i, ''); continue; }
    if (cur.etat === 'titre') { cur.titre = l; cur.etat = 'enonce'; }
    else if (cur.etat === 'enonce') cur.enonce.push(l);
    else cur.reponse += ' ' + l;
  }
  let nb = 0;
  for (const b of blocs) {
    if (b.idx < 0 || b.idx >= liste.length) continue;
    liste[b.idx] = {
      titre: b.titre, date: b.date,
      enonce: b.enonce.join(' ').replace(/^[«"“\s]+|[»"”\s]+$/g, ''),
      reponse: b.reponse.trim(),
    };
    nb++;
  }
  return { liste, nb };
}

const inp: React.CSSProperties = { fontFamily: MONO, fontSize: 15, background: 'rgba(0,0,0,0.28)', border: `1px solid ${T.border}`, color: T.text, padding: '10px 14px', outline: 'none', boxSizing: 'border-box', width: '100%' };
const lbl: React.CSSProperties = { fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.12em', marginBottom: 6, display: 'block' };

/* Redimensionne l'image choisie (max 2400 px) et la convertit en JPEG avant l'envoi */
function fichierVersDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 2400 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image illisible')); };
    img.src = url;
  });
}

function stats(p: Participant, n: number) {
  const reps = Array.from({ length: n }, (_, i) => p.reponses[i] ?? null);
  const bonnes = reps.filter(r => r === true).length;
  const fausses = reps.filter(r => r === false).length;
  return { reps, bonnes, fausses, repondues: bonnes + fausses };
}

/* Énigmes de départage : celles d'un même groupe (ex. 7.2 / 8.2) ne comptent qu'une fois — la première notée */
function creneauxBonus(bonus: Enigme[]): number[][] {
  const out: number[][] = [];
  const groupes = new Map<string, number[]>();
  bonus.forEach((b, i) => {
    if (!b.groupe) { out.push([i]); return; }
    const g = groupes.get(b.groupe);
    if (g) g.push(i); else { const a = [i]; groupes.set(b.groupe, a); out.push(a); }
  });
  return out;
}
function statsBonus(p: Participant, bonus: Enigme[]) {
  const creneaux = creneauxBonus(bonus);
  let bonnes = 0, fausses = 0;
  for (const c of creneaux) {
    const i = c.find(k => (p.reponsesBonus?.[k] ?? null) !== null);
    if (i === undefined) continue;
    if (p.reponsesBonus![i]) bonnes++; else fausses++;
  }
  return { total: creneaux.length, bonnes, fausses, repondues: bonnes + fausses };
}

export default function EvenementPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { roles } = useRedmSession();
  const canStructure = checkIsAdmin(roles) || roles.some((r: string) => ['redm_directeur', 'redm_co_directeur'].includes(r));
  const canRegistre = !(roles.length > 0 && roles.every((r: string) => r === 'redm_preparateur_caisse'));

  const [ev, setEv]           = useState<Evenement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [tab, setTab]         = useState<'affiches' | 'registre' | 'recompenses'>('affiches');
  const [editR, setEditR]     = useState<{ id?: string; rang: string; titre: string; description: string; gagnant: string } | null>(null);
  const [delR, setDelR]       = useState<string | null>(null);
  const [editBonus, setEditBonus] = useState<Enigme[]>([]);

  /* Affiches */
  const fileRef = useRef<HTMLInputElement>(null);
  const [envoi, setEnvoi]     = useState('');
  const [viewer, setViewer]   = useState<number | null>(null);
  const [delAffiche, setDelAffiche] = useState<string | null>(null);

  /* Registre */
  const [search, setSearch]   = useState('');
  const [tri, setTri]         = useState<'score' | 'nom' | 'recent'>('recent');
  const [nouveau, setNouveau] = useState<{ prenom: string; nom: string } | null>(null);
  const [editP, setEditP]     = useState<{ id: string; prenom: string; nom: string; notes: string } | null>(null);
  const [delP, setDelP]       = useState<string | null>(null);
  const [editEnigmes, setEditEnigmes] = useState<Enigme[] | null>(null);
  const [collage, setCollage] = useState('');
  const [infoCollage, setInfoCollage] = useState('');
  const [voirEnigmes, setVoirEnigmes] = useState(false);
  const [reponsesVisibles, setReponsesVisibles] = useState<Set<number>>(new Set());
  const [saving, setSaving]   = useState(false);

  async function recharger() {
    try {
      const r = await fetch('/api/redm/evenements');
      if (!r.ok) throw new Error();
      const d = await r.json();
      setEv((d.evenements as Evenement[]).find(e => e.id === id) ?? null);
    } catch { setError('Impossible de charger le dossier.'); }
  }

  useEffect(() => { recharger().finally(() => setLoading(false)); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  async function appeler(payload: object): Promise<boolean> {
    setError('');
    try {
      const r = await fetch('/api/redm/evenements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...payload }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setError(d.error ?? `Erreur ${r.status}`); return false; }
      const e = (d.evenements as Evenement[]).find(x => x.id === id);
      if (e) setEv(e);
      return true;
    } catch { setError('Erreur réseau.'); return false; }
  }

  /* Résultat d'une énigme : un clic sur ✔ / ✕ l'enregistre, un second clic sur le même bouton le remet à « pas répondue » */
  async function noter(p: Participant, index: number, valeur: boolean) {
    if (!ev) return;
    const actuelle = p.reponses[index] ?? null;
    const nouvelle = actuelle === valeur ? null : valeur;
    setEv({ ...ev, participants: ev.participants.map(x => x.id !== p.id ? x : { ...x, reponses: ev.enigmes.map((_, i) => i === index ? nouvelle : (x.reponses[i] ?? null)) }) });
    const ok = await appeler({ action: 'set_reponse', participantId: p.id, index, valeur: nouvelle });
    if (!ok) await recharger();
  }

  /* Énigmes de départage — même principe ; le serveur refuse si l'autre énigme du groupe est déjà notée */
  async function noterBonus(p: Participant, index: number, valeur: boolean) {
    if (!ev) return;
    const bonus = ev.bonus ?? [];
    const actuelle = p.reponsesBonus?.[index] ?? null;
    const nouvelle = actuelle === valeur ? null : valeur;
    setEv({ ...ev, participants: ev.participants.map(x => x.id !== p.id ? x : { ...x, reponsesBonus: bonus.map((_, i) => i === index ? nouvelle : (x.reponsesBonus?.[i] ?? null)) }) });
    const ok = await appeler({ action: 'set_reponse_bonus', participantId: p.id, index, valeur: nouvelle });
    if (!ok) await recharger();
  }

  async function ajouterAffiches(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError('');
    for (let i = 0; i < files.length; i++) {
      setEnvoi(`Envoi de l'affiche ${i + 1} / ${files.length}…`);
      try {
        const dataUrl = await fichierVersDataUrl(files[i]);
        const ok = await appeler({ action: 'add_affiche', titre: files[i].name.replace(/\.[^.]+$/, ''), imageDataUrl: dataUrl });
        if (!ok) break;
      } catch { setError('Image illisible : ' + files[i].name); break; }
    }
    setEnvoi('');
    if (fileRef.current) fileRef.current.value = '';
  }

  const n = ev?.enigmes.length ?? 7;
  const bonusListe = useMemo(() => ev?.bonus ?? [], [ev]);
  const liste = useMemo(() => {
    if (!ev) return [];
    const q = search.trim().toLowerCase();
    const l = ev.participants.filter(p => !q || `${p.prenom} ${p.nom}`.toLowerCase().includes(q));
    if (tri === 'score') l.sort((a, b) => stats(b, n).bonnes - stats(a, n).bonnes || statsBonus(b, bonusListe).bonnes - statsBonus(a, bonusListe).bonnes || stats(b, n).repondues - stats(a, n).repondues);
    else if (tri === 'nom') l.sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, 'fr'));
    else l.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    return l;
  }, [ev, search, tri, n, bonusListe]);

  const resume = useMemo(() => {
    if (!ev) return { total: 0, enJeu: 0, parfaits: 0, moyenne: 0 };
    const st = ev.participants.map(p => stats(p, n));
    const enJeu = st.filter(s => s.repondues > 0).length;
    return { total: ev.participants.length, enJeu, parfaits: st.filter(s => s.bonnes === n).length, moyenne: enJeu ? Math.round(st.filter(s => s.repondues > 0).reduce((a, s) => a + s.bonnes, 0) / enJeu * 10) / 10 : 0 };
  }, [ev, n]);

  const egalite = resume.parfaits >= 2 && bonusListe.length > 0;
  const col = ev?.couleur || '#E8A04C';
  const petit: React.CSSProperties = { fontFamily: MONO, fontSize: 14, padding: '6px 11px', cursor: 'pointer' };

  if (loading) return <div style={{ fontFamily: MONO, color: T.dim, padding: 60, textAlign: 'center' }}>⟳ CHARGEMENT...</div>;
  if (!ev) return (
    <div style={{ fontFamily: BODY, padding: 40, textAlign: 'center' }}>
      <div style={{ fontFamily: MONO, fontSize: 15, color: T.dim }}>{error || 'Dossier introuvable.'}</div>
      <button onClick={() => router.push('/redm/evenements')} style={{ marginTop: 20, fontFamily: MONO, fontSize: 14, padding: '10px 22px', cursor: 'pointer', background: 'transparent', color: T.muted, border: `1px solid ${T.border}` }}>← RETOUR</button>
    </div>
  );

  return (
    <div style={{ fontFamily: BODY }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');`}</style>

      <div style={{ marginBottom: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/redm/evenements')} style={{ fontFamily: MONO, fontSize: 15, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '8px 18px', cursor: 'pointer', letterSpacing: '0.1em' }}>← RETOUR</button>
          <span style={{ fontFamily: MONO, fontSize: 14, color: col, letterSpacing: '0.16em' }}>DISPENSAIRE · ÉVÈNEMENTS · {ev.nom.toUpperCase()}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: DISPLAY, fontSize: 40, color: col, margin: 0 }}>{ev.icon} {ev.nom}</h1>
          {canStructure && (
            <button onClick={() => appeler({ action: 'set_visible', visible: ev.visible === false })}
              title={ev.visible === false ? 'Réservé à la direction — cliquer pour montrer à tout le monde' : 'Visible par tout le monde — cliquer pour réserver à la direction'}
              style={{ fontFamily: MONO, fontSize: 13, letterSpacing: '0.06em', padding: '8px 16px', cursor: 'pointer', background: ev.visible === false ? 'rgba(200,80,80,0.12)' : 'rgba(168,185,145,0.12)', color: ev.visible === false ? KO : OK, border: `1px solid ${ev.visible === false ? 'rgba(223,154,136,0.5)' : 'rgba(168,185,145,0.5)'}` }}>
              {ev.visible === false ? '🔒 RÉSERVÉ À LA DIRECTION — MONTRER À TOUS' : '👁 VISIBLE PAR TOUS — RÉSERVER À LA DIRECTION'}
            </button>
          )}
        </div>
        {ev.description && <p style={{ fontFamily: BODY, fontSize: 18, color: T.dim, marginTop: 8, maxWidth: 900 }}>{ev.description}</p>}
      </div>

      {error && <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(200,80,80,0.10)', border: '1px solid rgba(200,80,80,0.35)', color: KO, fontFamily: MONO, fontSize: 14, display: 'flex', justifyContent: 'space-between' }}><span>⚠ {error}</span><button onClick={() => setError('')} style={{ background: 'transparent', border: 'none', color: T.muted, cursor: 'pointer' }}>✕</button></div>}

      {/* Onglets */}
      <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 24, borderBottom: `1px solid ${T.border}` }}>
        {([['affiches', `🖼 AFFICHES (${ev.affiches.length})`], ['registre', `👥 REGISTRE DES PARTICIPANTS (${ev.participants.length})`], ['recompenses', `🏆 RÉCOMPENSES / PRIX (${(ev.recompenses ?? []).length})`]] as const).map(([k, label]) => {
          const on = tab === k;
          return <button key={k} onClick={() => setTab(k)} style={{ fontFamily: MONO, fontSize: 15, letterSpacing: '0.08em', padding: '13px 28px', cursor: 'pointer', background: on ? `${col}18` : 'transparent', color: on ? col : T.dim, border: 'none', borderBottom: `3px solid ${on ? col : 'transparent'}` }}>{label}</button>;
        })}
      </div>

      {/* ═══════════ AFFICHES ═══════════ */}
      {tab === 'affiches' && (
        <div>
          {canStructure && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => ajouterAffiches(e.target.files)} />
              <button onClick={() => fileRef.current?.click()} disabled={!!envoi}
                style={{ fontFamily: MONO, fontSize: 15, letterSpacing: '0.12em', padding: '12px 26px', cursor: 'pointer', background: `${col}22`, color: col, border: `2px solid ${col}70`, opacity: envoi ? 0.6 : 1 }}>
                ✚ AJOUTER DES AFFICHES
              </button>
              <span style={{ fontFamily: MONO, fontSize: 13, color: T.dim }}>{envoi || 'Plusieurs images à la fois possible · JPG, PNG, WebP'}</span>
            </div>
          )}
          {ev.affiches.length === 0 ? (
            <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, padding: '70px 20px', textAlign: 'center', border: `1px dashed ${T.border}` }}>
              {canStructure ? 'Aucune affiche pour le moment — déposez les affiches graphiques de l’évènement avec « Ajouter des affiches ».' : 'Aucune affiche pour le moment.'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
              {ev.affiches.map((a, i) => (
                <div key={a.id} style={{ background: T.card, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                  <div onClick={() => setViewer(i)} style={{ height: 320, background: '#0c2230', cursor: 'zoom-in', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.url} alt={a.titre} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: DISPLAY, fontSize: 17, color: T.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.titre}</span>
                    {canStructure && (delAffiche === a.id ? (
                      <>
                        <button onClick={() => { setDelAffiche(null); appeler({ action: 'delete_affiche', afficheId: a.id }); }} style={{ ...petit, fontSize: 13, background: '#8B404025', color: KO, border: '1px solid #8B404060' }}>SUPPRIMER ?</button>
                        <button onClick={() => setDelAffiche(null)} style={{ ...petit, fontSize: 13, background: 'transparent', color: T.dim, border: `1px solid ${T.border}` }}>✕</button>
                      </>
                    ) : (
                      <>
                        <button title="Renommer" onClick={() => { const t = window.prompt('Nom de l’affiche :', a.titre); if (t && t.trim()) appeler({ action: 'rename_affiche', afficheId: a.id, titre: t }); }} style={{ ...petit, fontSize: 13, background: 'rgba(209,183,124,0.10)', color: T.gold, border: '1px solid rgba(209,183,124,0.3)' }}>✎</button>
                        <button title="Supprimer" onClick={() => setDelAffiche(a.id)} style={{ ...petit, fontSize: 13, background: 'transparent', color: '#8B6060', border: '1px solid rgba(139,64,64,0.3)' }}>✕</button>
                      </>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {viewer !== null && <ImageViewer images={ev.affiches.map(a => ({ id: a.id, src: a.url, titre: a.titre }))} index={viewer} onClose={() => setViewer(null)} accent={col} />}
        </div>
      )}

      {/* ═══════════ RÉCOMPENSES / PRIX ═══════════ */}
      {tab === 'recompenses' && (
        <div>
          {canStructure && (
            <div style={{ marginBottom: 20 }}>
              <button onClick={() => setEditR({ rang: '', titre: '', description: '', gagnant: '' })}
                style={{ fontFamily: MONO, fontSize: 15, letterSpacing: '0.12em', padding: '12px 26px', cursor: 'pointer', background: `${col}22`, color: col, border: `2px solid ${col}70` }}>
                ✚ AJOUTER UN PRIX
              </button>
            </div>
          )}
          {(ev.recompenses ?? []).length === 0 ? (
            <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, padding: '70px 20px', textAlign: 'center', border: `1px dashed ${T.border}` }}>
              {canStructure ? 'Aucun prix pour le moment — ajoutez les récompenses de l’évènement avec « Ajouter un prix ».' : 'Aucune récompense annoncée pour le moment.'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
              {(ev.recompenses ?? []).map(r => (
                <div key={r.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderTop: `4px solid ${col}`, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {r.rang && <div style={{ fontFamily: MONO, fontSize: 13, color: col, letterSpacing: '0.12em' }}>🏆 {r.rang.toUpperCase()}</div>}
                  <div style={{ fontFamily: DISPLAY, fontSize: 26, color: T.text }}>{r.titre}</div>
                  {r.description && <div style={{ fontFamily: BODY, fontSize: 17, color: T.muted, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{r.description}</div>}
                  {r.gagnant && <div style={{ fontFamily: MONO, fontSize: 14, color: OK, marginTop: 6 }}>🏅 Gagnant : <b>{r.gagnant}</b></div>}
                  {canStructure && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
                      {delR === r.id ? (
                        <>
                          <button onClick={() => { setDelR(null); appeler({ action: 'delete_recompense', recompenseId: r.id }); }} style={{ ...petit, fontSize: 13, background: '#8B404025', color: KO, border: '1px solid #8B404060' }}>SUPPRIMER ?</button>
                          <button onClick={() => setDelR(null)} style={{ ...petit, fontSize: 13, background: 'transparent', color: T.dim, border: `1px solid ${T.border}` }}>✕</button>
                        </>
                      ) : (
                        <>
                          <button title="Modifier" onClick={() => setEditR({ id: r.id, rang: r.rang, titre: r.titre, description: r.description, gagnant: r.gagnant })} style={{ ...petit, fontSize: 13, background: 'rgba(209,183,124,0.10)', color: T.gold, border: '1px solid rgba(209,183,124,0.3)' }}>✎</button>
                          <button title="Supprimer" onClick={() => setDelR(r.id)} style={{ ...petit, fontSize: 13, background: 'transparent', color: '#8B6060', border: '1px solid rgba(139,64,64,0.3)' }}>✕</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════ REGISTRE ═══════════ */}
      {tab === 'registre' && (
        <div>
          {/* Récap */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 20 }}>
            {[
              { l: 'PARTICIPANTS', v: String(resume.total), c: col },
              { l: 'ONT JOUÉ', v: String(resume.enJeu), c: T.gold },
              { l: `SCORE PARFAIT (${n}/${n})`, v: String(resume.parfaits), c: OK },
              { l: `MOYENNE DE BONNES`, v: `${resume.moyenne} / ${n}`, c: T.text },
            ].map(s => (
              <div key={s.l} style={{ background: T.card, border: `1px solid ${T.border}`, padding: '12px 16px', textAlign: 'center' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 26, color: s.c }}>{s.v}</div>
                <div style={{ fontFamily: MONO, fontSize: 12, color: T.dim, marginTop: 3, letterSpacing: '0.08em' }}>{s.l}</div>
              </div>
            ))}
          </div>

          {egalite && (
            <div style={{ marginBottom: 18, padding: '12px 18px', background: `${col}14`, border: `2px solid ${col}70`, fontFamily: MONO, fontSize: 14, color: T.text, lineHeight: 1.6 }}>
              ⚖ <b style={{ color: col }}>ÉGALITÉ À {n}/{n}</b> — {resume.parfaits} participants ont tout bon : les énigmes de départage s&apos;affichent sur leurs fiches.
            </div>
          )}

          {/* Barre d'outils */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
            <input style={{ ...inp, flex: 1, minWidth: 220 }} placeholder="🔍 Rechercher un participant…" value={search} onChange={e => setSearch(e.target.value)} />
            <select style={{ ...inp, width: 210, cursor: 'pointer' }} value={tri} onChange={e => setTri(e.target.value as typeof tri)}>
              <option value="recent">Plus récents d&apos;abord</option>
              <option value="score">Classement (meilleur score)</option>
              <option value="nom">Ordre alphabétique</option>
            </select>
            {canStructure && <button onClick={() => { setCollage(''); setInfoCollage(''); setEditBonus((ev.bonus ?? []).map(x => ({ ...x }))); setEditEnigmes(ev.enigmes.map(x => ({ ...x }))); }} style={{ fontFamily: MONO, fontSize: 14, padding: '10px 18px', cursor: 'pointer', background: 'transparent', color: T.muted, border: `1px solid ${T.border}` }}>🧩 ÉDITER LES ÉNIGMES</button>}
            {canRegistre && <button onClick={() => setNouveau({ prenom: '', nom: '' })} style={{ fontFamily: MONO, fontSize: 15, letterSpacing: '0.1em', padding: '10px 24px', cursor: 'pointer', background: `${col}22`, color: col, border: `2px solid ${col}70` }}>✚ NOUVELLE FICHE</button>}
          </div>

          {/* Création rapide d'une fiche */}
          {nouveau && (
            <div style={{ background: T.card, border: `2px solid ${col}70`, padding: '16px 20px', marginBottom: 18, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}><label style={lbl}>PRÉNOM</label><input style={inp} autoFocus value={nouveau.prenom} onChange={e => setNouveau({ ...nouveau, prenom: e.target.value })} /></div>
              <div style={{ flex: 1, minWidth: 200 }}><label style={lbl}>NOM</label><input style={inp} value={nouveau.nom} onChange={e => setNouveau({ ...nouveau, nom: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter' && (nouveau.prenom.trim() || nouveau.nom.trim())) { appeler({ action: 'add_participant', ...nouveau }); setNouveau(null); } }} /></div>
              <button disabled={!nouveau.prenom.trim() && !nouveau.nom.trim()} onClick={async () => { const ok = await appeler({ action: 'add_participant', ...nouveau }); if (ok) setNouveau(null); }}
                style={{ fontFamily: MONO, fontSize: 15, padding: '11px 26px', cursor: 'pointer', background: `${col}28`, color: col, border: `2px solid ${col}70`, opacity: !nouveau.prenom.trim() && !nouveau.nom.trim() ? 0.5 : 1 }}>✔ CRÉER LA FICHE</button>
              <button onClick={() => setNouveau(null)} style={{ fontFamily: MONO, fontSize: 14, padding: '11px 18px', cursor: 'pointer', background: 'transparent', color: T.muted, border: `1px solid ${T.border}` }}>ANNULER</button>
            </div>
          )}

          {/* Énigmes et réponses (pour juger : ✔ bonne / ✕ fausse) — réponses masquées tant qu'on ne clique pas */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, marginBottom: 18 }}>
            <div onClick={() => setVoirEnigmes(v => !v)} style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <span style={{ fontFamily: DISPLAY, fontSize: 20, color: T.text }}>📜 Les énigmes et leurs réponses</span>
              <span style={{ fontFamily: MONO, fontSize: 14, color: T.dim }}>{voirEnigmes ? '▲ MASQUER' : '▼ AFFICHER'}</span>
            </div>
            {voirEnigmes && (
              <div style={{ borderTop: `1px solid ${T.border}`, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <button onClick={() => setReponsesVisibles(rv => rv.size === n + bonusListe.length ? new Set() : new Set(Array.from({ length: n + bonusListe.length }, (_, i) => i)))}
                    style={{ fontFamily: MONO, fontSize: 13, padding: '6px 12px', cursor: 'pointer', background: 'transparent', color: T.muted, border: `1px solid ${T.border}` }}>
                    {reponsesVisibles.size === n + bonusListe.length ? '🙈 MASQUER TOUTES LES RÉPONSES' : '👁 AFFICHER TOUTES LES RÉPONSES'}
                  </button>
                </div>
                {[...ev.enigmes.map((en, i) => ({ en, cle: i, label: `${en.date ? `${en.date} — ` : ''}${i === n - 1 ? 'ÉNIGME FINALE' : `ÉNIGME ${romain(i)}`}`, depart: false })),
                  ...bonusListe.map((en, i) => ({ en, cle: n + i, label: `DÉPARTAGE — ÉNIGME ${i + 1}.2${en.groupe ? ' (une seule des deux compte)' : ''}`, depart: true }))].map(({ en, cle, label, depart }) => {
                  const vue = reponsesVisibles.has(cle);
                  return (
                    <div key={cle} style={{ borderLeft: `3px solid ${depart ? KO : col}`, paddingLeft: 14 }}>
                      <div style={{ fontFamily: MONO, fontSize: 13, color: depart ? KO : col, letterSpacing: '0.08em' }}>{label}</div>
                      {en.enonce && <div style={{ fontFamily: BODY, fontSize: 17, color: T.muted, fontStyle: 'italic', lineHeight: 1.55, whiteSpace: 'pre-line', marginTop: 3 }}>« {en.enonce} »</div>}
                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button onClick={() => setReponsesVisibles(rv => { const s = new Set(rv); if (s.has(cle)) s.delete(cle); else s.add(cle); return s; })}
                          style={{ fontFamily: MONO, fontSize: 13, padding: '4px 10px', cursor: 'pointer', background: 'transparent', color: OK, border: '1px solid rgba(168,185,145,0.4)' }}>{vue ? '🙈' : '👁 Réponse'}</button>
                        {vue && <span style={{ fontFamily: DISPLAY, fontSize: 18, color: OK }}>{en.reponse || '— non renseignée —'}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {liste.length === 0 ? (
            <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, padding: '60px 20px', textAlign: 'center', border: `1px dashed ${T.border}` }}>
              {ev.participants.length === 0 ? 'Aucun participant pour le moment — créez la première fiche.' : 'Aucun participant ne correspond à cette recherche.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {liste.map((p, rang) => {
                const s = stats(p, n);
                const nomComplet = `${p.prenom} ${p.nom}`.trim();
                return (
                  <div key={p.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `4px solid ${s.bonnes === n ? OK : s.repondues > 0 ? col : T.border}`, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
                      {tri === 'score' && <span style={{ fontFamily: DISPLAY, fontSize: 22, color: rang < 3 ? col : T.dim, minWidth: 34 }}>{rang === 0 ? '🥇' : rang === 1 ? '🥈' : rang === 2 ? '🥉' : `#${rang + 1}`}</span>}
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontFamily: DISPLAY, fontSize: 23, color: T.text }}>{nomComplet || '— sans nom —'}</div>
                        {p.notes && <div style={{ fontFamily: BODY, fontSize: 15, color: T.dim, fontStyle: 'italic', marginTop: 2 }}>{p.notes}</div>}
                      </div>
                      {/* Résumé : répondues / bonnes / fausses */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontFamily: MONO, fontSize: 14, color: T.muted, background: 'rgba(255,255,255,0.05)', padding: '4px 10px', border: `1px solid ${T.border}` }}>Répondu : <b style={{ color: T.text }}>{s.repondues} / {n}</b></span>
                        <span style={{ fontFamily: MONO, fontSize: 14, color: OK, background: 'rgba(168,185,145,0.10)', padding: '4px 10px', border: '1px solid rgba(168,185,145,0.4)' }}>✔ {s.bonnes}</span>
                        <span style={{ fontFamily: MONO, fontSize: 14, color: KO, background: 'rgba(223,154,136,0.10)', padding: '4px 10px', border: '1px solid rgba(223,154,136,0.4)' }}>✕ {s.fausses}</span>
                        <span style={{ fontFamily: DISPLAY, fontSize: 24, color: s.bonnes === n ? OK : col, padding: '0 6px' }}>{s.bonnes}/{n}</span>
                      </div>
                      {canRegistre && (
                        <span style={{ display: 'flex', gap: 6 }}>
                          {delP === p.id ? (
                            <>
                              <button onClick={() => { setDelP(null); appeler({ action: 'delete_participant', participantId: p.id }); }} style={{ ...petit, background: '#8B404025', color: KO, border: '1px solid #8B404060' }}>SUPPRIMER ?</button>
                              <button onClick={() => setDelP(null)} style={{ ...petit, background: 'transparent', color: T.dim, border: `1px solid ${T.border}` }}>✕</button>
                            </>
                          ) : (
                            <>
                              <button title="Modifier la fiche" onClick={() => setEditP({ id: p.id, prenom: p.prenom, nom: p.nom, notes: p.notes })} style={{ ...petit, background: 'rgba(209,183,124,0.10)', color: T.gold, border: '1px solid rgba(209,183,124,0.3)' }}>✎</button>
                              <button title="Supprimer la fiche" onClick={() => setDelP(p.id)} style={{ ...petit, background: 'transparent', color: '#8B6060', border: '1px solid rgba(139,64,64,0.3)' }}>✕</button>
                            </>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Les énigmes : ✔ bonne / ✕ fausse (re-cliquer remet « pas répondue ») */}
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(n, 7)}, minmax(0, 1fr))`, gap: 8 }}>
                      {s.reps.map((r, i) => (
                        <div key={i} style={{ background: r === true ? 'rgba(168,185,145,0.12)' : r === false ? 'rgba(223,154,136,0.10)' : 'rgba(0,0,0,0.2)', border: `1px solid ${r === true ? 'rgba(168,185,145,0.5)' : r === false ? 'rgba(223,154,136,0.45)' : T.border}`, padding: '8px 8px 10px', textAlign: 'center' }}>
                          <div style={{ marginBottom: 8 }}>
                            <div style={{ fontFamily: MONO, fontSize: 12, color: T.dim, letterSpacing: '0.04em' }}>{ev.enigmes[i].date || ' '}</div>
                            <div style={{ fontFamily: MONO, fontSize: 12, color: col, letterSpacing: '0.06em', fontWeight: 700 }}>{i === n - 1 ? 'ÉNIGME FINALE' : `ÉNIGME ${romain(i)}`}</div>
                            <div style={{ fontFamily: BODY, fontSize: 15, color: T.text, lineHeight: 1.2, marginTop: 4, overflowWrap: 'anywhere' }}>{ev.enigmes[i].reponse}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                            <button disabled={!canRegistre} onClick={() => noter(p, i, true)} title="Bonne réponse"
                              style={{ flex: 1, fontFamily: MONO, fontSize: 17, padding: '6px 0', cursor: canRegistre ? 'pointer' : 'default', background: r === true ? 'rgba(168,185,145,0.35)' : 'transparent', color: r === true ? '#EAF2DC' : OK, border: `1px solid ${r === true ? OK : 'rgba(168,185,145,0.35)'}` }}>✔</button>
                            <button disabled={!canRegistre} onClick={() => noter(p, i, false)} title="Mauvaise réponse"
                              style={{ flex: 1, fontFamily: MONO, fontSize: 17, padding: '6px 0', cursor: canRegistre ? 'pointer' : 'default', background: r === false ? 'rgba(223,154,136,0.35)' : 'transparent', color: r === false ? '#FBE3DC' : KO, border: `1px solid ${r === false ? KO : 'rgba(223,154,136,0.35)'}` }}>✕</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Départage : seulement en cas d'égalité parfaite, pour ceux qui ont tout bon */}
                    {egalite && s.bonnes === n && (() => {
                      const sb = statsBonus(p, bonusListe);
                      return (
                        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px dashed ${col}80` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                            <span style={{ fontFamily: MONO, fontSize: 14, color: col, letterSpacing: '0.1em' }}>⚖ DÉPARTAGE</span>
                            <span style={{ fontFamily: MONO, fontSize: 14, color: OK, background: 'rgba(168,185,145,0.10)', padding: '3px 10px', border: '1px solid rgba(168,185,145,0.4)' }}>✔ {sb.bonnes}</span>
                            <span style={{ fontFamily: MONO, fontSize: 14, color: KO, background: 'rgba(223,154,136,0.10)', padding: '3px 10px', border: '1px solid rgba(223,154,136,0.4)' }}>✕ {sb.fausses}</span>
                            <span style={{ fontFamily: DISPLAY, fontSize: 22, color: col }}>{sb.bonnes}/{sb.total}</span>
                            {bonusListe.some(b => b.groupe) && <span style={{ fontFamily: MONO, fontSize: 12, color: T.dim }}>Énigmes en alternative : une seule compte (dès que l’une est notée, l’autre est bloquée).</span>}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
                            {bonusListe.map((b, i) => {
                              const r = p.reponsesBonus?.[i] ?? null;
                              const bloque = !!b.groupe && r === null && bonusListe.some((o, k) => k !== i && o.groupe === b.groupe && (p.reponsesBonus?.[k] ?? null) !== null);
                              const actif = canRegistre && !bloque;
                              return (
                                <div key={i} style={{ opacity: bloque ? 0.45 : 1, background: r === true ? 'rgba(168,185,145,0.12)' : r === false ? 'rgba(223,154,136,0.10)' : 'rgba(0,0,0,0.2)', border: `1px solid ${r === true ? 'rgba(168,185,145,0.5)' : r === false ? 'rgba(223,154,136,0.45)' : T.border}`, padding: '8px 8px 10px', textAlign: 'center' }}>
                                  <div style={{ marginBottom: 8 }}>
                                    <div style={{ fontFamily: MONO, fontSize: 12, color: col, letterSpacing: '0.06em', fontWeight: 700 }}>ÉNIGME {i + 1}.2</div>
                                    <div style={{ fontFamily: BODY, fontSize: 15, color: T.text, lineHeight: 1.2, marginTop: 4, overflowWrap: 'anywhere' }}>{b.reponse}</div>
                                    {bloque && <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, marginTop: 3 }}>NE COMPTE PAS</div>}
                                  </div>
                                  <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                                    <button disabled={!actif} onClick={() => noterBonus(p, i, true)} title="Bonne réponse"
                                      style={{ flex: 1, fontFamily: MONO, fontSize: 17, padding: '6px 0', cursor: actif ? 'pointer' : 'default', background: r === true ? 'rgba(168,185,145,0.35)' : 'transparent', color: r === true ? '#EAF2DC' : OK, border: `1px solid ${r === true ? OK : 'rgba(168,185,145,0.35)'}` }}>✔</button>
                                    <button disabled={!actif} onClick={() => noterBonus(p, i, false)} title="Mauvaise réponse"
                                      style={{ flex: 1, fontFamily: MONO, fontSize: 17, padding: '6px 0', cursor: actif ? 'pointer' : 'default', background: r === false ? 'rgba(223,154,136,0.35)' : 'transparent', color: r === false ? '#FBE3DC' : KO, border: `1px solid ${r === false ? KO : 'rgba(223,154,136,0.35)'}` }}>✕</button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modification d'une fiche */}
      {editP && createPortal(
        <div onClick={() => !saving && setEditP(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#102B3B', border: `2px solid ${col}`, width: '100%', maxWidth: 520, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 24, color: col }}>✎ Modifier la fiche</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={lbl}>PRÉNOM</label><input style={inp} value={editP.prenom} onChange={e => setEditP({ ...editP, prenom: e.target.value })} autoFocus /></div>
              <div><label style={lbl}>NOM</label><input style={inp} value={editP.nom} onChange={e => setEditP({ ...editP, nom: e.target.value })} /></div>
            </div>
            <div><label style={lbl}>NOTE (OPTIONNEL)</label><textarea style={{ ...inp, resize: 'vertical', minHeight: 70 }} value={editP.notes} onChange={e => setEditP({ ...editP, notes: e.target.value })} placeholder="Équipe, remarque…" /></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditP(null)} style={{ fontFamily: MONO, fontSize: 14, padding: '11px 24px', cursor: 'pointer', background: 'transparent', color: T.muted, border: `1px solid ${T.border}` }}>ANNULER</button>
              <button onClick={async () => { setSaving(true); const ok = await appeler({ action: 'update_participant', participantId: editP.id, prenom: editP.prenom, nom: editP.nom, notes: editP.notes }); setSaving(false); if (ok) setEditP(null); }} disabled={saving}
                style={{ fontFamily: MONO, fontSize: 15, letterSpacing: '0.12em', padding: '11px 30px', cursor: 'pointer', background: `${col}28`, color: col, border: `2px solid ${col}70` }}>{saving ? '⟳ …' : '✔ ENREGISTRER'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Récompense / prix (direction) */}
      {editR && createPortal(
        <div onClick={() => !saving && setEditR(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#102B3B', border: `2px solid ${col}`, width: '100%', maxWidth: 560, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 24, color: col }}>{editR.id ? '✎ Modifier le prix' : '✚ Nouveau prix'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 10 }}>
              <div><label style={lbl}>RANG</label><input style={inp} value={editR.rang} onChange={e => setEditR({ ...editR, rang: e.target.value })} placeholder="ex : 1er prix" autoFocus /></div>
              <div><label style={lbl}>PRIX / RÉCOMPENSE *</label><input style={inp} value={editR.titre} onChange={e => setEditR({ ...editR, titre: e.target.value })} placeholder="ex : 100 $ + un coffre de soins" /></div>
            </div>
            <div><label style={lbl}>DESCRIPTION</label><textarea style={{ ...inp, resize: 'vertical', minHeight: 80 }} value={editR.description} onChange={e => setEditR({ ...editR, description: e.target.value })} /></div>
            <div>
              <label style={lbl}>GAGNANT (QUAND IL EST CONNU)</label>
              <input style={inp} list="evt-gagnants" value={editR.gagnant} onChange={e => setEditR({ ...editR, gagnant: e.target.value })} placeholder="Choisir un participant ou écrire un nom" />
              <datalist id="evt-gagnants">{ev.participants.map(p => <option key={p.id} value={`${p.prenom} ${p.nom}`.trim()} />)}</datalist>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditR(null)} style={{ fontFamily: MONO, fontSize: 14, padding: '11px 24px', cursor: 'pointer', background: 'transparent', color: T.muted, border: `1px solid ${T.border}` }}>ANNULER</button>
              <button disabled={saving || !editR.titre.trim()} onClick={async () => {
                setSaving(true);
                const ok = await appeler({ action: editR.id ? 'update_recompense' : 'add_recompense', recompenseId: editR.id, rang: editR.rang, titre: editR.titre, description: editR.description, gagnant: editR.gagnant });
                setSaving(false); if (ok) setEditR(null);
              }} style={{ fontFamily: MONO, fontSize: 15, letterSpacing: '0.12em', padding: '11px 30px', cursor: 'pointer', background: `${col}28`, color: col, border: `2px solid ${col}70`, opacity: saving || !editR.titre.trim() ? 0.5 : 1 }}>{saving ? '⟳ …' : '✔ ENREGISTRER'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Édition des énigmes (direction) */}
      {editEnigmes && createPortal(
        <div onClick={() => !saving && setEditEnigmes(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 110, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '4vh 20px', overflowY: 'auto' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#102B3B', border: `2px solid ${col}`, width: '100%', maxWidth: 900, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 24, color: col }}>🧩 Énigmes et réponses</div>

            <details style={{ border: `1px solid ${T.border}`, padding: '10px 14px', background: 'rgba(0,0,0,0.15)' }}>
              <summary style={{ fontFamily: MONO, fontSize: 14, color: T.gold, cursor: 'pointer' }}>📋 Coller toutes les énigmes d&apos;un coup</summary>
              <div style={{ fontFamily: MONO, fontSize: 12, color: T.dim, margin: '10px 0', lineHeight: 1.6 }}>
                Collez le texte au format « 25 octobre — Énigme I / titre / « énoncé » / Réponse : … ». Les énigmes reconnues remplissent les cases ci-dessous (à enregistrer ensuite).
              </div>
              <textarea style={{ ...inp, minHeight: 120, resize: 'vertical' }} value={collage} onChange={e => setCollage(e.target.value)} placeholder="Collez ici…" />
              <button onClick={() => { const r = analyserEnigmes(collage, editEnigmes); setEditEnigmes(r.liste); setInfoCollage(`${r.nb} énigme${r.nb > 1 ? 's' : ''} reconnue${r.nb > 1 ? 's' : ''}.`); }} disabled={!collage.trim()}
                style={{ marginTop: 8, fontFamily: MONO, fontSize: 14, padding: '8px 16px', cursor: 'pointer', background: `${col}22`, color: col, border: `1px solid ${col}60` }}>↳ ANALYSER LE TEXTE</button>
              {infoCollage && <span style={{ fontFamily: MONO, fontSize: 13, color: OK, marginLeft: 12 }}>{infoCollage}</span>}
            </details>

            {editEnigmes.map((en, i) => (
              <div key={i} style={{ border: `1px solid ${T.border}`, padding: '12px 14px', background: 'rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '60px minmax(0,1fr) 170px', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontFamily: DISPLAY, fontSize: 20, color: col }}>{romain(i)}</span>
                  <input style={inp} value={en.titre} onChange={e => setEditEnigmes(editEnigmes.map((x, j) => j === i ? { ...x, titre: e.target.value } : x))} placeholder="Titre (facultatif, non affiché)" />
                  <input style={inp} value={en.date} onChange={e => setEditEnigmes(editEnigmes.map((x, j) => j === i ? { ...x, date: e.target.value } : x))} placeholder="Date (25 octobre)" />
                </div>
                <textarea style={{ ...inp, minHeight: 64, resize: 'vertical' }} value={en.enonce} onChange={e => setEditEnigmes(editEnigmes.map((x, j) => j === i ? { ...x, enonce: e.target.value } : x))} placeholder="Énoncé de l'énigme" />
                <input style={{ ...inp, borderColor: 'rgba(168,185,145,0.5)' }} value={en.reponse} onChange={e => setEditEnigmes(editEnigmes.map((x, j) => j === i ? { ...x, reponse: e.target.value } : x))} placeholder="Réponse attendue" />
              </div>
            ))}

            <div style={{ fontFamily: DISPLAY, fontSize: 21, color: KO, marginTop: 6 }}>⚖ Énigmes de départage (égalité à {editEnigmes.length}/{editEnigmes.length})</div>
            <div style={{ fontFamily: MONO, fontSize: 12, color: T.dim, lineHeight: 1.6 }}>
              Affichées sur la fiche des participants à égalité parfaite. Deux énigmes ayant le même « choix » ne comptent qu’une fois (dès que l’une est notée, l’autre est bloquée).
            </div>
            {editBonus.map((en, i) => (
              <div key={i} style={{ border: `1px solid ${T.border}`, padding: '12px 14px', background: 'rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '70px minmax(0,1fr) 170px auto', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontFamily: DISPLAY, fontSize: 20, color: KO }}>{i + 1}.2</span>
                  <input style={{ ...inp, borderColor: 'rgba(168,185,145,0.5)' }} value={en.reponse} onChange={e => setEditBonus(editBonus.map((x, j) => j === i ? { ...x, reponse: e.target.value } : x))} placeholder="Réponse attendue" />
                  <input style={inp} value={en.groupe ?? ''} onChange={e => setEditBonus(editBonus.map((x, j) => j === i ? { ...x, groupe: e.target.value.trim() || undefined } : x))} placeholder="Choix (ex : A)" title="Même code = une seule de ces énigmes compte" />
                  <button title="Supprimer cette énigme" onClick={() => setEditBonus(editBonus.filter((_, j) => j !== i))} style={{ ...petit, background: 'transparent', color: '#8B6060', border: '1px solid rgba(139,64,64,0.3)' }}>✕</button>
                </div>
                <textarea style={{ ...inp, minHeight: 90, resize: 'vertical' }} value={en.enonce} onChange={e => setEditBonus(editBonus.map((x, j) => j === i ? { ...x, enonce: e.target.value } : x))} placeholder="Énoncé de l'énigme" />
              </div>
            ))}
            <div>
              <button onClick={() => setEditBonus([...editBonus, { titre: '', date: '', enonce: '', reponse: '' }])} style={{ fontFamily: MONO, fontSize: 14, padding: '8px 16px', cursor: 'pointer', background: 'transparent', color: T.muted, border: `1px solid ${T.border}` }}>✚ AJOUTER UNE ÉNIGME DE DÉPARTAGE</button>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button onClick={() => setEditEnigmes(null)} style={{ fontFamily: MONO, fontSize: 14, padding: '11px 24px', cursor: 'pointer', background: 'transparent', color: T.muted, border: `1px solid ${T.border}` }}>ANNULER</button>
              <button onClick={async () => { setSaving(true); const ok = await appeler({ action: 'set_enigmes', enigmes: editEnigmes, bonus: editBonus }); setSaving(false); if (ok) setEditEnigmes(null); }} disabled={saving}
                style={{ fontFamily: MONO, fontSize: 15, letterSpacing: '0.12em', padding: '11px 30px', cursor: 'pointer', background: `${col}28`, color: col, border: `2px solid ${col}70` }}>{saving ? '⟳ …' : '✔ ENREGISTRER'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
