'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const DISPLAY = "'Rye', 'Georgia', serif";
const BODY    = "'Josefin Slab', 'Georgia', serif";
const MONO    = "'Special Elite', 'Courier New', monospace";

const MODULES = [
  { id: 'certificats',  href: '/redm/certificats',  icon: '📜', label: 'Certificats Médicaux',  sub: 'ACTES OFFICIELS',   desc: 'Rédiger et délivrer les certificats, ordonnances et attestations médicales.', color: '#B52A2A', badge: 'ACT' },
  { id: 'archives',     href: '/redm/archives',      icon: '🗄', label: 'Archives',               sub: 'REGISTRES',         desc: 'Consulter les registres de consultations et dossiers des patients.',           color: '#6B8B5E', badge: 'REG' },
  { id: 'bibliotheque', href: '/redm/bibliotheque',  icon: '📚', label: 'Bibliothèque',           sub: 'TRAITÉS & MANUELS', desc: "Traités médicaux, formulaires de remèdes et guides de soins de l'époque.",    color: '#5A7A8A', badge: 'REF' },
  { id: 'contexte',     href: '/redm/contexte',      icon: '🕰', label: "Contexte de l'Époque",   sub: 'FAR WEST · 1890',   desc: 'Histoire, maladies et pratiques médicales du Far West américain.',            color: '#7A6040', badge: 'HST' },
  { id: 'comptabilite', href: '/redm/comptabilite',  icon: '💰', label: 'Comptabilité',           sub: 'HONORAIRES',        desc: 'Registre des honoraires, factures et gestion des recettes du dispensaire.',   color: '#8B7040', badge: 'FIN' },
  { id: 'essentiel',    href: '/redm/essentiel',     icon: '🏥', label: "L'Essentiel du Médecin", sub: 'PROTOCOLES',        desc: "Guides de soins d'urgence, antidotes et protocoles médicaux essentiels.",     color: '#8B1A1A', badge: 'URG' },
];

const REGISTRE = [
  { heure: '08h14', msg: 'Consultation — blessure par balle, M. Calloway', dot: '#8B1A1A' },
  { heure: '07h42', msg: "Délivrance d'un certificat de bonne santé",      dot: '#6B8B5E' },
  { heure: '06h55', msg: "Arrivée d'un convoi — 3 blessés du ranch Ford",  dot: '#B52A2A' },
  { heure: '06h10', msg: 'Renouvellement du stock de laudanum',             dot: '#5A7A8A' },
];

const ETAT = [
  { label: 'Lits disponibles',  val: '3 / 6',    col: '#6B8B5E' },
  { label: 'Chirurgien',        val: 'PRÉSENT',   col: '#6B8B5E' },
  { label: 'Stock morphine',    val: 'SUFFISANT', col: '#8B7040' },
  { label: 'Épidémie déclarée', val: 'AUCUNE',    col: '#6B8B5E' },
];

const PATIENTS = [
  { nom: 'Elijah Calloway',  etat: 'Stable',     col: '#6B8B5E' },
  { nom: 'Mary Sue Henkel',  etat: 'Critique',   col: '#8B1A1A' },
  { nom: 'Tom "Buck" Walsh', etat: 'Soigné',     col: '#5A7A8A' },
  { nom: 'Rev. John Marsh',  etat: 'En attente', col: '#8B7040' },
];

export default function RedMDashboard() {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);
  const [time, setTime] = useState('──:──');
  const [date, setDate] = useState('');

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setTime(n.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
      setDate(n.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const panel: React.CSSProperties = {
    background: 'rgba(18,10,11,0.90)',
    border: '1px solid rgba(139,26,26,0.28)',
  };

  const panelHead: React.CSSProperties = {
    padding: '14px 22px',
    borderBottom: '1px solid rgba(139,26,26,0.18)',
    fontFamily: DISPLAY,
    fontSize: 13,
    color: '#B52A2A',
    letterSpacing: '0.10em',
    background: 'rgba(139,26,26,0.05)',
    textTransform: 'uppercase',
  };

  return (
    <div style={{ fontFamily: BODY }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 20, alignItems: 'start' }}>

        {/* ═══ COLONNE GAUCHE ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* ── EN-TÊTE ── */}
          <div style={{
            ...panel,
            borderLeft: '4px solid #6B0F0F',
            padding: '28px 34px',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Croix médicale décorative en fond */}
            <div style={{
              position: 'absolute', top: 10, right: 28,
              fontFamily: DISPLAY, fontSize: 110,
              color: 'rgba(139,26,26,0.04)', lineHeight: 1, pointerEvents: 'none',
              userSelect: 'none',
            }}>✚</div>

            <div>
              <div style={{ fontFamily: MONO, fontSize: 13, color: '#5C0F0F', letterSpacing: '0.16em', marginBottom: 12, textTransform: 'uppercase' }}>
                ✦ Dispensaire Medical · Territoire des Ameriques
              </div>
              <div style={{ fontFamily: DISPLAY, fontSize: 38, color: '#D4C5B0', lineHeight: 1.15, letterSpacing: '0.02em' }}>
                Carnet Medical <span style={{ color: '#B52A2A' }}>RedM</span>
              </div>
              <div style={{ fontFamily: BODY, fontWeight: 400, fontSize: 18, color: '#6B5A48', marginTop: 10, letterSpacing: '0.04em' }}>
                Registre des soins et actes medicaux
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 22, paddingTop: 18, borderTop: '1px solid rgba(139,26,26,0.15)' }}>
              <div style={{ fontFamily: MONO, fontSize: 13, color: '#3A2A1E', textTransform: 'capitalize' }}>{date}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{ fontFamily: MONO, fontSize: 36, color: '#8B1A1A', lineHeight: 1, letterSpacing: '0.06em' }}>{time}</div>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 13, color: '#6B8B5E', letterSpacing: '0.10em', textTransform: 'uppercase' }}>✦ Ouvert</div>
                  <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 12, color: '#3A2A1E', letterSpacing: '0.08em', textTransform: 'uppercase' }}>En service</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── STATS ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {[
              { label: 'PATIENTS / 24H', val: '7',   unit: '',  col: '#8B1A1A' },
              { label: 'ACTES RÉALISÉS', val: '14',  unit: '',  col: '#6B8B5E' },
              { label: 'TAUX SURVIE',    val: '85',  unit: '%', col: '#B52A2A' },
              { label: 'JOURS EN POSTE', val: '312', unit: '',  col: '#5A7A8A' },
            ].map(v => (
              <div key={v.label} style={{ ...panel, padding: '16px 18px', borderBottom: `3px solid ${v.col}60` }}>
                <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 11, color: '#3A2A1E', letterSpacing: '0.10em', marginBottom: 10, textTransform: 'uppercase' }}>{v.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                  <span style={{ fontFamily: MONO, fontSize: 36, color: v.col, lineHeight: 1 }}>{v.val}</span>
                  {v.unit && <span style={{ fontFamily: MONO, fontSize: 16, color: v.col, opacity: 0.7 }}>{v.unit}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* ── SÉPARATEUR ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: DISPLAY, fontSize: 14, color: '#8B1A1A', whiteSpace: 'nowrap', letterSpacing: '0.06em' }}>Modules du Dispensaire</span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(139,26,26,0.50), transparent)' }} />
            <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 12, color: '#3A2A1E', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{MODULES.length} Services</span>
          </div>

          {/* ── MODULES ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {MODULES.map(m => {
              const h = hover === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => router.push(m.href)}
                  onMouseEnter={() => setHover(m.id)}
                  onMouseLeave={() => setHover(null)}
                  style={{
                    background: h ? '#1A0C0D' : '#120A0B',
                    border: `1px solid ${h ? m.color + '65' : 'rgba(139,26,26,0.22)'}`,
                    borderTop: `3px solid ${h ? m.color : m.color + '50'}`,
                    padding: '20px 18px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.20s',
                    transform: h ? 'translateY(-2px)' : 'none',
                    boxShadow: h ? `0 8px 28px rgba(0,0,0,0.7), 0 0 20px ${m.color}12` : '0 2px 10px rgba(0,0,0,0.5)',
                    display: 'flex', flexDirection: 'column', gap: 12,
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  {/* Croix décorative fond */}
                  <div style={{ position: 'absolute', bottom: 6, right: 10, fontFamily: DISPLAY, fontSize: 52, color: `${m.color}06`, lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>✚</div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ width: 58, height: 58, background: m.color + '10', border: `1px solid ${m.color + '40'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                      {m.icon}
                    </div>
                    <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 12, padding: '4px 11px', background: m.color + '14', color: m.color, border: `1px solid ${m.color + '38'}`, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
                      {m.badge}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontFamily: DISPLAY, fontSize: 18, color: '#D4C5B0', lineHeight: 1.2, marginBottom: 5 }}>{m.label}</div>
                    <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 11, color: m.color, letterSpacing: '0.12em', marginBottom: 8, textTransform: 'uppercase' }}>{m.sub}</div>
                    <div style={{ fontFamily: BODY, fontWeight: 400, fontSize: 14, color: '#6B5A48', lineHeight: 1.65 }}>{m.desc}</div>
                  </div>

                  <div style={{ paddingTop: 10, borderTop: `1px solid ${m.color + '20'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 11, color: '#2A1B0E', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Disponible</span>
                    <span style={{ fontFamily: MONO, fontSize: 14, color: h ? m.color : '#3A2A1E', transition: 'color 0.15s' }}>→ Consulter</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── URGENCE ── */}
          <div
            onClick={() => router.push('/redm/certificats/urgence')}
            style={{
              background: 'rgba(107,15,15,0.10)',
              border: '1px solid rgba(107,15,15,0.40)',
              borderLeft: '4px solid #6B0F0F',
              padding: '20px 30px',
              display: 'flex', alignItems: 'center', gap: 18,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: 32 }}>🚨</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 20, color: '#B52A2A' }}>Cas d'Urgence</div>
              <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 13, color: '#3A2A1E', letterSpacing: '0.07em', marginTop: 5, textTransform: 'uppercase' }}>Ouvrir immediatement un certificat d'urgence vitale</div>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 16, color: '#6B0F0F' }}>→ Intervenir</div>
          </div>

        </div>

        {/* ═══ COLONNE DROITE ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* État du dispensaire */}
          <div style={panel}>
            <div style={panelHead}>✦ Etat du Dispensaire</div>
            <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {ETAT.map(e => (
                <div key={e.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: BODY, fontWeight: 400, fontSize: 16, color: '#6B5A48' }}>{e.label}</span>
                  <span style={{ fontFamily: MONO, fontSize: 13, color: e.col, letterSpacing: '0.07em', textTransform: 'uppercase' }}>● {e.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Registre du jour */}
          <div style={panel}>
            <div style={panelHead}>✦ Registre du Jour</div>
            <div>
              {REGISTRE.map((l, i) => (
                <div key={i} style={{ padding: '12px 20px', borderBottom: i < REGISTRE.length - 1 ? '1px solid rgba(139,26,26,0.08)' : 'none', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.dot, marginTop: 6, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 12, color: '#3A2A1E', letterSpacing: '0.07em', marginBottom: 3 }}>{l.heure}</div>
                    <div style={{ fontFamily: BODY, fontWeight: 400, fontSize: 15, color: '#6B5A48', lineHeight: 1.5 }}>{l.msg}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Patients en salle */}
          <div style={panel}>
            <div style={panelHead}>✦ Patients en Salle</div>
            <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {PATIENTS.map(p => (
                <div key={p.nom} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.col, boxShadow: `0 0 5px ${p.col}`, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 16, color: '#A89880' }}>{p.nom}</div>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 12, color: p.col, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{p.etat}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Citation */}
          <div style={{ ...panel, padding: '18px 22px', borderLeft: '3px solid rgba(139,26,26,0.35)' }}>
            <div style={{ fontFamily: BODY, fontWeight: 300, fontSize: 17, color: '#6B5A48', lineHeight: 1.75, fontStyle: 'italic' }}>
              "Primum non nocere. La médecine du Far West exige autant de courage que de science."
            </div>
            <div style={{ fontFamily: MONO, fontSize: 12, color: '#3A2A1E', marginTop: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              — Dr. James Herrington, 1889
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
