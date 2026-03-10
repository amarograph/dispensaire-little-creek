'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const DISPLAY = "'Rye', 'Georgia', serif";
const BODY    = "'Josefin Slab', 'Georgia', serif";
const MONO    = "'Special Elite', 'Courier New', monospace";

const MODULES = [
  { id: 'certificats',  href: '/redm/certificats',  icon: '📜', label: 'Certificats Médicaux',  sub: 'ACTES OFFICIELS',   desc: 'Rédiger et délivrer les certificats, ordonnances et attestations médicales.', color: '#A82020', badge: 'ACT' },
  { id: 'archives',     href: '/redm/archives',      icon: '🗄', label: 'Archives',               sub: 'REGISTRES',         desc: 'Consulter les registres de consultations et dossiers des patients.',           color: '#5A7848', badge: 'REG' },
  { id: 'bibliotheque', href: '/redm/bibliotheque',  icon: '📚', label: 'Bibliothèque',           sub: 'TRAITÉS & MANUELS', desc: "Traités médicaux, formulaires de remèdes et guides de soins de l'époque.",    color: '#486878', badge: 'REF' },
  { id: 'contexte',     href: '/redm/contexte',      icon: '🕰', label: "Contexte de l'Époque",   sub: 'FAR WEST · 1890',   desc: 'Histoire, maladies et pratiques médicales du Far West américain.',            color: '#705030', badge: 'HST' },
  { id: 'comptabilite', href: '/redm/comptabilite',  icon: '💰', label: 'Comptabilité',           sub: 'HONORAIRES',        desc: 'Registre des honoraires, factures et gestion des recettes du dispensaire.',   color: '#786030', badge: 'FIN' },
  { id: 'essentiel',    href: '/redm/essentiel',     icon: '🏥', label: "L'Essentiel du Médecin", sub: 'PROTOCOLES',        desc: "Guides de soins d'urgence, antidotes et protocoles médicaux essentiels.",     color: '#7A1515', badge: 'URG' },
];

const REGISTRE = [
  { heure: '08h14', msg: 'Consultation — blessure par balle, M. Calloway', dot: '#7A1515' },
  { heure: '07h42', msg: "Délivrance d'un certificat de bonne santé",      dot: '#5A7848' },
  { heure: '06h55', msg: "Arrivée d'un convoi — 3 blessés du ranch Ford",  dot: '#A82020' },
  { heure: '06h10', msg: 'Renouvellement du stock de laudanum',             dot: '#486878' },
];

const ETAT = [
  { label: 'Lits disponibles',  val: '3 / 6',    col: '#5A7848' },
  { label: 'Chirurgien',        val: 'PRÉSENT',   col: '#5A7848' },
  { label: 'Stock morphine',    val: 'SUFFISANT', col: '#786030' },
  { label: 'Épidémie déclarée', val: 'AUCUNE',    col: '#5A7848' },
];

const PATIENTS = [
  { nom: 'Elijah Calloway',  etat: 'Stable',     col: '#5A7848' },
  { nom: 'Mary Sue Henkel',  etat: 'Critique',   col: '#7A1515' },
  { nom: 'Tom "Buck" Walsh', etat: 'Soigné',     col: '#486878' },
  { nom: 'Rev. John Marsh',  etat: 'En attente', col: '#786030' },
];

// Couleurs des cards — fond très sombre, pas de dégradé
const CARD_BG      = 'rgba(10,5,7,0.92)';
const CARD_BG_H    = 'rgba(16,6,8,0.97)';
const PANEL: React.CSSProperties = {
  background: 'rgba(10,5,7,0.92)',
  border: '1px solid rgba(120,20,20,0.30)',
};
const PANEL_HEAD: React.CSSProperties = {
  padding: '14px 22px',
  borderBottom: '1px solid rgba(120,20,20,0.18)',
  fontFamily: DISPLAY,
  fontSize: 13,
  color: '#A82020',
  letterSpacing: '0.10em',
  background: 'rgba(120,20,20,0.05)',
  textTransform: 'uppercase' as const,
};

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

  return (
    <div style={{ fontFamily: BODY }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 20, alignItems: 'start' }}>

        {/* ═══ COLONNE GAUCHE ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* ── EN-TÊTE ── */}
          <div style={{ ...PANEL, borderLeft: '4px solid #4A0A0A', padding: '28px 34px', position: 'relative', overflow: 'hidden' }}>
            {/* Croix décorative fond */}
            <div style={{ position: 'absolute', top: 10, right: 28, fontFamily: DISPLAY, fontSize: 110, color: 'rgba(120,20,20,0.04)', lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>✚</div>

            <div>
              <div style={{ fontFamily: MONO, fontSize: 13, color: '#4A0A0A', letterSpacing: '0.16em', marginBottom: 12, textTransform: 'uppercase' }}>
                ✦ Dispensaire Medical · Territoire des Ameriques
              </div>
              <div style={{ fontFamily: DISPLAY, fontSize: 38, color: '#C8B8A0', lineHeight: 1.15 }}>
                Carnet Medical <span style={{ color: '#A82020' }}>RedM</span>
              </div>
              <div style={{ fontFamily: BODY, fontWeight: 400, fontSize: 18, color: '#5A4A38', marginTop: 10, letterSpacing: '0.04em' }}>
                Registre des soins et actes medicaux
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 22, paddingTop: 18, borderTop: '1px solid rgba(120,20,20,0.15)' }}>
              <div style={{ fontFamily: MONO, fontSize: 13, color: '#2E2018', textTransform: 'capitalize' }}>{date}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{ fontFamily: MONO, fontSize: 36, color: '#7A1515', lineHeight: 1, letterSpacing: '0.06em' }}>{time}</div>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 13, color: '#5A7848', letterSpacing: '0.10em', textTransform: 'uppercase' }}>✦ Ouvert</div>
                  <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 12, color: '#2E2018', letterSpacing: '0.08em', textTransform: 'uppercase' }}>En service</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── STATS ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {[
              { label: 'PATIENTS / 24H', val: '7',   unit: '',  col: '#7A1515' },
              { label: 'ACTES RÉALISÉS', val: '14',  unit: '',  col: '#5A7848' },
              { label: 'TAUX SURVIE',    val: '85',  unit: '%', col: '#A82020' },
              { label: 'JOURS EN POSTE', val: '312', unit: '',  col: '#486878' },
            ].map(v => (
              <div key={v.label} style={{ ...PANEL, padding: '16px 18px', borderBottom: `3px solid ${v.col}` }}>
                <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 11, color: '#2E2018', letterSpacing: '0.10em', marginBottom: 10, textTransform: 'uppercase' }}>{v.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                  <span style={{ fontFamily: MONO, fontSize: 36, color: v.col, lineHeight: 1 }}>{v.val}</span>
                  {v.unit && <span style={{ fontFamily: MONO, fontSize: 16, color: v.col, opacity: 0.7 }}>{v.unit}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* ── SÉPARATEUR ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: DISPLAY, fontSize: 14, color: '#7A1515', whiteSpace: 'nowrap', letterSpacing: '0.06em' }}>Modules du Dispensaire</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(120,20,20,0.45)' }} />
            <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 12, color: '#2E2018', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{MODULES.length} Services</span>
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
                    background: h ? CARD_BG_H : CARD_BG,
                    border: `1px solid ${h ? m.color + '60' : 'rgba(120,20,20,0.25)'}`,
                    borderTop: `3px solid ${h ? m.color : m.color + '55'}`,
                    padding: '20px 18px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.18s',
                    transform: h ? 'translateY(-2px)' : 'none',
                    boxShadow: h ? `0 8px 25px rgba(0,0,0,0.75)` : '0 2px 10px rgba(0,0,0,0.55)',
                    display: 'flex', flexDirection: 'column', gap: 12,
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  {/* Croix fond */}
                  <div style={{ position: 'absolute', bottom: 6, right: 10, fontFamily: DISPLAY, fontSize: 52, color: `${m.color}07`, lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>✚</div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ width: 56, height: 56, background: m.color + '0E', border: `1px solid ${m.color + '35'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
                      {m.icon}
                    </div>
                    <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 11, padding: '4px 10px', background: m.color + '12', color: m.color, border: `1px solid ${m.color + '35'}`, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
                      {m.badge}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontFamily: DISPLAY, fontSize: 18, color: '#C8B8A0', lineHeight: 1.2, marginBottom: 5 }}>{m.label}</div>
                    <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 11, color: m.color, letterSpacing: '0.12em', marginBottom: 8, textTransform: 'uppercase' }}>{m.sub}</div>
                    <div style={{ fontFamily: BODY, fontWeight: 400, fontSize: 14, color: '#5A4A38', lineHeight: 1.65 }}>{m.desc}</div>
                  </div>

                  <div style={{ paddingTop: 10, borderTop: `1px solid ${m.color + '20'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 11, color: '#2E2018', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Disponible</span>
                    <span style={{ fontFamily: MONO, fontSize: 13, color: h ? m.color : '#2E2018', transition: 'color 0.15s' }}>→ Consulter</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── URGENCE ── */}
          <div
            onClick={() => router.push('/redm/certificats/urgence')}
            style={{
              background: 'rgba(50,5,5,0.35)',
              border: '1px solid rgba(100,15,15,0.45)',
              borderLeft: '4px solid #4A0A0A',
              padding: '20px 30px',
              display: 'flex', alignItems: 'center', gap: 18,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: 32 }}>🚨</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 20, color: '#A82020' }}>Cas d'Urgence</div>
              <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 13, color: '#2E2018', letterSpacing: '0.07em', marginTop: 5, textTransform: 'uppercase' }}>Ouvrir immediatement un certificat d'urgence vitale</div>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 16, color: '#5A0A0A' }}>→ Intervenir</div>
          </div>

        </div>

        {/* ═══ COLONNE DROITE ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* État du dispensaire */}
          <div style={PANEL}>
            <div style={PANEL_HEAD}>✦ Etat du Dispensaire</div>
            <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {ETAT.map(e => (
                <div key={e.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: BODY, fontWeight: 400, fontSize: 16, color: '#5A4A38' }}>{e.label}</span>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: e.col, letterSpacing: '0.07em', textTransform: 'uppercase' }}>● {e.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Registre du jour */}
          <div style={PANEL}>
            <div style={PANEL_HEAD}>✦ Registre du Jour</div>
            <div>
              {REGISTRE.map((l, i) => (
                <div key={i} style={{ padding: '12px 20px', borderBottom: i < REGISTRE.length - 1 ? '1px solid rgba(120,20,20,0.08)' : 'none', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.dot, marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 12, color: '#2E2018', letterSpacing: '0.07em', marginBottom: 3 }}>{l.heure}</div>
                    <div style={{ fontFamily: BODY, fontWeight: 400, fontSize: 15, color: '#5A4A38', lineHeight: 1.5 }}>{l.msg}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Patients en salle */}
          <div style={PANEL}>
            <div style={PANEL_HEAD}>✦ Patients en Salle</div>
            <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {PATIENTS.map(p => (
                <div key={p.nom} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.col, boxShadow: `0 0 4px ${p.col}`, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 16, color: '#9A8870' }}>{p.nom}</div>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 12, color: p.col, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{p.etat}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Citation */}
          <div style={{ ...PANEL, padding: '18px 22px', borderLeft: '3px solid rgba(120,20,20,0.40)' }}>
            <div style={{ fontFamily: BODY, fontWeight: 300, fontSize: 16, color: '#5A4A38', lineHeight: 1.75, fontStyle: 'italic' }}>
              "Primum non nocere. La médecine du Far West exige autant de courage que de science."
            </div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: '#2E2018', marginTop: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              — Dr. James Herrington, 1889
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
