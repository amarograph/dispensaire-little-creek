'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRedmSession } from '@/app/redm/_components/RedmSessionProvider';
import { isAdmin as checkIsAdmin } from '@/lib/permissions';
import { Roue, rotationVers } from '../_Roue';

const DISPLAY = "'Central Station', 'Georgia', serif";
const BODY    = "'Cormorant Garamond', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";
const T = { bg: '#102B3B', card: '#183746', border: 'rgba(139,90,43,0.30)', gold: '#D1B77C', text: '#EADCB9', muted: '#C8BEA5', dim: '#C8BEA5' };
const OK = '#A8B991', KO = '#DF9A88', COL = '#E8A04C';
const DUREE = 7000; // durée du tour de roue (ms)

interface Segment { id: string; label: string; actif: boolean; }
interface Tirage { id: string; segmentId: string; label: string; participant: string; at: string; auteur: string; retire: boolean | null; }
interface RoueData { id: string; nom: string; icon: string; description: string; visible: boolean; segments: Segment[]; historique: Tirage[]; }

const inp: React.CSSProperties = { fontFamily: MONO, fontSize: 15, background: 'rgba(0,0,0,0.28)', border: `1px solid ${T.border}`, color: T.text, padding: '10px 14px', outline: 'none', boxSizing: 'border-box', width: '100%' };
const lbl: React.CSSProperties = { fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.12em', marginBottom: 6, display: 'block' };
const petit: React.CSSProperties = { fontFamily: MONO, fontSize: 13, padding: '5px 10px', cursor: 'pointer' };

/* « Lot x3 » ajoute 3 cases « Lot » */
function analyserCases(texte: string): string[] {
  const out: string[] = [];
  for (const brut of texte.replace(/\r/g, '').split('\n')) {
    const l = brut.trim();
    if (!l) continue;
    const m = l.match(/^(.+?)\s+[x×]\s*(\d{1,3})$/i);
    const nb = m ? Math.min(parseInt(m[2], 10), 100) : 1;
    for (let i = 0; i < nb; i++) out.push(m ? m[1].trim() : l);
  }
  return out;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function RouePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { roles } = useRedmSession();
  const canStructure = checkIsAdmin(roles) || roles.some((r: string) => ['redm_directeur', 'redm_co_directeur'].includes(r));
  const canSpin = !(roles.length > 0 && roles.every((r: string) => r === 'redm_preparateur_caisse'));

  const [roue, setRoue]       = useState<RoueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [rot, setRot]         = useState(0);
  const [duree, setDuree]     = useState(0);
  const [anim, setAnim]       = useState(false);
  const [participant, setParticipant] = useState('');
  const [ajout, setAjout]     = useState('');
  const [saving, setSaving]   = useState(false);
  const [delSeg, setDelSeg]   = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialise = useRef(false);

  const actifs = useMemo(() => (roue?.segments ?? []).filter(s => s.actif), [roue]);
  const retirees = useMemo(() => (roue?.segments ?? []).filter(s => !s.actif), [roue]);
  const enAttente = roue?.historique.find(t => t.retire === null) ?? null;

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  useEffect(() => {
    fetch('/api/redm/roues')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => setRoue((d.roues as RoueData[]).find(x => x.id === id) ?? null))
      .catch(() => setError('Impossible de charger la roue.'))
      .finally(() => setLoading(false));
  }, [id]);

  /* Tirage resté en attente (page rechargée) : la roue s'affiche déjà arrêtée sur la case gagnante */
  useEffect(() => {
    if (initialise.current || !roue) return;
    initialise.current = true;
    if (enAttente) {
      const idx = actifs.findIndex(s => s.id === enAttente.segmentId);
      if (idx >= 0) { setDuree(0); setRot(rotationVers(0, idx, actifs.length, 1)); }
    }
  }, [roue, enAttente, actifs]);

  async function appeler(payload: object): Promise<{ ok: boolean; roue?: RoueData; data?: Record<string, unknown> }> {
    setError('');
    try {
      const r = await fetch('/api/redm/roues', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...payload }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setError(d.error ?? `Erreur ${r.status}`); return { ok: false }; }
      const nr = (d.roues as RoueData[]).find(x => x.id === id);
      if (nr) setRoue(nr);
      return { ok: true, roue: nr, data: d };
    } catch { setError('Erreur réseau.'); return { ok: false }; }
  }

  async function tourner() {
    if (anim || enAttente || actifs.length === 0 || !canSpin) return;
    setAnim(true);
    const res = await appeler({ action: 'spin', participant });
    if (!res.ok || !res.roue) { setAnim(false); return; }
    const t = res.roue.historique.find(x => x.id === res.data?.tirageId);
    const liste = res.roue.segments.filter(s => s.actif);
    const idx = t ? liste.findIndex(s => s.id === t.segmentId) : -1;
    if (idx < 0) { setAnim(false); return; }
    setDuree(DUREE);
    setRot(rotationVers(rot, idx, liste.length));
    timer.current = setTimeout(() => setAnim(false), DUREE + 400);
  }

  async function repondre(retirer: boolean) {
    if (!enAttente) return;
    setSaving(true);
    const res = await appeler({ action: 'resolve_tirage', tirageId: enAttente.id, retirer });
    setSaving(false);
    if (res.ok && retirer) { setDuree(0); setRot(0); } // le nombre de cases change : la roue repart de zéro
  }

  async function ajouter() {
    const labels = analyserCases(ajout);
    if (labels.length === 0) return;
    setSaving(true);
    const res = await appeler({ action: 'add_segments', labels });
    setSaving(false);
    if (res.ok) { setAjout(''); setDuree(0); setRot(0); }
  }

  if (loading) return <div style={{ fontFamily: MONO, color: T.dim, padding: 60, textAlign: 'center' }}>⟳ CHARGEMENT...</div>;
  if (!roue) return (
    <div style={{ fontFamily: BODY, padding: 40, textAlign: 'center' }}>
      <div style={{ fontFamily: MONO, fontSize: 15, color: T.dim }}>{error || 'Roue introuvable.'}</div>
      <button onClick={() => router.push('/redm/evenements/roues')} style={{ marginTop: 20, fontFamily: MONO, fontSize: 14, padding: '10px 22px', cursor: 'pointer', background: 'transparent', color: T.muted, border: `1px solid ${T.border}` }}>← RETOUR</button>
    </div>
  );

  const peutTourner = canSpin && !anim && !enAttente && actifs.length > 0;

  return (
    <div style={{ fontFamily: BODY }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');`}</style>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/redm/evenements/roues')} style={{ fontFamily: MONO, fontSize: 15, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '8px 18px', cursor: 'pointer', letterSpacing: '0.1em' }}>← RETOUR</button>
          <span style={{ fontFamily: MONO, fontSize: 14, color: COL, letterSpacing: '0.16em' }}>DISPENSAIRE · ÉVÈNEMENTS · ROUE DES GAINS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: DISPLAY, fontSize: 40, color: COL, margin: 0 }}>{roue.icon} {roue.nom}</h1>
          {canStructure && (
            <button onClick={() => appeler({ action: 'set_visible', visible: !roue.visible })}
              style={{ fontFamily: MONO, fontSize: 13, letterSpacing: '0.06em', padding: '8px 16px', cursor: 'pointer', background: roue.visible ? 'rgba(168,185,145,0.12)' : 'rgba(200,80,80,0.12)', color: roue.visible ? OK : KO, border: `1px solid ${roue.visible ? 'rgba(168,185,145,0.5)' : 'rgba(223,154,136,0.5)'}` }}>
              {roue.visible ? '👁 VISIBLE PAR TOUS — RÉSERVER À LA DIRECTION' : '🔒 RÉSERVÉE À LA DIRECTION — MONTRER À TOUS'}
            </button>
          )}
        </div>
        {roue.description && <p style={{ fontFamily: BODY, fontSize: 18, color: T.dim, marginTop: 8, maxWidth: 900 }}>{roue.description}</p>}
      </div>

      {error && <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(200,80,80,0.10)', border: '1px solid rgba(200,80,80,0.35)', color: KO, fontFamily: MONO, fontSize: 14, display: 'flex', justifyContent: 'space-between' }}><span>⚠ {error}</span><button onClick={() => setError('')} style={{ background: 'transparent', border: 'none', color: T.muted, cursor: 'pointer' }}>✕</button></div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 28, alignItems: 'start' }}>
        {/* ── La roue ── */}
        <div>
          <div style={{ maxWidth: 580, margin: '0 auto' }}>
            <Roue labels={actifs.map(s => s.label)} rotation={rot} duree={duree} accent={COL} enRotation={anim} />
          </div>
          <div style={{ maxWidth: 580, margin: '18px auto 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {canSpin && (
              <input style={inp} placeholder="Nom du participant (facultatif)" value={participant} onChange={e => setParticipant(e.target.value)} disabled={anim} />
            )}
            <button onClick={tourner} disabled={!peutTourner}
              style={{ fontFamily: DISPLAY, fontSize: 28, letterSpacing: '0.1em', padding: '16px 30px', cursor: peutTourner ? 'pointer' : 'not-allowed', background: peutTourner ? 'rgba(232,160,76,0.25)' : 'rgba(255,255,255,0.05)', color: peutTourner ? COL : T.dim, border: `3px solid ${peutTourner ? COL : T.border}`, opacity: peutTourner ? 1 : 0.7 }}>
              {anim ? '🎡 ÇA TOURNE…' : actifs.length === 0 ? 'AUCUNE CASE' : enAttente ? 'RÉPONDEZ À LA QUESTION' : '🎡 TOURNER LA ROUE'}
            </button>
            <div style={{ fontFamily: MONO, fontSize: 13, color: T.dim, textAlign: 'center' }}>
              {actifs.length} case{actifs.length > 1 ? 's' : ''} sur la roue{retirees.length > 0 ? ` · ${retirees.length} retirée${retirees.length > 1 ? 's' : ''}` : ''} · chaque case a la même chance
            </div>
          </div>
        </div>

        {/* ── Cases + historique ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {canStructure && (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '18px 20px' }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.text, marginBottom: 6 }}>✚ Ajouter des cases</div>
              <div style={{ fontFamily: MONO, fontSize: 12, color: T.dim, marginBottom: 10, lineHeight: 1.6 }}>Une case par ligne. « Coffre de soins x3 » ajoute 3 cases identiques.</div>
              <textarea style={{ ...inp, minHeight: 110, resize: 'vertical' }} value={ajout} onChange={e => setAjout(e.target.value)} placeholder={'100 $\nCoffre de soins x2\nPerdu'} />
              <button onClick={ajouter} disabled={saving || analyserCases(ajout).length === 0}
                style={{ marginTop: 10, fontFamily: MONO, fontSize: 14, letterSpacing: '0.1em', padding: '10px 22px', cursor: 'pointer', background: 'rgba(232,160,76,0.2)', color: COL, border: `2px solid rgba(232,160,76,0.55)`, opacity: saving || analyserCases(ajout).length === 0 ? 0.5 : 1 }}>
                ✚ AJOUTER {analyserCases(ajout).length > 0 ? `(${analyserCases(ajout).length})` : ''}
              </button>
            </div>
          )}

          <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '18px 20px' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.text, marginBottom: 10 }}>🎯 Cases en jeu ({actifs.length})</div>
            {actifs.length === 0 ? (
              <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim }}>{canStructure ? 'Aucune case — ajoutez-en ci-dessus.' : 'Aucune case pour le moment.'}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 320, overflowY: 'auto' }}>
                {actifs.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: 'rgba(0,0,0,0.18)' }}>
                    <span style={{ fontFamily: BODY, fontSize: 17, color: T.text, flex: 1, overflowWrap: 'anywhere' }}>{s.label}</span>
                    {canStructure && (delSeg === s.id ? (
                      <>
                        <button onClick={() => { setDelSeg(null); appeler({ action: 'delete_segment', segmentId: s.id }).then(r => { if (r.ok) { setDuree(0); setRot(0); } }); }} style={{ ...petit, background: '#8B404025', color: KO, border: '1px solid #8B404060' }}>SUPPRIMER ?</button>
                        <button onClick={() => setDelSeg(null)} style={{ ...petit, background: 'transparent', color: T.dim, border: `1px solid ${T.border}` }}>✕</button>
                      </>
                    ) : (
                      <>
                        <button title="Renommer" onClick={() => { const t = window.prompt('Nom de la case :', s.label); if (t && t.trim()) appeler({ action: 'update_segment', segmentId: s.id, label: t }); }} style={{ ...petit, background: 'rgba(209,183,124,0.10)', color: T.gold, border: '1px solid rgba(209,183,124,0.3)' }}>✎</button>
                        <button title="Supprimer la case" onClick={() => setDelSeg(s.id)} style={{ ...petit, background: 'transparent', color: '#8B6060', border: '1px solid rgba(139,64,64,0.3)' }}>✕</button>
                      </>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {retirees.length > 0 && (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.text }}>🚫 Cases retirées ({retirees.length})</div>
                {canStructure && <button onClick={() => appeler({ action: 'reset_segments' }).then(r => { if (r.ok) { setDuree(0); setRot(0); } })} style={{ ...petit, background: 'transparent', color: T.muted, border: `1px solid ${T.border}` }}>↺ TOUT REMETTRE</button>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
                {retirees.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: 'rgba(0,0,0,0.18)' }}>
                    <span style={{ fontFamily: BODY, fontSize: 17, color: T.dim, flex: 1, textDecoration: 'line-through' }}>{s.label}</span>
                    {canStructure && <button title="Remettre sur la roue" onClick={() => appeler({ action: 'set_segment_actif', segmentId: s.id, actif: true }).then(r => { if (r.ok) { setDuree(0); setRot(0); } })} style={{ ...petit, background: 'rgba(168,185,145,0.10)', color: OK, border: '1px solid rgba(168,185,145,0.4)' }}>↺ REMETTRE</button>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.text }}>📜 Historique des tirages ({roue.historique.length})</div>
              {canStructure && roue.historique.some(t => t.retire !== null) && (
                <button onClick={() => { if (window.confirm('Effacer l’historique des tirages ?')) appeler({ action: 'clear_historique' }); }} style={{ ...petit, background: 'transparent', color: '#8B6060', border: '1px solid rgba(139,64,64,0.3)' }}>EFFACER</button>
              )}
            </div>
            {roue.historique.length === 0 ? (
              <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim }}>Aucun tirage pour le moment.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 340, overflowY: 'auto' }}>
                {roue.historique.map(t => (
                  <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '88px minmax(0,1fr) auto', gap: 10, alignItems: 'center', padding: '6px 8px', background: 'rgba(0,0,0,0.18)' }}>
                    <span style={{ fontFamily: MONO, fontSize: 12, color: T.dim }}>{fmt(t.at)}</span>
                    <span style={{ fontFamily: BODY, fontSize: 17, color: T.text, overflowWrap: 'anywhere' }}>
                      <b style={{ color: COL }}>{t.label}</b>{t.participant ? <span style={{ color: T.muted }}> — {t.participant}</span> : null}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 12, color: t.retire === null ? COL : t.retire ? KO : OK, whiteSpace: 'nowrap' }}>
                      {t.retire === null ? '⏳ EN ATTENTE' : t.retire ? '🚫 RETIRÉE' : '↺ GARDÉE'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Résultat + question : retirer la case ou non ? (impossible de fermer sans répondre) */}
      {enAttente && !anim && canSpin && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#102B3B', border: `3px solid ${COL}`, width: '100%', maxWidth: 600, padding: '34px 34px 28px', textAlign: 'center', boxShadow: '0 0 60px rgba(232,160,76,0.35)' }}>
            <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.18em' }}>🎉 LA ROUE S’EST ARRÊTÉE SUR</div>
            {enAttente.participant && <div style={{ fontFamily: BODY, fontSize: 19, color: T.muted, marginTop: 6 }}>pour <b style={{ color: T.text }}>{enAttente.participant}</b></div>}
            <div style={{ fontFamily: DISPLAY, fontSize: 48, color: COL, lineHeight: 1.15, margin: '18px 0 26px', overflowWrap: 'anywhere' }}>{enAttente.label}</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 24, color: T.text, marginBottom: 18 }}>Faut-il retirer cette case de la roue ?</div>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button disabled={saving} onClick={() => repondre(true)} style={{ fontFamily: MONO, fontSize: 16, letterSpacing: '0.08em', padding: '14px 26px', cursor: 'pointer', background: 'rgba(223,154,136,0.18)', color: KO, border: `2px solid rgba(223,154,136,0.6)`, opacity: saving ? 0.6 : 1 }}>🚫 OUI, RETIRER LA CASE</button>
              <button disabled={saving} onClick={() => repondre(false)} style={{ fontFamily: MONO, fontSize: 16, letterSpacing: '0.08em', padding: '14px 26px', cursor: 'pointer', background: 'rgba(168,185,145,0.18)', color: OK, border: `2px solid rgba(168,185,145,0.6)`, opacity: saving ? 0.6 : 1 }}>↺ NON, LA GARDER</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
