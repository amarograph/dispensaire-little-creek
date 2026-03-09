'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const SERIF   = "'Playfair Display', 'Georgia', serif";
const FELL    = "'IM Fell English', 'Georgia', serif";
const MONO    = "'Courier Prime', 'Courier New', monospace";

const MODULES = [
  { id: 'certificats',  href: '/redm/certificats',  icon: '📜', label: 'Certificats Médicaux',  sub: 'ACTES OFFICIELS',   desc: 'Rédiger et délivrer les certificats, ordonnances et attestations médicales.', color: '#C8932A', badge: 'ACT', ornament: '✦' },
  { id: 'archives',     href: '/redm/archives',      icon: '🗄', label: 'Archives',               sub: 'REGISTRES',         desc: 'Consulter les registres de consultations et dossiers des patients.',           color: '#8B9E6A', badge: 'REG', ornament: '◈' },
  { id: 'bibliotheque', href: '/redm/bibliotheque',  icon: '📚', label: 'Bibliothèque',           sub: 'TRAITÉS & MANUELS', desc: "Traités médicaux, formulaires de remèdes et guides de soins de l'époque.",    color: '#7A9AAA', badge: 'REF', ornament: '⊕' },
  { id: 'contexte',     href: '/redm/contexte',      icon: '🕰', label: "Contexte de l'Époque",   sub: 'FAR WEST · 1890',   desc: 'Histoire, maladies et pratiques médicales du Far West américain.',            color: '#A8845A', badge: 'HST', ornament: '⌛' },
  { id: 'comptabilite', href: '/redm/comptabilite',  icon: '💰', label: 'Comptabilité',           sub: 'HONORAIRES',        desc: 'Registre des honoraires, factures et gestion des recettes du dispensaire.',   color: '#C8932A', badge: 'FIN', ornament: '$' },
  { id: 'essentiel',    href: '/redm/essentiel',     icon: '🏥', label: "L'Essentiel du Médecin", sub: 'PROTOCOLES',        desc: "Guides de soins d'urgence, antidotes et protocoles médicaux essentiels.",     color: '#C87070', badge: 'URG', ornament: '✚' },
];

const REGISTRE = [
  { heure: '08h14', msg: 'Consultation — blessure par balle, M. Calloway', dot: '#C87070' },
  { heure: '07h42', msg: "Délivrance d'un certificat de bonne santé",      dot: '#8B9E6A' },
  { heure: '06h55', msg: 'Arrivée d\'un convoi — 3 blessés du ranch Ford',  dot: '#C8932A' },
  { heure: '06h10', msg: 'Renouvellement du stock de laudanum',              dot: '#7A9AAA' },
];

const ETAT = [
  { label: 'Lits disponibles',  val: '3 / 6',    col: '#8B9E6A' },
  { label: 'Chirurgien',        val: 'PRÉSENT',   col: '#8B9E6A' },
  { label: 'Stock morphine',    val: 'SUFFISANT', col: '#C8932A' },
  { label: 'Épidémie déclarée', val: 'AUCUNE',    col: '#8B9E6A' },
];

const PATIENTS = [
  { nom: 'Elijah Calloway',  etat: 'Stable',     col: '#8B9E6A' },
  { nom: 'Mary Sue Henkel',  etat: 'Critique',   col: '#C87070' },
  { nom: 'Tom "Buck" Walsh', etat: 'Soigné',     col: '#7A9AAA' },
  { nom: 'Rev. John Marsh',  etat: 'En attente', col: '#C8932A' },
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

  const panel = { background: '#1A1008', border: '1px solid rgba(200,147,42,0.25)' };

  const panelHead = {
    padding: '16px 22px',
    borderBottom: '1px solid rgba(200,147,42,0.15)',
    fontFamily: SERIF,
    fontSize: 17,
    fontStyle: 'italic' as const,
    color: '#C8932A',
    letterSpacing: '0.12em',
    background: 'rgba(200,147,42,0.04)',
    textTransform: 'uppercase' as const,
  };

  return (
    <div style={{ fontFamily: FELL }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 20, alignItems: 'start' }}>

        {/* ═══ COLONNE GAUCHE ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* ── EN-TÊTE ── */}
          <div style={{ ...panel, borderLeft: '4px solid #8B3A1A', padding: '28px 34px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 10, right: 24, fontFamily: SERIF, fontSize: 90, color: 'rgba(200,147,42,0.05)', fontStyle: 'italic', lineHeight: 1 }}>✚</div>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 15, color: '#8B3A1A', letterSpacing: '0.18em', marginBottom: 12, textTransform: 'uppercase' }}>
                ✦ Dispensaire médical · Territoire des Amériques
              </div>
              <div style={{ fontFamily: SERIF, fontSize: 46, fontWeight: 700, color: '#E8DCC8', lineHeight: 1.1, fontStyle: 'italic' }}>
                Carnet Médical <span style={{ color: '#C8932A' }}>RedM</span>
              </div>
              <div style={{ fontFamily: FELL, fontSize: 20, color: '#7A6850', marginTop: 10, fontStyle: 'italic' }}>
                Registre des soins et actes médicaux
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 20 }}>
              <div style={{ fontFamily: MONO, fontSize: 14, color: '#4A3520', textTransform: 'capitalize' }}>{date}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontFamily: MONO, fontSize: 38, color: '#C8932A', lineHeight: 1, letterSpacing: '0.06em' }}>{time}</div>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 14, color: '#8B9E6A', letterSpacing: '0.10em', textTransform: 'uppercase' }}>✦ Ouvert</div>
                  <div style={{ fontFamily: MONO, fontSize: 13, color: '#4A3520', letterSpacing: '0.08em', textTransform: 'uppercase' }}>En service</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── STATS ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {[
              { label: 'PATIENTS / 24H', val: '7',   unit: '',  col: '#C8932A' },
              { label: 'ACTES RÉALISÉS', val: '14',  unit: '',  col: '#8B9E6A' },
              { label: 'TAUX SURVIE',    val: '85',  unit: '%', col: '#C87070' },
              { label: 'JOURS EN POSTE', val: '312', unit: '',  col: '#7A9AAA' },
            ].map(v => (
              <div key={v.label} style={{ ...panel, padding: '18px 20px', borderBottom: `3px solid ${v.col}45` }}>
                <div style={{ fontFamily: MONO, fontSize: 13, color: '#4A3520', letterSpacing: '0.08em', marginBottom: 10, textTransform: 'uppercase' }}>{v.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontFamily: MONO, fontSize: 38, color: v.col, lineHeight: 1 }}>{v.val}</span>
                  {v.unit && <span style={{ fontFamily: MONO, fontSize: 18, color: v.col, opacity: 0.7 }}>{v.unit}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* ── SÉPARATEUR ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: SERIF, fontSize: 18, color: '#C8932A', fontStyle: 'italic', whiteSpace: 'nowrap', letterSpacing: '0.10em' }}>✦ Modules du Dispensaire</span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(200,147,42,0.4), transparent)' }} />
            <span style={{ fontFamily: MONO, fontSize: 14, color: '#4A3520', letterSpacing: '0.08em' }}>{MODULES.length} SERVICES</span>
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
                    background: h ? '#221408' : '#1A1008',
                    border: `1px solid ${h ? m.color + '70' : 'rgba(200,147,42,0.20)'}`,
                    borderTop: `3px solid ${h ? m.color : m.color + '55'}`,
                    padding: '24px 20px 18px',
                    cursor: 'pointer',
                    transition: 'all 0.20s',
                    transform: h ? 'translateY(-3px)' : 'none',
                    boxShadow: h ? `0 8px 28px rgba(0,0,0,0.6), 0 0 18px ${m.color}14` : '0 2px 10px rgba(0,0,0,0.4)',
                    display: 'flex', flexDirection: 'column', gap: 14,
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  <div style={{ position: 'absolute', bottom: 8, right: 12, fontFamily: SERIF, fontSize: 52, color: `${m.color}08`, fontStyle: 'italic', lineHeight: 1, pointerEvents: 'none' }}>{m.ornament}</div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ width: 64, height: 64, background: m.color + '12', border: `1px solid ${m.color + '45'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                      {m.icon}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 14, padding: '5px 13px', background: m.color + '15', color: m.color, border: `1px solid ${m.color + '40'}`, letterSpacing: '0.10em' }}>
                      {m.badge}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontFamily: SERIF, fontWeight: 700, fontStyle: 'italic', fontSize: 24, color: '#E8DCC8', lineHeight: 1.15, marginBottom: 6 }}>{m.label}</div>
                    <div style={{ fontFamily: MONO, fontSize: 13, color: m.color, letterSpacing: '0.14em', marginBottom: 10, textTransform: 'uppercase' }}>{m.sub}</div>
                    <div style={{ fontFamily: FELL, fontSize: 16, color: '#7A6850', lineHeight: 1.6, fontStyle: 'italic' }}>{m.desc}</div>
                  </div>

                  <div style={{ paddingTop: 12, borderTop: `1px solid ${m.color + '25'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: MONO, fontSize: 13, color: '#2A1B0E', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Disponible</span>
                    <span style={{ fontFamily: FELL, fontSize: 17, fontStyle: 'italic', color: h ? m.color : '#4A3520', transition: 'color 0.15s' }}>→ Consulter</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── URGENCE ── */}
          <div onClick={() => router.push('/redm/certificats/urgence')} style={{ background: 'rgba(139,58,26,0.08)', border: '1px solid rgba(139,58,26,0.35)', borderLeft: '4px solid #8B3A1A', padding: '22px 32px', display: 'flex', alignItems: 'center', gap: 20, cursor: 'pointer' }}>
            <div style={{ fontSize: 36 }}>🚨</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: SERIF, fontWeight: 700, fontStyle: 'italic', fontSize: 25, color: '#C87070', letterSpacing: '0.04em' }}>Cas d'Urgence</div>
              <div style={{ fontFamily: MONO, fontSize: 14, color: '#4A3520', letterSpacing: '0.08em', marginTop: 4, textTransform: 'uppercase' }}>Ouvrir immédiatement un certificat d'urgence vitale</div>
            </div>
            <div style={{ fontFamily: FELL, fontSize: 19, fontStyle: 'italic', color: '#8B3A1A' }}>→ Intervenir</div>
          </div>

        </div>

        {/* ═══ COLONNE DROITE ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* État du dispensaire */}
          <div style={panel}>
            <div style={panelHead}>✦ État du Dispensaire</div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {ETAT.map(e => (
                <div key={e.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: FELL, fontStyle: 'italic', fontSize: 17, color: '#7A6850' }}>{e.label}</span>
                  <span style={{ fontFamily: MONO, fontSize: 15, color: e.col, letterSpacing: '0.07em', textTransform: 'uppercase' }}>● {e.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Registre du jour */}
          <div style={panel}>
            <div style={panelHead}>✦ Registre du Jour</div>
            <div>
              {REGISTRE.map((l, i) => (
                <div key={i} style={{ padding: '14px 20px', borderBottom: i < REGISTRE.length - 1 ? '1px solid rgba(200,147,42,0.07)' : 'none', display: 'flex', alignItems: 'flex-start', gap: 13 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.dot, marginTop: 6, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 14, color: '#4A3520', letterSpacing: '0.07em', marginBottom: 3 }}>{l.heure}</div>
                    <div style={{ fontFamily: FELL, fontStyle: 'italic', fontSize: 16, color: '#7A6850', lineHeight: 1.5 }}>{l.msg}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Patients en salle */}
          <div style={panel}>
            <div style={panelHead}>✦ Patients en Salle</div>
            <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {PATIENTS.map(p => (
                <div key={p.nom} style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.col, boxShadow: `0 0 6px ${p.col}`, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 17, color: '#B8A888' }}>{p.nom}</div>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 14, color: p.col, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{p.etat}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Citation */}
          <div style={{ ...panel, padding: '20px 22px', borderLeft: '3px solid rgba(200,147,42,0.30)' }}>
            <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 18, color: '#7A6850', lineHeight: 1.75 }}>
              "Primum non nocere. La médecine du Far West exige autant de courage que de science."
            </div>
            <div style={{ fontFamily: MONO, fontSize: 13, color: '#4A3520', marginTop: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              — Dr. James Herrington, 1889
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
