'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

const DISPLAY = "'Central Station', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";

export interface ViewerImage { id: string; src: string; titre: string; }

/* Visionneuse plein écran : molette / boutons pour zoomer, glisser pour déplacer, double-clic pour agrandir,
   flèches ou ← → pour passer d'une image à l'autre, Échap pour fermer. Rendue hors du conteneur zoomable du site. */
export function ImageViewer({ images, index, onClose, accent = '#E8A04C' }: {
  images: ViewerImage[]; index: number; onClose: () => void; accent?: string;
}) {
  const [idx, setIdx]   = useState(index);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan]   = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number; moved: boolean } | null>(null);
  const n = images.length;
  const img = images[idx];

  const reset = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);
  const aller = useCallback((d: number) => { setIdx(i => (i + d + n) % n); reset(); }, [n, reset]);
  const changerZoom = useCallback((fn: (z: number) => number) => {
    setZoom(z => { const nz = Math.min(6, Math.max(1, Math.round(fn(z) * 100) / 100)); if (nz === 1) setPan({ x: 0, y: 0 }); return nz; });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' && n > 1) aller(1);
      else if (e.key === 'ArrowLeft' && n > 1) aller(-1);
      else if (e.key === '+' || e.key === '=') changerZoom(z => z * 1.4);
      else if (e.key === '-') changerZoom(z => z / 1.4);
      else if (e.key === '0') reset();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose, aller, changerZoom, reset, n]);

  if (!img || typeof document === 'undefined') return null;

  const btn: React.CSSProperties = { fontFamily: MONO, fontSize: 18, lineHeight: 1, minWidth: 42, height: 42, padding: '0 12px', cursor: 'pointer', background: 'rgba(24,55,70,0.95)', color: '#EADCB9', border: `1px solid ${accent}88` };

  return createPortal(
    <div onClick={() => { if (!drag.current?.moved) onClose(); }}
      onWheel={e => changerZoom(z => e.deltaY < 0 ? z * 1.15 : z / 1.15)}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.93)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}>

      <div onClick={e => e.stopPropagation()}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: 'linear-gradient(rgba(0,0,0,0.7), transparent)', zIndex: 2, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 22, color: '#EADCB9', flex: 1, minWidth: 160 }}>{img.titre}</div>
        {n > 1 && <span style={{ fontFamily: MONO, fontSize: 14, color: '#C8BEA5' }}>{idx + 1} / {n}</span>}
        <button style={btn} title="Dézoomer (−)" onClick={() => changerZoom(z => z / 1.4)}>−</button>
        <span style={{ fontFamily: MONO, fontSize: 14, color: '#EADCB9', minWidth: 52, textAlign: 'center' }}>{Math.round(zoom * 100)} %</span>
        <button style={btn} title="Zoomer (+)" onClick={() => changerZoom(z => z * 1.4)}>+</button>
        <button style={{ ...btn, fontSize: 14 }} title="Taille d'origine (0)" onClick={reset}>⟲</button>
        <button style={{ ...btn, fontSize: 16 }} title="Fermer (Échap)" onClick={onClose}>✕</button>
      </div>

      <div onClick={e => e.stopPropagation()}
        onDoubleClick={() => { if (zoom > 1) reset(); else setZoom(2.5); }}
        onPointerDown={e => { if (zoom <= 1) return; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y, moved: false }; }}
        onPointerMove={e => { const d = drag.current; if (!d) return; const dx = e.clientX - d.x, dy = e.clientY - d.y; if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true; setPan({ x: d.px + dx, y: d.py + dy }); }}
        onPointerUp={() => { setTimeout(() => { drag.current = null; }, 0); }}
        style={{ width: '92vw', height: '82vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: zoom > 1 ? 'grab' : 'zoom-in', touchAction: 'none' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img.src} alt={img.titre} draggable={false}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transition: drag.current ? 'none' : 'transform 0.12s ease-out' }} />
      </div>

      {n > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); aller(-1); }} title="Précédente (←)" style={{ ...btn, position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', height: 64, fontSize: 28, zIndex: 2 }}>‹</button>
          <button onClick={e => { e.stopPropagation(); aller(1); }} title="Suivante (→)" style={{ ...btn, position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', height: 64, fontSize: 28, zIndex: 2 }}>›</button>
          <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8, padding: '0 16px', overflowX: 'auto', zIndex: 2 }}>
            {images.map((c, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={c.id} src={c.src} alt={c.titre} title={c.titre} onClick={() => { setIdx(i); reset(); }} draggable={false}
                style={{ height: 54, width: 80, objectFit: 'cover', cursor: 'pointer', opacity: i === idx ? 1 : 0.5, border: `2px solid ${i === idx ? accent : 'transparent'}` }} />
            ))}
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}
