'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
  const [ouvert, setOuvert] = useState<Circuit | null>(null);

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
            <div key={c.id} onClick={() => setOuvert(c)}
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
        <div onClick={() => setOuvert(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 30, cursor: 'zoom-out' }}>
          <div style={{ maxWidth: '95vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 24, color: '#EADCB9' }}>{ouvert.icon} {ouvert.nom}</div>
            <div style={{ position: 'relative', width: '90vw', maxWidth: 1100, height: '78vh' }}>
              <Image src={ouvert.image} alt={ouvert.nom} fill style={{ objectFit: 'contain' }} />
            </div>
            <button onClick={() => setOuvert(null)}
              style={{ fontFamily: MONO, fontSize: 14, background: 'transparent', border: '1px solid rgba(74,122,64,0.5)', color: '#7AAA70', padding: '8px 18px', cursor: 'pointer', letterSpacing: '0.1em' }}>
              ✕ FERMER
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
