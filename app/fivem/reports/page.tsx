'use client';

import { useRouter } from 'next/navigation';

const TYPES = [
  {
    id: 'traumatologie',
    icon: '🦴',
    label: 'Traumatologie',
    desc: 'Fractures, plaies, blessures par balle ou arme blanche, écrasements.',
    iconBg: 'rgba(249,115,22,0.15)',
    iconBorder: 'rgba(249,115,22,0.5)',
    accentColor: '#F97316',
    urgency: 'HAUTE',
    urgencyColor: '#F97316',
  },
  {
    id: 'chirurgie',
    icon: '🔪',
    label: 'Chirurgie',
    desc: 'Interventions chirurgicales, sutures profondes, opérations d\'urgence.',
    iconBg: 'rgba(239,68,68,0.15)',
    iconBorder: 'rgba(239,68,68,0.5)',
    accentColor: '#EF4444',
    urgency: 'CRITIQUE',
    urgencyColor: '#EF4444',
  },
  {
    id: 'consultation',
    icon: '🩺',
    label: 'Consultation',
    desc: 'Consultation générale, examens, bilans de santé et suivis médicaux.',
    iconBg: 'rgba(56,189,248,0.15)',
    iconBorder: 'rgba(56,189,248,0.5)',
    accentColor: '#38BDF8',
    urgency: 'STANDARD',
    urgencyColor: '#38BDF8',
  },
  {
    id: 'urgence',
    icon: '🚨',
    label: 'Urgence vitale',
    desc: 'Arrêt cardiaque, détresse respiratoire, choc hémorragique, coma.',
    iconBg: 'rgba(239,68,68,0.15)',
    iconBorder: 'rgba(239,68,68,0.55)',
    accentColor: '#F87171',
    urgency: 'VITAL',
    urgencyColor: '#EF4444',
  },
  {
    id: 'intoxication',
    icon: '☠️',
    label: 'Intoxication',
    desc: 'Overdose, empoisonnement, intoxication chimique ou médicamenteuse.',
    iconBg: 'rgba(168,85,247,0.15)',
    iconBorder: 'rgba(168,85,247,0.5)',
    accentColor: '#A855F7',
    urgency: 'HAUTE',
    urgencyColor: '#A855F7',
  },
  {
    id: 'psychiatrie',
    icon: '🧠',
    label: 'Psychiatrie',
    desc: 'Troubles mentaux, crises psychiatriques, évaluations psychologiques.',
    iconBg: 'rgba(20,184,166,0.15)',
    iconBorder: 'rgba(20,184,166,0.5)',
    accentColor: '#14B8A6',
    urgency: 'MODÉRÉE',
    urgencyColor: '#14B8A6',
  },
  {
    id: 'legiste',
    icon: '🔍',
    label: 'Médecin légiste',
    desc: 'Examens légaux, constatations, rapports médico-légaux et autopsies.',
    iconBg: 'rgba(148,163,184,0.12)',
    iconBorder: 'rgba(148,163,184,0.4)',
    accentColor: '#94A3B8',
    urgency: 'LÉGISTE',
    urgencyColor: '#94A3B8',
  },
  {
    id: 'deces',
    icon: '📋',
    label: 'Certificat de décès',
    desc: 'Constatation et certification officielle de décès, rapport de cause.',
    iconBg: 'rgba(71,85,105,0.15)',
    iconBorder: 'rgba(71,85,105,0.5)',
    accentColor: '#64748B',
    urgency: 'OFFICIEL',
    urgencyColor: '#64748B',
  },
];

export default function ReportsPage() {
  const router = useRouter();

  return (
    <div>
      {/* ── Header page ── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <button
            onClick={() => router.push('/fivem')}
            style={{
              background: 'transparent',
              border: '1px solid rgba(249,115,22,0.3)',
              color: '#94A3B8',
              borderRadius: 8,
              padding: '6px 16px',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            ← Retour
          </button>
          <span style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 10, color: '#F97316', letterSpacing: '0.18em',
          }}>
            MDT › RAPPORTS
          </span>
        </div>
        <h1 style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 32, fontWeight: 700,
          color: '#E2E8F0', letterSpacing: '0.02em', margin: 0,
        }}>
          <span style={{ color: '#F97316' }}>⚕</span> Nouveau rapport médical
        </h1>
        <p style={{ marginTop: 8, color: '#64748B', fontSize: 15 }}>
          Sélectionnez le type de rapport à créer.
        </p>
      </div>

      {/* ── Grille 2 colonnes ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => router.push(`/fivem/reports/${t.id}`)}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 20,
              padding: '22px 24px',
              background: '#0D1526',
              border: '2px solid rgba(255,255,255,0.10)',
              borderRadius: 14,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
              width: '100%',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget;
              el.style.borderColor = t.accentColor + '90';
              el.style.background = '#111E35';
              el.style.transform = 'translateY(-3px)';
              el.style.boxShadow = `0 0 28px ${t.accentColor}25, 0 8px 28px rgba(0,0,0,0.5)`;
            }}
            onMouseLeave={e => {
              const el = e.currentTarget;
              el.style.borderColor = 'rgba(255,255,255,0.10)';
              el.style.background = '#0D1526';
              el.style.transform = 'translateY(0)';
              el.style.boxShadow = 'none';
            }}
          >
            {/* Icône */}
            <div style={{
              width: 62, height: 62, borderRadius: 14, flexShrink: 0,
              background: t.iconBg,
              border: `2px solid ${t.iconBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26,
            }}>
              {t.icon}
            </div>

            {/* Texte */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                <span style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700, fontSize: 19,
                  color: '#E2E8F0',
                }}>
                  {t.label}
                </span>
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 9, padding: '3px 8px', borderRadius: 4,
                  background: t.urgencyColor + '20',
                  color: t.urgencyColor,
                  border: `1px solid ${t.urgencyColor}50`,
                  letterSpacing: '0.12em', flexShrink: 0,
                }}>
                  {t.urgency}
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.55 }}>
                {t.desc}
              </div>
              <div style={{ marginTop: 9, fontSize: 12, color: t.accentColor, opacity: 0.8 }}>
                → Créer le rapport
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
