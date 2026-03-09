'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

// ── Modules MDT ──────────────────────────────────────────────────
const MODULES = [
  {
    id: 'reports',
    href: '/fivem/reports',
    icon: '📋',
    iconBg: 'rgba(249,115,22,0.12)',
    iconBorder: 'rgba(249,115,22,0.35)',
    iconColor: '#F97316',
    label: 'Créer un rapport',
    desc: 'Rédiger un rapport médical d\'intervention avec protocoles et prescriptions automatiques.',
    badge: 'MDT',
    badgeColor: 'rgba(249,115,22,0.15)',
    badgeText: '#FB923C',
  },
  {
    id: 'archives',
    href: '/fivem/archives',
    icon: '🗃',
    iconBg: 'rgba(56,189,248,0.12)',
    iconBorder: 'rgba(56,189,248,0.35)',
    iconColor: '#38BDF8',
    label: 'Archives',
    desc: 'Consulter l\'historique des rapports enregistrés, filtrer par patient ou date.',
    badge: 'DB',
    badgeColor: 'rgba(56,189,248,0.12)',
    badgeText: '#7DD3FC',
  },
  {
    id: 'bibliotheque',
    href: '/fivem/bibliotheque',
    icon: '📚',
    iconBg: 'rgba(34,197,94,0.12)',
    iconBorder: 'rgba(34,197,94,0.35)',
    iconColor: '#22C55E',
    label: 'Bibliothèque',
    desc: 'Accéder aux templates de rapports, protocoles et fiches de soins standardisés.',
    badge: 'REF',
    badgeColor: 'rgba(34,197,94,0.12)',
    badgeText: '#4ADE80',
  },
  {
    id: 'symptomes',
    href: '/fivem/symptomes',
    icon: '🔬',
    iconBg: 'rgba(168,85,247,0.12)',
    iconBorder: 'rgba(168,85,247,0.35)',
    iconColor: '#A855F7',
    label: 'Classification symptômes',
    desc: 'Identifier et classifier les symptômes, pathologies et urgences médicales.',
    badge: 'DX',
    badgeColor: 'rgba(168,85,247,0.12)',
    badgeText: '#C084FC',
  },
  {
    id: 'comptabilite',
    href: '/fivem/comptabilite',
    icon: '💰',
    iconBg: 'rgba(234,179,8,0.12)',
    iconBorder: 'rgba(234,179,8,0.35)',
    iconColor: '#EAB308',
    label: 'Comptabilité',
    desc: 'Gérer les honoraires, factures et dépenses des interventions médicales.',
    badge: 'FIN',
    badgeColor: 'rgba(234,179,8,0.12)',
    badgeText: '#FDE047',
  },
  {
    id: 'rp-medic',
    href: '/fivem/rp-medic',
    icon: '🩺',
    iconBg: 'rgba(239,68,68,0.12)',
    iconBorder: 'rgba(239,68,68,0.35)',
    iconColor: '#EF4444',
    label: 'Guide RP Médic',
    desc: 'Protocoles et guides pour le roleplay médical réaliste en situation d\'urgence.',
    badge: 'RP',
    badgeColor: 'rgba(239,68,68,0.12)',
    badgeText: '#F87171',
  },
];

// ── Stat ticker ──────────────────────────────────────────────────
const STATS = [
  { label: 'UNITÉS EN SERVICE', value: '04', unit: '' },
  { label: 'INTERVENTIONS/24H', value: '12', unit: '' },
  { label: 'TAUX SURVIE', value: '97.3', unit: '%' },
  { label: 'TEMPS MOYEN RESP.', value: '04:30', unit: 'MIN' },
];

// ── Page principale ──────────────────────────────────────────────
export default function FiveMPage() {
  const router = useRouter();
  const [now, setNow] = useState('');

  useEffect(() => {
    setNow(new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }));
  }, []);

  return (
    <div>
      {/* ── HERO SECTION ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div className="ems-text-mono" style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>
              ■ FIVEM — DISPATCH MÉDICAL ACTIF
            </div>
            <h1 className="ems-text-display" style={{
              fontSize: 32, fontWeight: 700, color: 'var(--text-primary)',
              lineHeight: 1.1, letterSpacing: '0.02em'
            }}>
              Terminal MDT<br />
              <span style={{ color: 'var(--accent)' }}>EMS</span>
            </h1>
            <p style={{ marginTop: 10, color: 'var(--text-secondary)', fontSize: 13, maxWidth: 420 }}>
              Système de gestion médicale d'urgence. Sélectionnez un module pour commencer.
            </p>
          </div>

          {/* Status panel */}
          <div style={{
            background: 'rgba(13,21,38,0.8)',
            border: '1px solid var(--accent-border)',
            borderRadius: 12, padding: '16px 20px',
            display: 'flex', flexDirection: 'column', gap: 8,
            minWidth: 200
          }}>
            <div className="ems-text-mono" style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em' }}>
              SYSTÈME STATUS
            </div>
            {[
              { label: 'Serveur', value: 'EN LIGNE', color: '#4ADE80' },
              { label: 'Base de données', value: 'CONNECTÉE', color: '#4ADE80' },
              { label: 'Protocoles', value: 'À JOUR', color: 'var(--accent)' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.label}</span>
                <span className="ems-text-mono" style={{ fontSize: 10, color: s.color }}>{s.value}</span>
              </div>
            ))}
            <div className="ems-divider" style={{ margin: '4px 0' }} />
            <div className="ems-text-mono" style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', textTransform: 'capitalize' }}>
              {now}
            </div>
          </div>
        </div>
      </div>

      {/* ── STAT BAR ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12, marginBottom: 32
      }}>
        {STATS.map(s => (
          <div key={s.label} style={{
            background: 'rgba(13,21,38,0.7)',
            border: '1px solid var(--accent-border)',
            borderRadius: 10, padding: '12px 16px',
            textAlign: 'center'
          }}>
            <div className="ems-text-mono" style={{ fontSize: 20, fontWeight: 'bold', color: 'var(--accent)', lineHeight: 1 }}>
              {s.value}<span style={{ fontSize: 11, opacity: 0.7 }}>{s.unit}</span>
            </div>
            <div className="ems-text-display" style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.12em', marginTop: 4 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── DIVIDER ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div className="ems-text-display" style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          Modules disponibles
        </div>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--accent-border), transparent)' }} />
      </div>

      {/* ── GRILLE MODULES ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 14,
      }}>
        {MODULES.map(m => (
          <div key={m.id} className="ems-module" onClick={() => router.push(m.href)}>
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div className="ems-module-icon" style={{
                background: m.iconBg,
                borderColor: m.iconBorder,
                color: m.iconColor,
              }}>
                {m.icon}
              </div>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                padding: '3px 8px',
                borderRadius: 4,
                background: m.badgeColor,
                color: m.badgeText,
                border: `1px solid ${m.badgeText}40`,
                letterSpacing: '0.1em'
              }}>
                {m.badge}
              </span>
            </div>

            {/* Text */}
            <div>
              <div className="ems-module-title">{m.label}</div>
              <div className="ems-module-desc">{m.desc}</div>
            </div>

            {/* Arrow */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <span className="ems-module-arrow">→</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── QUICK ACTION BAR ── */}
      <div style={{
        marginTop: 32,
        background: 'rgba(249,115,22,0.05)',
        border: '1px solid var(--accent-border)',
        borderRadius: 12,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>🚨</span>
          <div>
            <div className="ems-text-display" style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
              Intervention rapide
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              Créer un rapport de traumatologie d'urgence
            </div>
          </div>
        </div>
        <button
          onClick={() => router.push('/fivem/reports/urgence')}
          className="ems-btn-primary"
          style={{ width: 'auto', padding: '10px 24px', fontSize: 11 }}
        >
          🚨 RAPPORT URGENCE
        </button>
      </div>
    </div>
  );
}
