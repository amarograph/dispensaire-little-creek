'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const MONO = "'Share Tech Mono', 'Courier New', monospace";
const DISPLAY = "'Rajdhani', 'Arial', sans-serif";

const MODULES = [
  { id: 'reports',      href: '/fivem/reports',      icon: '📋', label: 'Rapports',       sub: 'CRÉER / RÉDIGER', desc: 'Rapport d\'intervention, protocoles, prescriptions.', color: '#F97316', badge: 'MDT' },
  { id: 'archives',     href: '/fivem/archives',      icon: '🗃', label: 'Archives',        sub: 'HISTORIQUE',      desc: 'Consulter et filtrer les rapports enregistrés.',      color: '#38BDF8', badge: 'DB'  },
  { id: 'bibliotheque', href: '/fivem/bibliotheque',  icon: '📚', label: 'Bibliothèque',    sub: 'PROTOCOLES',      desc: 'Templates, fiches de soins et protocoles médicaux.',  color: '#4ADE80', badge: 'REF' },
  { id: 'symptomes',    href: '/fivem/symptomes',     icon: '🔬', label: 'Symptômes',       sub: 'DIAGNOSTIC',      desc: 'Classification des symptômes et pathologies.',        color: '#A855F7', badge: 'DX'  },
  { id: 'comptabilite', href: '/fivem/comptabilite',  icon: '💰', label: 'Comptabilité',    sub: 'FACTURATION',     desc: 'Honoraires, factures et gestion des dépenses.',       color: '#EAB308', badge: 'FIN' },
  { id: 'rp-medic',     href: '/fivem/rp-medic',      icon: '🩺', label: 'Guide RP Médic',  sub: 'ROLEPLAY',        desc: 'Protocoles et guides pour le roleplay médical.',      color: '#F87171', badge: 'RP'  },
];

const VITALS = [
  { label: 'UNITÉS EN SERVICE',   value: '14',    unit: '',    color: '#4ADE80' },
  { label: 'INTERVENTIONS / 24H', value: '1200',  unit: '',    color: '#F97316' },
  { label: 'TAUX DE SURVIE',      value: '97.35', unit: '%',   color: '#F87171' },
  { label: 'TEMPS MOYEN RÉPONSE', value: '4:30',  unit: 'MIN', color: '#38BDF8' },
];

const LOGS = [
  { time: '08:42', msg: 'Zone Vinewood — polytraumatisme signalé', dot: '#EF4444' },
  { time: '07:15', msg: 'Rapport validé',                          dot: '#4ADE80' },
  { time: '06:58', msg: 'Unité ALS AMBULANCE de retour disponible', dot: '#38BDF8' },
  { time: '06:30', msg: 'Protocole sepsis mis à jour',             dot: '#F97316' },
];

const UNITS = [
  { id: 'ALS AMBULANCE', loc: 'Pillbox Hill', status: 'DISPONIBLE', col: '#4ADE80' },
  { id: 'MEDIC 13',      loc: 'Sandy Shores', status: 'EN ROUTE',   col: '#F97316' },
  { id: 'RESCUE UNIT',   loc: 'Vinewood',     status: 'OCCUPÉ',     col: '#EF4444' },
  { id: 'WATER RESCUE',  loc: 'Marina',       status: 'DISPONIBLE', col: '#4ADE80' },
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

  const panel = { background: '#060C1A', border: '1px solid rgba(249,115,22,0.22)' };
  const panelHead = {
    padding: '14px 20px',
    borderBottom: '1px solid rgba(249,115,22,0.14)',
    fontFamily: MONO,
    fontSize: 14,
    color: '#F97316',
    letterSpacing: '0.16em',
    background: 'rgba(249,115,22,0.04)',
  };

  return (
    <div style={{ fontFamily: DISPLAY }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 18, alignItems: 'start' }}>

        {/* ═══ COLONNE GAUCHE ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── HEADER ── */}
          <div style={{ ...panel, borderLeft: '4px solid #F97316', padding: '22px 28px', display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ flex: 1 }}>
              {/* Texte modifié ici */}
              <div style={{ fontFamily: MONO, fontSize: 14, color: '#F97316', letterSpacing: '0.18em', marginBottom: 8 }}>
                ■ MDT — TERMINAL — EMS
              </div>
              <div style={{ fontFamily: DISPLAY, fontSize: 40, fontWeight: 700, color: '#E2E8F0', lineHeight: 1, letterSpacing: '0.04em' }}>
                DISPATCH MÉDICAL <span style={{ color: '#F97316' }}>EMS</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: MONO, fontSize: 36, color: '#F97316', lineHeight: 1, letterSpacing: '0.06em' }}>
                {time}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 13, color: '#475569', letterSpacing: '0.1em', marginTop: 5 }}>
                {date}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 10px #4ADE80' }} />
              <div>
                <div style={{ fontFamily: MONO, fontSize: 13, color: '#4ADE80', letterSpacing: '0.12em' }}>ACTIF</div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: '#334155', letterSpacing: '0.1em' }}>EN LIGNE</div>
              </div>
            </div>
          </div>

          {/* ── VITALS ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {VITALS.map(v => (
              <div key={v.label} style={{ ...panel, padding: '18px 20px', borderBottom: `3px solid ${v.color}50` }}>
                <div style={{ fontFamily: MONO, fontSize: 12, color: '#475569', letterSpacing: '0.09em', marginBottom: 10 }}>
                  {v.label}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  <span style={{ fontFamily: MONO, fontSize: 34, color: v.color, lineHeight: 1 }}>{v.value}</span>
                  {v.unit && <span style={{ fontFamily: MONO, fontSize: 14, color: v.color, opacity: 0.7 }}>{v.unit}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* ── SÉPARATEUR ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: MONO, fontSize: 14, color: '#F97316', letterSpacing: '0.16em', whiteSpace: 'nowrap' }}>◈ MODULES DISPONIBLES</span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(249,115,22,0.4), transparent)' }} />
            <span style={{ fontFamily: MONO, fontSize: 12, color: '#334155', letterSpacing: '0.1em' }}>{MODULES.length} MODULES</span>
          </div>

          {/* ── MODULES ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {MODULES.map(m => {
              const h = hover === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => router.push(m.href)}
                  onMouseEnter={() => setHover(m.id)}
                  onMouseLeave={() => setHover(null)}
                  style={{
                    background: h ? '#0C1628' : '#060C1A',
                    border: `2px solid ${h ? m.color + '80' : 'rgba(255,255,255,0.10)'}`,
                    borderTop: `3px solid ${h ? m.color : m.color + '50'}`,
                    padding: '22px 20px 18px',
                    cursor: 'pointer',
                    transition: 'all 0.18s',
                    transform: h ? 'translateY(-3px)' : 'none',
                    boxShadow: h ? `0 8px 28px rgba(0,0,0,0.5), 0 0 22px ${m.color}18` : '0 2px 8px rgba(0,0,0,0.3)',
                    display: 'flex', flexDirection: 'column', gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{
                      width: 56, height: 56,
                      background: m.color + '15',
                      border: `2px solid ${m.color + '55'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 26,
                    }}>
                      {m.icon}
                    </div>
                    <div style={{
                      fontFamily: MONO, fontSize: 12,
                      padding: '4px 11px',
                      background: m.color + '18', color: m.color,
                      border: `1px solid ${m.color + '45'}`,
                      letterSpacing: '0.12em',
                    }}>
                      {m.badge}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 24, color: '#E2E8F0', lineHeight: 1, marginBottom: 5 }}>
                      {m.label}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 12, color: m.color, letterSpacing: '0.13em', marginBottom: 10 }}>
                      {m.sub}
                    </div>
                    <div style={{ fontSize: 14, color: '#64748B', lineHeight: 1.55 }}>
                      {m.desc}
                    </div>
                  </div>

                  <div style={{
                    paddingTop: 12, borderTop: `1px solid ${m.color + '28'}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: '#1E293B', letterSpacing: '0.1em' }}>ACTIF</span>
                    <span style={{ fontFamily: MONO, fontSize: 13, color: h ? m.color : '#334155', transition: 'color 0.15s' }}>→ ACCÉDER</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── URGENCE ── */}
          <div
            onClick={() => router.push('/fivem/reports/urgence')}
            style={{
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.30)',
              borderLeft: '4px solid #EF4444',
              padding: '20px 28px',
              display: 'flex', alignItems: 'center', gap: 20,
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 32 }}>🚨</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 22, color: '#F87171', letterSpacing: '0.06em' }}>
                INTERVENTION RAPIDE
              </div>
              <div style={{ fontFamily: MONO, fontSize: 13, color: '#475569', letterSpacing: '0.08em', marginTop: 4 }}>
                CRÉER UN RAPPORT D'URGENCE VITALE IMMÉDIATEMENT
              </div>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 16, color: '#EF4444' }}>→ LANCER</div>
          </div>

        </div>

        {/* ═══ COLONNE DROITE ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Statut */}
          <div style={panel}>
            <div style={panelHead}>◈ STATUT SYSTÈME</div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Base de données', val: 'CONNECTÉE' },
                { label: 'API Supabase',    val: 'EN LIGNE'  },
                { label: 'Protocoles',      val: 'À JOUR'    },
                { label: 'Univers FiveM',   val: 'ACTIF'     },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: MONO, fontSize: 13, color: '#475569' }}>{s.label}</span>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: '#4ADE80', letterSpacing: '0.08em' }}>● {s.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Log */}
          <div style={panel}>
            <div style={panelHead}>◈ LOG D'ACTIVITÉ</div>
            <div>
              {LOGS.map((l, i) => (
                <div key={i} style={{
                  padding: '12px 20px',
                  borderBottom: i < LOGS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.dot, marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 12, color: '#334155', letterSpacing: '0.08em', marginBottom: 3 }}>{l.time}</div>
                    <div style={{ fontSize: 14, color: '#64748B', lineHeight: 1.45 }}>{l.msg}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Unités */}
          <div style={panel}>
            <div style={panelHead}>◈ UNITÉS ACTIVES</div>
            <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {UNITS.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: u.col, boxShadow: `0 0 7px ${u.col}`, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: MONO, fontSize: 13, color: '#94A3B8' }}>{u.id}</div>
                    <div style={{ fontSize: 13, color: '#334155' }}>{u.loc}</div>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 12, color: u.col, letterSpacing: '0.07em' }}>{u.status}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

