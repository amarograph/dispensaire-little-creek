'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const MONO = "'Share Tech Mono', 'Courier New', monospace";
const DISPLAY = "'Rajdhani', 'Arial', sans-serif";

const TYPES = [
  { id: 'traumatologie', icon: '🦴', label: 'Traumatologie',       desc: 'Fractures, plaies, blessures par balle ou arme blanche.', urgency: 'HAUTE',    color: '#F97316' },
  { id: 'chirurgie',     icon: '🔪', label: 'Chirurgie',           desc: 'Interventions chirurgicales, sutures profondes.',          urgency: 'CRITIQUE', color: '#EF4444' },
  { id: 'consultation',  icon: '🩺', label: 'Consultation',        desc: 'Consultation générale, examens, bilans de santé.',         urgency: 'STANDARD', color: '#38BDF8' },
  { id: 'urgence',       icon: '🚨', label: 'Urgence vitale',      desc: 'Arrêt cardiaque, détresse respiratoire, coma.',            urgency: 'VITAL',    color: '#EF4444' },
  { id: 'intoxication',  icon: '☠️', label: 'Intoxication',        desc: 'Overdose, empoisonnement, intoxication chimique.',         urgency: 'HAUTE',    color: '#A855F7' },
  { id: 'psychiatrie',   icon: '🧠', label: 'Psychiatrie',         desc: 'Troubles mentaux, crises psychiatriques.',                 urgency: 'MODÉRÉE',  color: '#14B8A6' },
  { id: 'legiste',       icon: '🔍', label: 'Médecin légiste',     desc: 'Examens légaux, rapports médico-légaux, autopsies.',       urgency: 'LÉGISTE',  color: '#94A3B8' },
  { id: 'deces',         icon: '📋', label: 'Certificat de décès', desc: 'Constatation officielle du décès, rapport de cause.',      urgency: 'OFFICIEL', color: '#64748B' },
];

export default function ReportsPage() {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);

  return (
    <div style={{ fontFamily: DISPLAY }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <button
            onClick={() => router.push('/fivem')}
            style={{
              fontFamily: MONO, fontSize: 13,
              background: 'transparent',
              border: '1px solid rgba(249,115,22,0.35)',
              color: '#64748B', padding: '9px 20px',
              cursor: 'pointer', letterSpacing: '0.1em',
            }}
          >
            ← RETOUR
          </button>
          <span style={{ fontFamily: MONO, fontSize: 13, color: '#F97316', letterSpacing: '0.18em' }}>
            MDT › RAPPORTS
          </span>
        </div>

        <h1 style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 38, color: '#E2E8F0', margin: 0, letterSpacing: '0.03em' }}>
          <span style={{ color: '#F97316' }}>⚕</span> Nouveau rapport médical
        </h1>
        <p style={{ fontFamily: MONO, fontSize: 13, color: '#475569', letterSpacing: '0.1em', marginTop: 10 }}>
          SÉLECTIONNEZ LE TYPE DE RAPPORT À CRÉER
        </p>
      </div>

      {/* ── Grille ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 18 }}>
        {TYPES.map(t => {
          const h = hover === t.id;
          return (
            <div
              key={t.id}
              onClick={() => router.push(`/fivem/reports/${t.id}`)}
              onMouseEnter={() => setHover(t.id)}
              onMouseLeave={() => setHover(null)}
              style={{
                background: h ? '#0C1628' : '#060C1A',
                border: `2px solid ${h ? t.color + '90' : 'rgba(255,255,255,0.14)'}`,
                borderLeft: `4px solid ${h ? t.color : t.color + '60'}`,
                padding: '26px 28px',
                cursor: 'pointer',
                transition: 'all 0.18s',
                transform: h ? 'translateY(-2px)' : 'none',
                boxShadow: h ? `0 8px 30px rgba(0,0,0,0.5), 0 0 20px ${t.color}20` : '0 2px 8px rgba(0,0,0,0.35)',
                display: 'flex', alignItems: 'center', gap: 24,
              }}
            >
              {/* Icône */}
              <div style={{
                width: 76, height: 76, flexShrink: 0,
                background: t.color + '18',
                border: `2px solid ${t.color + '60'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 34,
              }}>
                {t.icon}
              </div>

              {/* Contenu */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 26, color: '#E2E8F0' }}>
                    {t.label}
                  </span>
                  <span style={{
                    fontFamily: MONO, fontSize: 12,
                    padding: '4px 10px',
                    background: t.color + '22', color: t.color,
                    border: `1px solid ${t.color + '55'}`,
                    letterSpacing: '0.12em', flexShrink: 0,
                  }}>
                    {t.urgency}
                  </span>
                </div>
                <div style={{ fontSize: 15, color: '#64748B', lineHeight: 1.55 }}>
                  {t.desc}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 13, color: h ? t.color : '#334155', marginTop: 12, letterSpacing: '0.1em', transition: 'color 0.15s' }}>
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
