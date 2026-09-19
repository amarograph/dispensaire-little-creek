'use client';

import { useRouter } from 'next/navigation';

const DISPLAY = "'Burnic', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";

export default function CircuitCueillettePage() {
  const router = useRouter();

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
        <p style={{ fontFamily: MONO, fontSize: 14, color: '#646850', letterSpacing: '0.12em', marginTop: 8 }}>
          PARCOURS DE RÉCOLTE DES PLANTES MÉDICINALES DU COMTÉ
        </p>
      </div>

      <div style={{
        background: 'rgba(247,237,215,0.92)', border: '1px dashed rgba(74,122,64,0.35)',
        padding: '60px 30px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>🗺️</div>
        <p style={{ fontFamily: MONO, fontSize: 14, color: '#646850', letterSpacing: '0.08em' }}>
          Contenu à venir — les circuits seront ajoutés ici sous forme d'images.
        </p>
      </div>
    </div>
  );
}
