'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const MONO = "'Share Tech Mono', 'Courier New', monospace";
const DISPLAY = "'Rajdhani', 'Arial', sans-serif";

const MODULES = [
  { id: 'reports',      href: '/fivem/reports',      icon: '📋', label: 'Rapports',        sub: 'CRÉER / RÉDIGER',  desc: 'Rapport d\'intervention, protocoles, prescriptions.',  color: '#F97316', badge: 'MDT' },
  { id: 'archives',     href: '/fivem/archives',      icon: '🗃', label: 'Archives',         sub: 'HISTORIQUE',       desc: 'Consulter et filtrer les rapports enregistrés.',       color: '#38BDF8', badge: 'DB'  },
  { id: 'bibliotheque', href: '/fivem/bibliotheque',  icon: '📚', label: 'Bibliothèque',     sub: 'PROTOCOLES',       desc: 'Templates, fiches de soins et protocoles médicaux.',   color: '#4ADE80', badge: 'REF' },
  { id: 'symptomes',    href: '/fivem/symptomes',     icon: '🔬', label: 'Symptômes',        sub: 'DIAGNOSTIC',       desc: 'Classification des symptômes et pathologies.',         color: '#A855F7', badge: 'DX'  },
  { id: 'comptabilite', href: '/fivem/comptabilite',  icon: '💰', label: 'Comptabilité',     sub: 'FACTURATION',      desc: 'Honoraires, factures et gestion des dépenses.',        color: '#EAB308', badge: 'FIN' },
  { id: 'rp-medic',     href: '/fivem/rp-medic',      icon: '🩺', label: 'Guide RP Médic',   sub: 'ROLEPLAY',         desc: 'Protocoles et guides pour le roleplay médical.',       color: '#F87171', badge: 'RP'  },
];

const VITALS = [
  { label: 'UNITÉS EN SERVICE',   value: '04',   unit: '',    color: '#4ADE80' },
  { label: 'INTERVENTIONS / 24H', value: '12',   unit: '',    color: '#F97316' },
  { label: 'TAUX DE SURVIE',      value: '97.3', unit: '%',   color: '#F87171' },
  { label: 'TEMPS MOYEN RÉPONSE', value: '4:30', unit: 'MIN', color: '#38BDF8' },
];

const LOGS = [
  { time: '08:42', msg: 'Zone Vinewood — polytraumatisme signalé', dot: '#EF4444' },
  { time: '07:15', msg: 'Rapport validé — Sullivan Eleanor',       dot: '#4ADE80' },
  { time: '06:58', msg: 'Unité Alpha-3 de retour disponible',      dot: '#38BDF8' },
  { time: '06:30', msg: 'Protocole sepsis mis à jour',             dot: '#F97316' },
];

const UNITS = [
  { id: 'ALPHA-1', loc: 'Pillbox Hill', status: 'DISPONIBLE', col: '#4ADE80' },
  { id: 'ALPHA-3', loc: 'Sandy Shores', status: 'EN ROUTE',   col: '#F97316' },
  { id: 'BRAVO-2', loc: 'Vinewood',     status: 'OCCUPÉ',     col: '#EF4444' },
  { id: 'BRAVO-4', loc: 'Paleto Bay',   status: 'DISPONIBLE', col: '#4ADE80' },
];

export default function FiveMPage() {
  const router = useRouter();
  const [time, setTime] = useState('──:──:──');
  const [date, setDate] = useState('');
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setTime(n.toLocaleTimeString('fr-FR'));
      setDate(n.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase());
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Style de panel latéral réutilisable
  const panel = {
    background: '#060C1A',
    border: '1px solid rgba(249,115,22,0.22)',
    borderRadius: 0,
  };
  const panelHead = {
    padding: '9px 14px',
    borderBottom: '1px solid rgba(249,115,22,0.12)',
    fontFamily: MONO,
    fontSize: 8,
    color: '#F97316',
    letterSpacing: '0.2em',
    background: 'rgba(249,115,22,0.04)',
  };

  return (
    <div style={{ fontFamily: DISPLAY }}>

      {/* ══ LAYOUT 2 colonnes ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 270px', gap: 14, alignItems: 'start' }}>

        {/* ═══ COLONNE GAUCHE ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── BANDEAU HEADER ── */}
          <div style={{
            ...panel,
            borderLeft: '3px solid #F97316',
            padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 20,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: MONO, fontSize: 9, color: '#F97316', letterSpacing: '0.2em', marginBottom: 5 }}>
                ■ SAMS — FIVEM / MDT TERMINAL v2.0
              </div>
              <div style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 700, color: '#E2E8F0', lineHeight: 1, letterSpacing: '0.04em' }}>
                DISPATCH MÉDICAL <span style={{ color: '#F97316' }}>EMS</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: MONO, fontSize: 26, color: '#F97316', lineHeight: 1, letterSpacing: '0.06em' }}>
                {time}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 9, color: '#334155', letterSpacing: '0.1em', marginTop: 3 }}>
                {date}
              </div>
            </div>
            {/* Dot actif */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 8px #4ADE80' }} />
              <div>
                <div style={{ fontFamily: MONO, fontSize: 8, color: '#4ADE80', letterSpacing: '0.12em' }}>ACTIF</div>
                <div style={{ fontFamily: MONO, fontSize: 7, color: '#334155', letterSpacing: '0.1em' }}>EN LIGNE</div>
              </div>
            </div>
          </div>

          {/* ── VITALS ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {VITALS.map(v => (
              <div key={v.label} style={{
                ...panel,
                padding: '12px 16px',
                borderBottom: `2px solid ${v.color}50`,
              }}>
                <div style={{ fontFamily: MONO, fontSize: 8, color: '#334155', letterSpacing: '0.1em', marginBottom: 7 }}>
                  {v.label}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                  <span style={{ fontFamily: MONO, fontSize: 22, color: v.color, lineHeight: 1 }}>{v.value}</span>
                  {v.unit && <span style={{ fontFamily: MONO, fontSize: 9, color: v.color, opacity: 0.6 }}>{v.unit}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* ── SÉPARATEUR MODULES ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: MONO, fontSize: 8, color: '#F97316', letterSpacing: '0.18em', whiteSpace: 'nowrap' }}>◈ MODULES DISPONIBLES</span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(249,115,22,0.4), transparent)' }} />
            <span style={{ fontFamily: MONO, fontSize: 7, color: '#1E293B', letterSpacing: '0.1em' }}>{MODULES.length} MODULES</span>
          </div>

          {/* ── GRILLE MODULES ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {MODULES.map(m => {
              const isHov = hover === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => router.push(m.href)}
                  onMouseEnter={() => setHover(m.id)}
                  onMouseLeave={() => setHover(null)}
                  style={{
                    background: isHov ? '#0C1628' : '#060C1A',
                    border: `1px solid ${isHov ? m.color + '70' : 'rgba(255,255,255,0.09)'}`,
                    borderTop: `2px solid ${isHov ? m.color : m.color + '40'}`,
                    borderRadius: 0,
                    padding: '18px 16px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.18s',
                    transform: isHov ? 'translateY(-3px)' : 'none',
                    boxShadow: isHov ? `0 6px 24px rgba(0,0,0,0.5), 0 0 20px ${m.color}15` : 'none',
                    display: 'flex', flexDirection: 'column', gap: 10,
                  }}
                >
                  {/* Top */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{
                      width: 44, height: 44,
                      background: m.color + '15',
                      border: `1px solid ${m.color + '50'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20,
                    }}>
                      {m.icon}
                    </div>
                    <div style={{
                      fontFamily: MONO, fontSize: 8,
                      padding: '3px 8px',
                      background: m.color + '18',
                      color: m.color,
                      border: `1px solid ${m.color + '45'}`,
                      letterSpacing: '0.12em',
                    }}>
                      {m.badge}
                    </div>
                  </div>

                  {/* Texte */}
                  <div>
                    <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 17, color: '#E2E8F0', lineHeight: 1, marginBottom: 3 }}>
                      {m.label}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 8, color: m.color, letterSpacing: '0.14em', marginBottom: 7 }}>
                      {m.sub}
                    </div>
                    <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                      {m.desc}
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{
                    paddingTop: 10,
                    borderTop: `1px solid ${m.color + '25'}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontFamily: MONO, fontSize: 7, color: '#1E293B', letterSpacing: '0.1em' }}>ACTIF</span>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: isHov ? m.color : '#334155', transition: 'color 0.15s' }}>→ ACCÉDER</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── BOUTON URGENCE ── */}
          <div
            onClick={() => router.push('/fivem/reports/urgence')}
            style={{
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.30)',
              borderLeft: '3px solid #EF4444',
              padding: '14px 20px',
              display: 'flex', alignItems: 'center', gap: 14,
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 24 }}>🚨</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 15, color: '#F87171', letterSpacing: '0.06em' }}>
                INTERVENTION RAPIDE
              </div>
              <div style={{ fontFamily: MONO, fontSize: 9, color: '#475569', letterSpacing: '0.09em', marginTop: 2 }}>
                CRÉER UN RAPPORT D'URGENCE VITALE IMMÉDIATEMENT
              </div>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 12, color: '#EF4444' }}>→ LANCER</div>
          </div>

        </div>

        {/* ═══ COLONNE DROITE ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Statut système */}
          <div style={panel}>
            <div style={panelHead}>◈ STATUT SYSTÈME</div>
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 9 }}>
              {[
                { label: 'Base de données', val: 'CONNECTÉE', ok: true },
                { label: 'API Supabase',    val: 'EN LIGNE',  ok: true },
                { label: 'Protocoles',      val: 'À JOUR',    ok: true },
                { label: 'Univers FiveM',   val: 'ACTIF',     ok: true },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: MONO, fontSize: 9, color: '#475569' }}>{s.label}</span>
                  <span style={{ fontFamily: MONO, fontSize: 8, color: '#4ADE80', letterSpacing: '0.09em' }}>● {s.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Log activité */}
          <div style={panel}>
            <div style={panelHead}>◈ LOG D'ACTIVITÉ</div>
            <div>
              {LOGS.map((l, i) => (
                <div key={i} style={{
                  padding: '9px 14px',
                  borderBottom: i < LOGS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  display: 'flex', alignItems: 'flex-start', gap: 9,
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: l.dot, marginTop: 3, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 7, color: '#1E293B', letterSpacing: '0.1em', marginBottom: 2 }}>{l.time}</div>
                    <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.4 }}>{l.msg}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Unités actives */}
          <div style={panel}>
            <div style={panelHead}>◈ UNITÉS ACTIVES</div>
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {UNITS.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: u.col, boxShadow: `0 0 5px ${u.col}`, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: '#94A3B8' }}>{u.id}</div>
                    <div style={{ fontSize: 9, color: '#334155' }}>{u.loc}</div>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 7, color: u.col, letterSpacing: '0.08em' }}>{u.status}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
