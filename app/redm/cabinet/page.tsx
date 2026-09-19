'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const DISPLAY = "'Rye', 'Georgia', serif";
const MONO    = "'Special Elite', 'Courier New', monospace";

const MODULES = [
  { id: 'patients',      href: '/redm/cabinet/patients',      icon: '📋', label: 'Dossiers Patients',  sub: 'SUIVI THÉRAPEUTIQUE',   desc: 'Consultations, observations, traitements et suivi de chaque patient.',              color: '#4A6048', badge: 'DOS' },
  { id: 'agenda',        href: '/redm/cabinet/agenda',        icon: '📅', label: 'Agenda',             sub: 'RENDEZ-VOUS',            desc: 'Planification des séances, rendez-vous et disponibilités du praticien.',            color: '#486878', badge: 'AGD' },
  { id: 'documentation', href: '/redm/cabinet/documentation', icon: '📁', label: 'Documentation',      sub: 'FORMULAIRES OFFICIELS', desc: 'Examens psychiques, formulaires médicaux et documents officiels du cabinet.',       color: '#6B7ABB', badge: 'DOC' },
  { id: 'archives',      href: '/redm/cabinet/archives',      icon: '🗄', label: 'Archives',           sub: 'DOSSIERS CLÔTURÉS',     desc: 'Patients ayant cessé les séances. Dossiers archivés, consultables et restaurables.', color: '#5A4A6A', badge: 'ARC' },
];

export default function CabinetPage() {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);

  return (
    <div style={{ fontFamily: "'Josefin Slab', Georgia, serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Rye&family=Josefin+Slab:wght@300;400;600;700&family=Special+Elite&display=swap');`}</style>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <button onClick={() => router.push('/redm')}
            style={{ fontFamily: MONO, fontSize: 15, background: 'transparent', border: '1px solid rgba(139,90,43,0.35)', color: '#8B7355', padding: '8px 18px', cursor: 'pointer', letterSpacing: '0.1em' }}>
            ← RETOUR
          </button>
          <span style={{ fontFamily: MONO, fontSize: 14, color: '#C8A850', letterSpacing: '0.18em' }}>DISPENSAIRE · CABINET THÉRAPEUTIQUE</span>
        </div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 40, color: '#C8A850', margin: 0 }}>🛋 Cabinet Thérapeutique</h1>
        <p style={{ fontFamily: MONO, fontSize: 14, color: '#5A4A35', letterSpacing: '0.12em', marginTop: 8 }}>
          SOINS DE L&apos;ÂME · 1890 — SÉLECTIONNEZ UNE SECTION
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
              style={{ background: h ? '#241B0E' : '#1F1610', border: `2px solid ${h ? m.color + '90' : 'rgba(139,90,43,0.25)'}`, borderLeft: `4px solid ${h ? m.color : m.color + '60'}`, padding: '30px 26px', cursor: 'pointer', transition: 'all 0.18s', transform: h ? 'translateY(-2px)' : 'none', boxShadow: h ? `0 8px 30px rgba(0,0,0,0.5), 0 0 20px ${m.color}20` : '0 2px 8px rgba(0,0,0,0.35)' }}>
              <div style={{ fontSize: 45, marginBottom: 16 }}>{m.icon}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontFamily: DISPLAY, fontSize: 26, color: '#E8D9C0' }}>{m.label}</span>
                <span style={{ fontFamily: MONO, fontSize: 13, padding: '3px 8px', background: m.color + '22', color: m.color, border: `1px solid ${m.color + '55'}`, letterSpacing: '0.1em', flexShrink: 0 }}>{m.badge}</span>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 13, color: m.color, letterSpacing: '0.12em', marginBottom: 10 }}>{m.sub}</div>
              <div style={{ fontSize: 17, color: '#5A4A35', lineHeight: 1.55 }}>{m.desc}</div>
              <div style={{ fontFamily: MONO, fontSize: 15, color: h ? m.color : '#3A2A1A', marginTop: 16, letterSpacing: '0.1em', transition: 'color 0.15s' }}>→ ACCÉDER</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
