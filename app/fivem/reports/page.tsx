'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const MONO = "'Share Tech Mono', 'Courier New', monospace";
const DISPLAY = "'Rajdhani', 'Arial', sans-serif";

const TYPES = [
  { id: 'traumatologie', icon: '🦴', label: 'Traumatologie',      desc: 'Fractures, plaies, blessures par balle ou arme blanche.', urgency: 'HAUTE',    color: '#F97316' },
  { id: 'chirurgie',     icon: '🔪', label: 'Chirurgie',          desc: 'Interventions chirurgicales, sutures profondes.',          urgency: 'CRITIQUE', color: '#EF4444' },
  { id: 'consultation',  icon: '🩺', label: 'Consultation',       desc: 'Consultation générale, examens, bilans de santé.',         urgency: 'STANDARD', color: '#38BDF8' },
  { id: 'urgence',       icon: '🚨', label: 'Urgence vitale',     desc: 'Arrêt cardiaque, détresse respiratoire, coma.',            urgency: 'VITAL',    color: '#EF4444' },
  { id: 'intoxication',  icon: '☠️', label: 'Intoxication',       desc: 'Overdose, empoisonnement, intoxication chimique.',         urgency: 'HAUTE',    color: '#A855F7' },
  { id: 'psychiatrie',   icon: '🧠', label: 'Psychiatrie',        desc: 'Troubles mentaux, crises psychiatriques.',                 urgency: 'MODÉRÉE',  color: '#14B8A6' },
  { id: 'legiste',       icon: '🔍', label: 'Médecin légiste',    desc: 'Examens légaux, rapports médico-légaux, autopsies.',       urgency: 'LÉGISTE',  color: '#94A3B8' },
  { id: 'deces',         icon: '📋', label: 'Certificat de décès',desc: 'Constatation officielle du décès, rapport de cause.',      urgency: 'OFFICIEL', color: '#64748B' },
];

export default function ReportsPage() {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);

  return (
    <div style={{ fontFamily: DISPLAY }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <button
            onClick={() => router.push('/fivem')}
            style={{
              fontFamily: MONO, fontSize: 10,
              background: 'transparent',
              border: '1px solid rgba(249,115,22,0.35)',
              color: '#64748B',
              padding: '6px 14px',
              cursor: 'pointer',
              letterSpacing: '0.1em',
            }}
          >
            ← RETOUR
          </button>
          <span style={{ fontFamily: MONO, fontSize: 9, color: '#F97316', letterSpacing: '0.2em' }}>
            MDT › RAPPORTS
          </span>
        </div>

        <h1 style={{
          fontFamily: DISPLAY, fontWeight: 700, fontSize: 30,
          color: '#E2E8F0', margin: 0, letterSpacing: '0.03em',
        }}>
          <span style={{ color: '#F97316' }}>⚕</span> Nouveau rapport médical
        </h1>
        <p style={{ fontFamily: MONO, fontSize: 10, color: '#334155', letterSpacing: '0.1em', marginTop: 8 }}>
          SÉLECTIONNEZ LE TYPE DE RAPPORT À CRÉER
        </p>
      </div>

      {/* ── Grille 2 colonnes ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
        {TYPES.map(t => {
          const isHov = hover === t.id;
          return (
            <div
              key={t.id}
              onClick={() => router.push(`/fivem/reports/${t.id}`)}
              onMouseEnter={() => setHover(t.id)}
              onMouseLeave={() => setHover(null)}
              style={{
                background: isHov ? '#0C1628' : '#060C1A',
                border: `2px solid ${isHov ? t.color + '80' : 'rgba(255,255,255,0.12)'}`,
                borderLeft: `3px solid ${isHov ? t.color : t.color + '50'}`,
                borderRadius: 0,
                padding: '20px 22px',
                cursor: 'pointer',
                transition: 'all 0.18s',
                transform: isHov ? 'translateY(-2px)' : 'none',
                boxShadow: isHov ? `0 6px 24px rgba(0,0,0,0.5), 0 0 16px ${t.color}18` : '0 2px 8px rgba(0,0,0,0.3)',
                display: 'flex', alignItems: 'center', gap: 18,
              }}
            >
              {/* Icône */}
              <div style={{
                width: 60, height: 60, flexShrink: 0,
                background: t.color + '18',
                border: `2px solid ${t.color + '55'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26,
              }}>
                {t.icon}
              </div>

              {/* Contenu */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                  <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 19, color: '#E2E8F0' }}>
                    {t.label}
                  </span>
                  <span style={{
                    fontFamily: MONO, fontSize: 8,
                    padding: '3px 8px',
                    background: t.color + '20',
                    color: t.color,
                    border: `1px solid ${t.color + '55'}`,
                    letterSpacing: '0.12em', flexShrink: 0,
                  }}>
                    {t.urgency}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.55 }}>
                  {t.desc}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 9, color: isHov ? t.color : '#1E293B', marginTop: 9, letterSpacing: '0.1em', transition: 'color 0.15s' }}>
                  → CRÉER LE RAPPORT
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
