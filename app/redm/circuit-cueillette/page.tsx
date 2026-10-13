'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRedmSession } from '@/app/redm/_components/RedmSessionProvider';
import { isAdmin as checkIsAdmin } from '@/lib/permissions';

const DISPLAY = "'Central Station', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";
const GREEN   = '#7AAA70';

interface Circuit { id: string; nom: string; icon: string; image: string; }

/* Cartes affichées tant que le serveur n'a pas répondu */
const INITIAL: Circuit[] = [
  { id: 'laurier-rose', nom: 'Laurier Rose', icon: '🌺', image: '/circuit-cueillette/laurier-rose-v2.webp' },
];

/* Redimensionne l'image choisie (max 2200 px) et la convertit en JPEG avant l'envoi */
function fichierVersDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 2200 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.88));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image illisible')); };
    img.src = url;
  });
}

export default function CircuitCueillettePage() {
  const router = useRouter();
  const { roles } = useRedmSession();
  const canEdit = checkIsAdmin(roles) || roles.some((r: string) => ['redm_directeur', 'redm_co_directeur'].includes(r));

  const [circuits, setCircuits] = useState<Circuit[]>(INITIAL);
  const [loaded, setLoaded]     = useState(false);

  /* Formulaire d'ajout / modification (direction) */
  const [edit, setEdit]       = useState<{ id?: string; nom: string; icon: string; dataUrl: string; apercu: string } | null>(null);
  const [saving, setSaving]   = useState(false);
  const [erreur, setErreur]   = useState('');
  const [delConfirm, setDelConfirm] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/redm/circuit-cueillette')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (Array.isArray(d?.circuits)) setCircuits(d.circuits); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  async function appeler(payload: object): Promise<boolean> {
    setSaving(true); setErreur('');
    try {
      const r = await fetch('/api/redm/circuit-cueillette', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setErreur(d.error ?? `Erreur ${r.status}`); return false; }
      if (Array.isArray(d.circuits)) setCircuits(d.circuits);
      return true;
    } catch { setErreur('Erreur réseau.'); return false; }
    finally { setSaving(false); }
  }

  async function choisirFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f || !edit) return;
    try {
      const dataUrl = await fichierVersDataUrl(f);
      setEdit(x => x ? { ...x, dataUrl, apercu: dataUrl } : x);
    } catch { setErreur('Image illisible.'); }
  }

  async function enregistrer() {
    if (!edit || !edit.nom.trim()) return;
    const ok = await appeler({ action: 'upsert', id: edit.id, nom: edit.nom, icon: edit.icon, imageDataUrl: edit.dataUrl || undefined });
    if (ok) setEdit(null);
  }

  async function supprimer(id: string) {
    setDelConfirm(null);
    await appeler({ action: 'delete', id });
  }

  /* ── Visionneuse : uniquement les cartes qui ont une image ── */
  const galerie = circuits.filter(c => c.image);
  const [idx, setIdx]   = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan]   = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number; moved: boolean } | null>(null);
  const ouvert = idx !== null ? galerie[idx] : null;

  const reset = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);
  const ouvrir = (c: Circuit) => { setIdx(galerie.findIndex(g => g.id === c.id)); reset(); };
  const fermer = useCallback(() => { setIdx(null); reset(); }, [reset]);
  const nbGalerie = galerie.length;
  const aller = useCallback((delta: number) => {
    setIdx(i => i === null || nbGalerie === 0 ? i : (i + delta + nbGalerie) % nbGalerie);
    reset();
  }, [reset, nbGalerie]);
  const changerZoom = useCallback((fn: (z: number) => number) => {
    setZoom(z => {
      const nz = Math.min(6, Math.max(1, Math.round(fn(z) * 100) / 100));
      if (nz === 1) setPan({ x: 0, y: 0 });
      return nz;
    });
  }, []);

  /* Clavier : ← → pour changer d'image, + − pour zoomer, Échap pour fermer ; la page ne défile plus derrière */
  useEffect(() => {
    if (idx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fermer();
      else if (e.key === 'ArrowRight') aller(1);
      else if (e.key === 'ArrowLeft') aller(-1);
      else if (e.key === '+' || e.key === '=') changerZoom(z => z * 1.4);
      else if (e.key === '-') changerZoom(z => z / 1.4);
      else if (e.key === '0') reset();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [idx, fermer, aller, changerZoom, reset]);

  const btn: React.CSSProperties = { fontFamily: MONO, fontSize: 18, lineHeight: 1, minWidth: 42, height: 42, padding: '0 12px', cursor: 'pointer', background: 'rgba(24,55,70,0.95)', color: '#EADCB9', border: '1px solid rgba(122,170,112,0.55)' };
  const petit: React.CSSProperties = { fontFamily: MONO, fontSize: 13, padding: '5px 10px', cursor: 'pointer', letterSpacing: '0.06em' };
  const champ: React.CSSProperties = { fontFamily: MONO, fontSize: 15, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(74,122,64,0.45)', color: '#EADCB9', padding: '10px 14px', outline: 'none', width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');`}</style>

      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <button onClick={() => router.push('/redm')}
            style={{ fontFamily: MONO, fontSize: 15, background: 'transparent', border: '1px solid rgba(74,122,64,0.35)', color: GREEN, padding: '8px 18px', cursor: 'pointer', letterSpacing: '0.1em' }}>
            ← RETOUR
          </button>
          <span style={{ fontFamily: MONO, fontSize: 14, color: GREEN, letterSpacing: '0.18em' }}>DISPENSAIRE · CIRCUIT DE CUEILLETTE</span>
        </div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 40, color: GREEN, margin: 0 }}>🌿 Circuit de Cueillette</h1>
        <p style={{ fontFamily: MONO, fontSize: 14, color: '#C8BEA5', letterSpacing: '0.12em', marginTop: 8 }}>
          PARCOURS DE RÉCOLTE DES PLANTES MÉDICINALES DU COMTÉ{canEdit ? ' · LA DIRECTION PEUT AJOUTER ET MODIFIER LES CARTES' : ''}
        </p>
      </div>

      {erreur && !edit && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(200,80,80,0.10)', border: '1px solid rgba(200,80,80,0.35)', color: '#DF9A88', fontFamily: MONO, fontSize: 14 }}>⚠ {erreur}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18, opacity: loaded ? 1 : 0.6 }}>
        {circuits.map(c => (
          c.image ? (
            <div key={c.id} style={{ background: 'rgba(24,55,70,0.92)', border: '1px solid rgba(74,122,64,0.35)', overflow: 'hidden', transition: 'transform 0.15s, border-color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(122,170,112,0.7)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(74,122,64,0.35)'; e.currentTarget.style.transform = 'none'; }}>
              <div onClick={() => ouvrir(c)} style={{ position: 'relative', width: '100%', height: 190, cursor: 'zoom-in', background: '#0c2230' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.image} alt={c.nom} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 20 }}>{c.icon}</span>
                <span style={{ fontFamily: DISPLAY, fontSize: 19, color: '#EADCB9', flex: 1 }}>{c.nom}</span>
                {canEdit && (delConfirm === c.id ? (
                  <>
                    <button onClick={() => supprimer(c.id)} style={{ ...petit, background: '#8B404025', color: '#DF9A88', border: '1px solid #8B404060' }}>SUPPRIMER ?</button>
                    <button onClick={() => setDelConfirm(null)} style={{ ...petit, background: 'transparent', color: '#C8BEA5', border: '1px solid rgba(74,122,64,0.35)' }}>✕</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setErreur(''); setEdit({ id: c.id, nom: c.nom, icon: c.icon, dataUrl: '', apercu: c.image }); }} style={{ ...petit, background: 'rgba(122,170,112,0.12)', color: GREEN, border: '1px solid rgba(122,170,112,0.4)' }}>✎</button>
                    <button onClick={() => setDelConfirm(c.id)} style={{ ...petit, background: 'transparent', color: '#8B6060', border: '1px solid rgba(139,64,64,0.3)' }}>✕</button>
                  </>
                ))}
              </div>
            </div>
          ) : (
            /* Case vide : carte de la plante à venir */
            <div key={c.id} style={{ background: 'rgba(24,55,70,0.55)', border: '1px dashed rgba(74,122,64,0.45)', minHeight: 262, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 38, opacity: 0.55 }}>{c.icon}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: 20, color: '#EADCB9' }}>{c.nom}</div>
              <div style={{ fontFamily: MONO, fontSize: 13, color: '#C8BEA5', letterSpacing: '0.1em' }}>CARTE À VENIR</div>
              {canEdit && (
                <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button onClick={() => { setErreur(''); setEdit({ id: c.id, nom: c.nom, icon: c.icon, dataUrl: '', apercu: '' }); }}
                    style={{ ...petit, fontSize: 14, padding: '8px 16px', background: 'rgba(122,170,112,0.15)', color: GREEN, border: '1px solid rgba(122,170,112,0.5)' }}>📷 AJOUTER LA CARTE</button>
                  {delConfirm === c.id ? (
                    <>
                      <button onClick={() => supprimer(c.id)} style={{ ...petit, background: '#8B404025', color: '#DF9A88', border: '1px solid #8B404060' }}>SUPPRIMER ?</button>
                      <button onClick={() => setDelConfirm(null)} style={{ ...petit, background: 'transparent', color: '#C8BEA5', border: '1px solid rgba(74,122,64,0.35)' }}>✕</button>
                    </>
                  ) : (
                    <button onClick={() => setDelConfirm(c.id)} style={{ ...petit, background: 'transparent', color: '#8B6060', border: '1px solid rgba(139,64,64,0.3)' }}>✕</button>
                  )}
                </div>
              )}
            </div>
          )
        ))}

        {canEdit && (
          <div onClick={() => { setErreur(''); setEdit({ nom: '', icon: '🌿', dataUrl: '', apercu: '' }); }}
            style={{ border: '2px dashed rgba(122,170,112,0.5)', minHeight: 262, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: GREEN, background: 'rgba(122,170,112,0.05)' }}>
            <div style={{ fontSize: 40, lineHeight: 1 }}>＋</div>
            <div style={{ fontFamily: MONO, fontSize: 14, letterSpacing: '0.12em' }}>NOUVELLE PLANTE</div>
          </div>
        )}
      </div>

      {/* ── Formulaire d'ajout / de modification (direction) ── */}
      {edit && (
        <div onClick={() => !saving && setEdit(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#183746', border: '1px solid rgba(122,170,112,0.5)', width: '100%', maxWidth: 520, padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 24, color: '#EADCB9' }}>{edit.id ? '✎ Modifier la carte' : '＋ Nouvelle plante'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: 10 }}>
              <div>
                <label style={{ fontFamily: MONO, fontSize: 13, color: '#C8BEA5', letterSpacing: '0.12em', display: 'block', marginBottom: 5 }}>NOM DE LA PLANTE *</label>
                <input style={champ} value={edit.nom} onChange={e => setEdit(x => x ? { ...x, nom: e.target.value } : x)} placeholder="ex : Menthe sauvage" autoFocus />
              </div>
              <div>
                <label style={{ fontFamily: MONO, fontSize: 13, color: '#C8BEA5', letterSpacing: '0.12em', display: 'block', marginBottom: 5 }}>ICÔNE</label>
                <input style={{ ...champ, textAlign: 'center' }} value={edit.icon} onChange={e => setEdit(x => x ? { ...x, icon: e.target.value } : x)} />
              </div>
            </div>
            <div>
              <label style={{ fontFamily: MONO, fontSize: 13, color: '#C8BEA5', letterSpacing: '0.12em', display: 'block', marginBottom: 5 }}>CARTE (IMAGE)</label>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={choisirFichier} />
              {edit.apercu ? (
                <div style={{ position: 'relative', border: '1px solid rgba(74,122,64,0.45)', background: '#0c2230' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={edit.apercu} alt="Aperçu" style={{ width: '100%', maxHeight: 240, objectFit: 'contain', display: 'block' }} />
                </div>
              ) : (
                <div style={{ border: '1px dashed rgba(74,122,64,0.45)', padding: '28px 10px', textAlign: 'center', fontFamily: MONO, fontSize: 13, color: '#C8BEA5' }}>Aucune image pour l&apos;instant</div>
              )}
              <button onClick={() => fileRef.current?.click()} style={{ ...petit, fontSize: 14, padding: '9px 16px', marginTop: 8, background: 'rgba(122,170,112,0.15)', color: GREEN, border: '1px solid rgba(122,170,112,0.5)' }}>
                📷 {edit.apercu ? 'CHANGER L’IMAGE' : 'CHOISIR UNE IMAGE'}
              </button>
            </div>
            {erreur && <div style={{ padding: '8px 12px', background: 'rgba(200,80,80,0.10)', border: '1px solid rgba(200,80,80,0.35)', color: '#DF9A88', fontFamily: MONO, fontSize: 13 }}>⚠ {erreur}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setEdit(null)} disabled={saving} style={{ ...petit, fontSize: 14, padding: '10px 20px', background: 'transparent', color: '#C8BEA5', border: '1px solid rgba(74,122,64,0.35)' }}>ANNULER</button>
              <button onClick={enregistrer} disabled={saving || !edit.nom.trim()}
                style={{ ...petit, fontSize: 14, padding: '10px 24px', background: 'rgba(122,170,112,0.22)', color: '#EADCB9', border: '1px solid rgba(122,170,112,0.6)', opacity: saving || !edit.nom.trim() ? 0.5 : 1 }}>
                {saving ? '⟳ ENREGISTREMENT…' : '✔ ENREGISTRER'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Visionneuse : zoom, déplacement, navigation ── */}
      {ouvert && (
        <div
          onClick={() => { if (!drag.current?.moved) fermer(); }}
          onWheel={e => changerZoom(z => e.deltaY < 0 ? z * 1.15 : z / 1.15)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}>

          <div onClick={e => e.stopPropagation()}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: 'linear-gradient(rgba(0,0,0,0.7), transparent)', zIndex: 2, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 22, color: '#EADCB9', flex: 1, minWidth: 160 }}>{ouvert.icon} {ouvert.nom}</div>
            {nbGalerie > 1 && <span style={{ fontFamily: MONO, fontSize: 14, color: '#C8BEA5' }}>{(idx ?? 0) + 1} / {nbGalerie}</span>}
            <button style={btn} title="Dézoomer (−)" onClick={() => changerZoom(z => z / 1.4)}>−</button>
            <span style={{ fontFamily: MONO, fontSize: 14, color: '#EADCB9', minWidth: 52, textAlign: 'center' }}>{Math.round(zoom * 100)} %</span>
            <button style={btn} title="Zoomer (+)" onClick={() => changerZoom(z => z * 1.4)}>+</button>
            <button style={{ ...btn, fontSize: 14 }} title="Taille d'origine (0)" onClick={reset}>⟲</button>
            <button style={{ ...btn, fontSize: 16 }} title="Fermer (Échap)" onClick={fermer}>✕</button>
          </div>

          <div
            onClick={e => e.stopPropagation()}
            onDoubleClick={() => { if (zoom > 1) reset(); else setZoom(2.5); }}
            onPointerDown={e => {
              if (zoom <= 1) return;
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y, moved: false };
            }}
            onPointerMove={e => {
              const d = drag.current; if (!d) return;
              const dx = e.clientX - d.x, dy = e.clientY - d.y;
              if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
              setPan({ x: d.px + dx, y: d.py + dy });
            }}
            onPointerUp={() => { setTimeout(() => { drag.current = null; }, 0); }}
            style={{ width: '92vw', height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: zoom > 1 ? 'grab' : 'zoom-in', touchAction: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ouvert.image} alt={ouvert.nom} draggable={false}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transition: drag.current ? 'none' : 'transform 0.12s ease-out' }} />
          </div>

          {nbGalerie > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); aller(-1); }} title="Image précédente (←)"
                style={{ ...btn, position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', height: 64, fontSize: 28, zIndex: 2 }}>‹</button>
              <button onClick={e => { e.stopPropagation(); aller(1); }} title="Image suivante (→)"
                style={{ ...btn, position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', height: 64, fontSize: 28, zIndex: 2 }}>›</button>
              <div onClick={e => e.stopPropagation()}
                style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8, padding: '0 16px', overflowX: 'auto', zIndex: 2 }}>
                {galerie.map((c, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={c.id} src={c.image} alt={c.nom} title={c.nom} onClick={() => { setIdx(i); reset(); }} draggable={false}
                    style={{ height: 54, width: 80, objectFit: 'cover', cursor: 'pointer', opacity: i === idx ? 1 : 0.5, border: `2px solid ${i === idx ? GREEN : 'transparent'}` }} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
