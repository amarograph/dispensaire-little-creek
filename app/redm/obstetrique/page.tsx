'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const DISPLAY = "'Central Station', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";

const MODULES = [
  { id: 'patientes',     href: '/redm/obstetrique/patientes',     icon: '📋', label: 'Dossiers Patientes', sub: 'SUIVI OBSTÉTRICAL',      desc: 'Grossesses, consultations prénatales, accouchements et suivi post-natal.',           color: '#A8B991', badge: 'DOS' },
  { id: 'agenda',        href: '/redm/obstetrique/agenda',        icon: '📅', label: 'Agenda',             sub: 'RENDEZ-VOUS',            desc: 'Planification des consultations, visites et disponibilités de l’obstétricien.',       color: '#AAB9C6', badge: 'AGD' },
  { id: 'documentation', href: '/redm/obstetrique/documentation', icon: '📁', label: 'Documentation',      sub: 'FORMULAIRES OFFICIELS', desc: 'Suivi de grossesse, prescriptions et comptes-rendus d’accouchement.',                color: '#BBC7E3', badge: 'DOC' },
  { id: 'archives',      href: '/redm/obstetrique/archives',      icon: '🗄', label: 'Archives',           sub: 'DOSSIERS CLÔTURÉS',     desc: 'Patientes ayant terminé leur suivi. Dossiers archivés, consultables et restaurables.', color: '#C6B5D2', badge: 'ARC' },
];

export default function ObstetriquePage() {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);

  return (
    <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');`}</style>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <button onClick={() => router.push('/redm')}
            style={{ fontFamily: MONO, fontSize: 15, background: 'transparent', border: '1px solid rgba(139,90,43,0.35)', color: '#C8BEA5', padding: '8px 18px', cursor: 'pointer', letterSpacing: '0.1em' }}>
            ← RETOUR
          </button>
          <span style={{ fontFamily: MONO, fontSize: 14, color: '#D1B77C', letterSpacing: '0.18em' }}>DISPENSAIRE · OBSTÉTRIQUE</span>
        </div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 40, color: '#D1B77C', margin: 0 }}>🤱 Obstétrique</h1>
        <p style={{ fontFamily: MONO, fontSize: 14, color: '#C8BEA5', letterSpacing: '0.12em', marginTop: 8 }}>
          SOINS MATERNELS · 1890 — SÉLECTIONNEZ UNE SECTION
        </p>
      </div>

      {/* Grille */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {MODULES.map(m => {
          const h = hover === m.id;
          return (
            <div key={m.id}
              onClick={() => router.push(m.href)}
              onMouseEnter={() => setHover(m.id)}
              onMouseLeave={() => setHover(null)}
              style={{ background: h ? '#254B5C' : '#183746', border: `2px solid ${h ? m.color + '90' : 'rgba(139,90,43,0.25)'}`, borderLeft: `4px solid ${h ? m.color : m.color + '60'}`, padding: '30px 26px', cursor: 'pointer', transition: 'all 0.18s', transform: h ? 'translateY(-2px)' : 'none', boxShadow: h ? `0 8px 30px rgba(0,0,0,0.5), 0 0 20px ${m.color}20` : '0 2px 8px rgba(0,0,0,0.35)' }}>
              <div style={{ fontSize: 45, marginBottom: 16 }}>{m.icon}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontFamily: DISPLAY, fontSize: 26, color: '#EADCB9' }}>{m.label}</span>
                <span style={{ fontFamily: MONO, fontSize: 14, padding: '3px 8px', background: m.color + '22', color: m.color, border: `1px solid ${m.color + '55'}`, letterSpacing: '0.1em', flexShrink: 0 }}>{m.badge}</span>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 14, color: m.color, letterSpacing: '0.12em', marginBottom: 10 }}>{m.sub}</div>
              <div style={{ fontSize: 17, color: '#C8BEA5', lineHeight: 1.55 }}>{m.desc}</div>
              <div style={{ fontFamily: MONO, fontSize: 15, color: h ? '#EADCB9' : '#D1B77C', marginTop: 16, letterSpacing: '0.1em', transition: 'color 0.15s' }}>→ ACCÉDER</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
