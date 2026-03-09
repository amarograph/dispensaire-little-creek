'use client';

import { useRouter } from 'next/navigation';

const TYPES = [
  {
    id: 'traumatologie',
    icon: '🦴',
    label: 'Traumatologie',
    desc: 'Fractures, plaies, blessures par balle ou arme blanche, écrasements.',
    iconBg: 'rgba(249,115,22,0.12)',
    iconBorder: 'rgba(249,115,22,0.4)',
    accentColor: '#F97316',
    urgency: 'HAUTE',
    urgencyColor: '#EF4444',
  },
  {
    id: 'chirurgie',
    icon: '🔪',
    label: 'Chirurgie',
    desc: 'Interventions chirurgicales, sutures profondes, opérations d\'urgence.',
    iconBg: 'rgba(239,68,68,0.12)',
    iconBorder: 'rgba(239,68,68,0.4)',
    accentColor: '#EF4444',
    urgency: 'CRITIQUE',
    urgencyColor: '#EF4444',
  },
  {
    id: 'consultation',
    icon: '🩺',
    label: 'Consultation',
    desc: 'Consultation générale, examens, bilans de santé et suivis médicaux.',
    iconBg: 'rgba(56,189,248,0.12)',
    iconBorder: 'rgba(56,189,248,0.4)',
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
    iconBorder: 'rgba(239,68,68,0.5)',
    accentColor: '#F87171',
    urgency: 'VITAL',
    urgencyColor: '#EF4444',
  },
  {
    id: 'intoxication',
    icon: '☠️',
    label: 'Intoxication',
    desc: 'Overdose, empoisonnement, intoxication chimique ou médicamenteuse.',
    iconBg: 'rgba(168,85,247,0.12)',
    iconBorder: 'rgba(168,85,247,0.4)',
    accentColor: '#A855F7',
    urgency: 'HAUTE',
    urgencyColor: '#A855F7',
  },
  {
    id: 'psychiatrie',
    icon: '🧠',
    label: 'Psychiatrie',
    desc: 'Troubles mentaux, crises psychiatriques, évaluations psychologiques.',
    iconBg: 'rgba(20,184,166,0.12)',
    iconBorder: 'rgba(20,184,166,0.4)',
    accentColor: '#14B8A6',
    urgency: 'MODÉRÉE',
    urgencyColor: '#14B8A6',
  },
  {
    id: 'legiste',
    icon: '🔍',
    label: 'Médecin légiste',
    desc: 'Examens légaux, constatations, rapports médico-légaux et autopsies.',
    iconBg: 'rgba(148,163,184,0.10)',
    iconBorder: 'rgba(148,163,184,0.3)',
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
    iconBorder: 'rgba(71,85,105,0.4)',
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
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <button onClick={() => router.push('/fivem')}
            className="ems-btn-secondary" style={{ padding: '5px 14px', fontSize: 11 }}>
            ← Retour
          </button>
          <div className="ems-text-mono" style={{ fontSize: 9, color: 'var(--accent)', letterSpacing: '0.18em' }}>
            MDT › RAPPORTS
          </div>
        </div>
        <h1 className="ems-text-display" style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
          <span style={{ color: 'var(--accent)' }}>⚕</span> Nouveau rapport médical
        </h1>
        <p style={{ marginTop: 6, color: 'var(--text-secondary)', fontSize: 13 }}>
          Sélectionnez le type de rapport à créer.
        </p>
      </div>

      {/* ── Grille rapports ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {TYPES.map(t => (
          <div key={t.id} className="ems-module" onClick={() => router.push(`/fivem/reports/${t.id}`)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: '18px 20px' }}>

            {/* Icon */}
            <div style={{
              width: 52, height: 52, borderRadius: 12, flexShrink: 0,
              background: t.iconBg, border: `1px solid ${t.iconBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22
            }}>
              {t.icon}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span className="ems-text-display" style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                  {t.label}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 8, padding: '2px 7px', borderRadius: 3,
                  background: `${t.urgencyColor}18`,
                  color: t.urgencyColor,
                  border: `1px solid ${t.urgencyColor}40`,
                  letterSpacing: '0.1em', flexShrink: 0
                }}>
                  {t.urgency}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {t.desc}
              </div>
            </div>

            {/* Arrow */}
            <span className="ems-module-arrow" style={{ flexShrink: 0 }}>→</span>
          </div>
        ))}
      </div>
    </div>
  );
}