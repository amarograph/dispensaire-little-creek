'use client';

import { useRef } from 'react';
import { MONO, BODY, T, rpDisplay, type DocResult, type Patiente } from '../_lib/shared';
import { RichContent } from '@/app/redm/_components/RichDoc';

/* Vue « certificat » d'un document d'obstétrique : feuille blanche, impression et export PNG
   (même présentation que les documents du cabinet thérapeutique). */
export function DocCertificate({ doc, patiente, color, onBack, extraButtons }: {
  doc: DocResult; patiente: Patiente | null; color: string;
  onBack: () => void; extraButtons?: React.ReactNode;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  async function saveAsPng() {
    const el = printRef.current;
    if (!el) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(el, { backgroundColor: '#FFFFFF', scale: 2, useCORS: true, allowTaint: true, logging: false });
      const link = document.createElement('a');
      link.download = `${doc.titre}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) { console.error('PNG export:', e); }
  }

  const btn: React.CSSProperties = { fontFamily: MONO, fontSize: 14, padding: '9px 22px', cursor: 'pointer', letterSpacing: '0.1em' };

  return (
    <div style={{ fontFamily: BODY }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
        @font-face { font-family: 'Libre Baskerville'; src: url('/SpecialElite-Regular.ttf') format('truetype'); font-weight: normal; font-style: normal; }
        @media print { .no-print { display: none !important; } .print-area { background: white !important; color: black !important; padding: 40px !important; font-family: 'Libre Baskerville', 'Courier New', monospace !important; } }
      `}</style>
      <div className="no-print" style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ ...btn, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '9px 20px' }}>← RETOUR</button>
        {extraButtons}
        <button onClick={() => window.print()} style={{ ...btn, background: 'rgba(107,122,187,0.22)', border: '1px solid rgba(107,122,187,0.55)', color: '#8899CC' }}>🖨 IMPRIMER</button>
        <button onClick={saveAsPng} style={{ ...btn, background: `${color}22`, border: `1px solid ${color}70`, color }}>💾 ENREGISTRER PNG</button>
      </div>
      <div ref={printRef} className="print-area" style={{ background: '#FFFFFF', border: '2px solid #C8BEA5', padding: '52px 60px', width: 794, maxWidth: '100%', boxSizing: 'border-box', margin: '0 auto', color: '#1A1A1A', fontFamily: "'Libre Baskerville', 'Courier New', monospace" }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 20, letterSpacing: '0.12em', marginBottom: 4, fontWeight: 'bold' }}>DISPENSAIRE DE LITTLE CREEK — OBSTÉTRIQUE</div>
          <div style={{ fontSize: 15, color: '#4A3018', marginBottom: 4 }}>Little Creek — West Elizabeth</div>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 17, letterSpacing: '0.1em', textDecoration: 'underline', textUnderlineOffset: 6, fontWeight: 'bold' }}>
            {doc.titre.toUpperCase()}
          </div>
          <div style={{ fontSize: 14, color: '#6A5030', marginTop: 6, letterSpacing: '0.1em' }}>{doc.type}</div>
        </div>
        <div style={{ fontSize: 15, lineHeight: 2 }}>
          <p style={{ margin: '0 0 16px' }}>Document rédigé le <strong>{rpDisplay(doc.date)}</strong>, concernant :</p>
          <p style={{ paddingLeft: 28, margin: '0 0 16px' }}>
            <strong>Nom et Prénom :</strong> {patiente ? `${patiente.patientPrenom} ${patiente.patientNom}` : '—'}<br />
            {patiente?.patientAge ? <><strong>Âge :</strong> {patiente.patientAge} ans<br /></> : null}
          </p>
          <p style={{ margin: '24px 0 8px', fontWeight: 'bold', textDecoration: 'underline', textUnderlineOffset: 4 }}>CONTENU</p>
          <RichContent value={doc.contenu} style={{ margin: '0 0 32px', lineHeight: 2.1 }} />
          <div style={{ marginTop: 52 }}>
            <div style={{ fontSize: 14, color: '#6A5030', lineHeight: 2 }}>
              Fait à <strong>Little Creek</strong>, le <strong>{rpDisplay(doc.date)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
