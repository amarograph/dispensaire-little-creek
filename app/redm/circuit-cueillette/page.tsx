'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

const DISPLAY = "'Central Station', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";

interface Circuit { id: string; nom: string; icon: string; image: string; }

/** Ajouter une nouvelle plante : déposer l'image dans public/circuit-cueillette/ et ajouter une entrée ici. */
const CIRCUITS: Circuit[] = [
  { id: 'laurier-rose', nom: 'Laurier Rose', icon: '🌺', image: '/circuit-cueillette/laurier-rose.webp' },
];

export default function CircuitCueillettePage() {
  const router = useRouter();
  const [idx, setIdx]   = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan]   = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number; moved: boolean } | null>(null);
  const ouvert = idx !== null ? CIRCUITS[idx] : null;

  const reset = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);
  const ouvrir = (i: number) => { setIdx(i); reset(); };
  const fermer = useCallback(() => { setIdx(null); reset(); }, [reset]);
  const aller = useCallback((delta: number) => {
    setIdx(i => i === null ? i : (i + delta + CIRCUITS.length) % CIRCUITS.length);
    reset();
  }, [reset]);
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

  return (
    <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');`}</style>

      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <button onClick={() => router.push('/redm')}
            style={{ fontFamily: MONO, fontSize: 15, background: 'transparent', border: '1px solid rgba(74,122,64,0.35)', color: '#7AAA70', padding: '8px 18px', cursor: 'pointer', letterSpacing: '0.1em' }}>
            ← RETOUR
          </button>
          <span style={{ fontFamily: MONO, fontSize: 14, color: '#7AAA70', letterSpacing: '0.18em' }}>DISPENSAIRE · CIRCUIT DE CUEILLETTE</span>
        </div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 40, color: '#7AAA70', margin: 0 }}>🌿 Circuit de Cueillette</h1>
        <p style={{ fontFamily: MONO, fontSize: 14, color: '#C8BEA5', letterSpacing: '0.12em', marginTop: 8 }}>
          PARCOURS DE RÉCOLTE DES PLANTES MÉDICINALES DU COMTÉ
        </p>
      </div>

      {CIRCUITS.length === 0 ? (
        <div style={{
          background: 'rgba(24,55,70,0.92)', border: '1px dashed rgba(74,122,64,0.35)',
          padding: '60px 30px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>🗺️</div>
          <p style={{ fontFamily: MONO, fontSize: 14, color: '#C8BEA5', letterSpacing: '0.08em' }}>
            Contenu à venir — les circuits seront ajoutés ici sous forme d'images.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
          {CIRCUITS.map(c => (
            <div key={c.id} onClick={() => ouvrir(CIRCUITS.indexOf(c))}
              style={{ background: 'rgba(24,55,70,0.92)', border: '1px solid rgba(74,122,64,0.35)', cursor: 'pointer', overflow: 'hidden', transition: 'transform 0.15s, border-color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(122,170,112,0.7)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(74,122,64,0.35)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ position: 'relative', width: '100%', height: 170 }}>
                <Image src={c.image} alt={c.nom} fill style={{ objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{c.icon}</span>
                <span style={{ fontFamily: DISPLAY, fontSize: 19, color: '#EADCB9' }}>{c.nom}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {ouvert && (
        <div
          onClick={() => { if (!drag.current?.moved) fermer(); }}
          onWheel={e => changerZoom(z => e.deltaY < 0 ? z * 1.15 : z / 1.15)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}>

          {/* Barre du haut : titre, compteur, zoom, fermer */}
          <div onClick={e => e.stopPropagation()}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: 'linear-gradient(rgba(0,0,0,0.7), transparent)', zIndex: 2, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 22, color: '#EADCB9', flex: 1, minWidth: 160 }}>{ouvert.icon} {ouvert.nom}</div>
            {CIRCUITS.length > 1 && <span style={{ fontFamily: MONO, fontSize: 14, color: '#C8BEA5' }}>{(idx ?? 0) + 1} / {CIRCUITS.length}</span>}
            <button style={btn} title="Dézoomer (−)" onClick={() => changerZoom(z => z / 1.4)}>−</button>
            <span style={{ fontFamily: MONO, fontSize: 14, color: '#EADCB9', minWidth: 52, textAlign: 'center' }}>{Math.round(zoom * 100)} %</span>
            <button style={btn} title="Zoomer (+)" onClick={() => changerZoom(z => z * 1.4)}>+</button>
            <button style={{ ...btn, fontSize: 14 }} title="Taille d'origine (0)" onClick={reset}>⟲</button>
            <button style={{ ...btn, fontSize: 16 }} title="Fermer (Échap)" onClick={fermer}>✕</button>
          </div>

          {/* Image : molette / boutons pour zoomer, glisser pour déplacer, double-clic pour agrandir */}
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

          {/* Flèches précédent / suivant */}
          {CIRCUITS.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); aller(-1); }} title="Image précédente (←)"
                style={{ ...btn, position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', height: 64, fontSize: 28, zIndex: 2 }}>‹</button>
              <button onClick={e => { e.stopPropagation(); aller(1); }} title="Image suivante (→)"
                style={{ ...btn, position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', height: 64, fontSize: 28, zIndex: 2 }}>›</button>
            </>
          )}

          {/* Vignettes */}
          {CIRCUITS.length > 1 && (
            <div onClick={e => e.stopPropagation()}
              style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8, padding: '0 16px', overflowX: 'auto', zIndex: 2 }}>
              {CIRCUITS.map((c, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={c.id} src={c.image} alt={c.nom} title={c.nom} onClick={() => ouvrir(i)} draggable={false}
                  style={{ height: 54, width: 80, objectFit: 'cover', cursor: 'pointer', opacity: i === idx ? 1 : 0.5, border: `2px solid ${i === idx ? '#7AAA70' : 'transparent'}` }} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
