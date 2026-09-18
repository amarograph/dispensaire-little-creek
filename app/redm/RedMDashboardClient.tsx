'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { hasPermission, type Permission } from '@/lib/permissions';

const DISPLAY = "'Rye', 'Georgia', serif";
const BODY    = "'Josefin Slab', 'Georgia', serif";
const MONO    = "'Special Elite', 'Courier New', monospace";

const MODULES: { id: string; href: string; icon: string; label: string; sub: string; desc: string; color: string; badge: string; perm?: Permission }[] = [
  { id: 'certificats',  href: '/redm/certificats',  icon: '📜', label: 'Certificats Médicaux',  sub: 'ACTES OFFICIELS',   desc: 'Rédiger et délivrer les certificats, ordonnances et attestations médicales.', color: '#A82020', badge: 'ACT' },
  { id: 'archives',     href: '/redm/archives',      icon: '🗄', label: 'Archives',               sub: 'REGISTRES',         desc: 'Consulter les registres de consultations et dossiers des patients.',           color: '#5A7848', badge: 'REG' },
  { id: 'bibliotheque', href: '/redm/bibliotheque',  icon: '📚', label: 'Bibliothèque',           sub: 'TRAITÉS & MANUELS', desc: "Traités médicaux, formulaires de remèdes et guides de soins de l'époque.",    color: '#486878', badge: 'REF', perm: 'bibliotheque' },
  { id: 'contexte',     href: '/redm/contexte',      icon: '🕰', label: "Contexte de l'Époque",   sub: 'FAR WEST · 1890',   desc: 'Histoire, maladies et pratiques médicales du Far West américain.',            color: '#705030', badge: 'HST' },
  { id: 'comptabilite', href: '/redm/comptabilite',  icon: '💰', label: 'Comptabilité',           sub: 'HONORAIRES',        desc: 'Registre des honoraires, factures et gestion des recettes du dispensaire.',   color: '#786030', badge: 'FIN', perm: 'comptabilite' },
  { id: 'essentiel',    href: '/redm/essentiel',     icon: '🏥', label: "L'Essentiel du Médecin", sub: 'PROTOCOLES',        desc: "Guides de soins d'urgence, antidotes et protocoles médicaux essentiels.",     color: '#7A1515', badge: 'URG' },
  { id: 'cabinet',      href: '/redm/cabinet',       icon: '🕯', label: 'Cabinet Thérapeutique',  sub: 'SÉANCES',           desc: 'Espace réservé aux séances et suivis thérapeutiques.',                        color: '#5A4878', badge: 'THÉ', perm: 'cabinet' },
  { id: 'direction',    href: '/admin',              icon: '🛡', label: 'Direction',              sub: 'ADMINISTRATION',    desc: "Gestion des accès, des rôles et des paramètres du dispensaire.",              color: '#8A6A2A', badge: 'DIR', perm: 'direction' },
];

const REGISTRE = [
  { heure: '08h14', msg: 'Consultation — blessure par balle, M. Calloway', dot: '#7A1515' },
  { heure: '07h42', msg: "Délivrance d'un certificat de bonne santé",      dot: '#5A7848' },
  { heure: '06h55', msg: "Arrivée d'un convoi — 3 blessés du ranch Ford",  dot: '#A82020' },
  { heure: '06h10', msg: 'Renouvellement du stock de laudanum',             dot: '#486878' },
];

const ETAT = [
  { label: 'Lits disponibles',  val: '3 / 6',    col: '#5A9A58' },
  { label: 'Chirurgien',        val: 'PRÉSENT',   col: '#5A9A58' },
  { label: 'Stock morphine',    val: 'SUFFISANT', col: '#C8A040' },
  { label: 'Épidémie déclarée', val: 'AUCUNE',    col: '#5A9A58' },
];

const PATIENTS = [
  { nom: 'Elijah Calloway',  etat: 'Stable',     col: '#5A9A58' },
  { nom: 'Mary Sue Henkel',  etat: 'Critique',   col: '#C83030' },
  { nom: 'Tom "Buck" Walsh', etat: 'Soigné',     col: '#4888A8' },
  { nom: 'Rev. John Marsh',  etat: 'En attente', col: '#C8A040' },
];

const CARD_BG   = 'rgba(10,5,7,0.92)';
const CARD_BG_H = 'rgba(20,8,10,0.97)';

const PANEL: React.CSSProperties = {
  background: 'rgba(10,5,7,0.92)',
  border: '1px solid rgba(150,30,30,0.35)',
};
const PANEL_HEAD: React.CSSProperties = {
  padding: '14px 22px',
  borderBottom: '1px solid rgba(150,30,30,0.22)',
  fontFamily: DISPLAY,
  fontSize: 15,
  color: '#D04040',
  letterSpacing: '0.10em',
  background: 'rgba(120,20,20,0.08)',
  textTransform: 'uppercase' as const,
};

export default function RedMDashboardClient({ roles }: { roles: string[] }) {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);
  const [time, setTime] = useState('──:──');
  const [date, setDate] = useState('');
  const visibleModules = MODULES.filter(m => !m.perm || hasPermission(roles, m.perm));

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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 20, alignItems: 'start' }}>

        {/* ═══ COLONNE GAUCHE ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* ── EN-TÊTE ── */}
          <div style={{ ...PANEL, borderLeft: '4px solid #6A1515', padding: '28px 34px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 10, right: 28, fontFamily: DISPLAY, fontSize: 110, color: 'rgba(140,30,30,0.06)', lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>✚</div>

            <div>
              <div style={{ fontFamily: MONO, fontSize: 14, color: '#8A6A5A', letterSpacing: '0.16em', marginBottom: 12, textTransform: 'uppercase' }}>
                ✦ Dispensaire Medical · Territoire des Ameriques
              </div>
              <div style={{ fontFamily: DISPLAY, fontSize: 42, color: '#E8D8C0', lineHeight: 1.15 }}>
                Carnet Medical <span style={{ color: '#D04040' }}>RedM</span>
              </div>
              <div style={{ fontFamily: BODY, fontWeight: 400, fontSize: 20, color: '#B0A090', marginTop: 10, letterSpacing: '0.04em' }}>
                Registre des soins et actes medicaux
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 22, paddingTop: 18, borderTop: '1px solid rgba(150,30,30,0.20)' }}>
              <div style={{ fontFamily: MONO, fontSize: 15, color: '#B0A090', textTransform: 'capitalize' }}>{date}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{ fontFamily: MONO, fontSize: 40, color: '#C03030', lineHeight: 1, letterSpacing: '0.06em' }}>{time}</div>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 14, color: '#60B060', letterSpacing: '0.10em', textTransform: 'uppercase' }}>✦ Ouvert</div>
                  <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 13, color: '#A09080', letterSpacing: '0.08em', textTransform: 'uppercase' }}>En service</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── STATS ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {[
              { label: 'PATIENTS / 24H', val: '7',   unit: '',  col: '#C03030' },
              { label: 'ACTES RÉALISÉS', val: '14',  unit: '',  col: '#5A9A58' },
              { label: 'TAUX SURVIE',    val: '85',  unit: '%', col: '#D04040' },
              { label: 'JOURS EN POSTE', val: '312', unit: '',  col: '#4888A8' },
            ].map(v => (
              <div key={v.label} style={{ ...PANEL, padding: '16px 18px', borderBottom: `3px solid ${v.col}` }}>
                <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 12, color: '#C0B0A0', letterSpacing: '0.10em', marginBottom: 10, textTransform: 'uppercase' }}>{v.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                  <span style={{ fontFamily: MONO, fontSize: 40, color: v.col, lineHeight: 1 }}>{v.val}</span>
                  {v.unit && <span style={{ fontFamily: MONO, fontSize: 18, color: v.col, opacity: 0.8 }}>{v.unit}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* ── SÉPARATEUR ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: DISPLAY, fontSize: 16, color: '#C03030', whiteSpace: 'nowrap', letterSpacing: '0.06em' }}>Modules du Dispensaire</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(180,40,40,0.50)' }} />
            <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 13, color: '#A09080', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{visibleModules.length} Services</span>
          </div>

          {/* ── MODULES ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {visibleModules.map(m => {
              const h = hover === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => router.push(m.href)}
                  onMouseEnter={() => setHover(m.id)}
                  onMouseLeave={() => setHover(null)}
                  style={{
                    background: h ? CARD_BG_H : CARD_BG,
                    border: `1px solid ${h ? m.color + '70' : 'rgba(150,30,30,0.30)'}`,
                    borderTop: `3px solid ${h ? m.color : m.color + '66'}`,
                    padding: '20px 18px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.18s',
                    transform: h ? 'translateY(-2px)' : 'none',
                    boxShadow: h ? `0 8px 25px rgba(0,0,0,0.80)` : '0 2px 10px rgba(0,0,0,0.55)',
                    display: 'flex', flexDirection: 'column', gap: 12,
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  <div style={{ position: 'absolute', bottom: 6, right: 10, fontFamily: DISPLAY, fontSize: 52, color: `${m.color}09`, lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>✚</div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ width: 56, height: 56, background: m.color + '12', border: `1px solid ${m.color + '40'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                      {m.icon}
                    </div>
                    <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 12, padding: '4px 10px', background: m.color + '18', color: m.color === '#705030' || m.color === '#786030' ? '#D4A860' : m.color, border: `1px solid ${m.color + '40'}`, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
                      {m.badge}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontFamily: DISPLAY, fontSize: 20, color: '#E8D8C0', lineHeight: 1.2, marginBottom: 5 }}>{m.label}</div>
                    <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 12, color: m.color === '#705030' || m.color === '#786030' ? '#D4A860' : m.color, letterSpacing: '0.12em', marginBottom: 8, textTransform: 'uppercase' }}>{m.sub}</div>
                    <div style={{ fontFamily: BODY, fontWeight: 400, fontSize: 15, color: '#C0B0A0', lineHeight: 1.65 }}>{m.desc}</div>
                  </div>

                  <div style={{ paddingTop: 10, borderTop: `1px solid ${m.color + '25'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 12, color: '#A09080', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Disponible</span>
                    <span style={{ fontFamily: MONO, fontSize: 14, color: h ? (m.color === '#705030' || m.color === '#786030' ? '#D4A860' : m.color) : '#A09080', transition: 'color 0.15s' }}>→ Consulter</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── URGENCE ── */}
          <div
            onClick={() => router.push('/redm/certificats/urgence')}
            style={{
              background: 'rgba(60,5,5,0.45)',
              border: '1px solid rgba(140,20,20,0.55)',
              borderLeft: '4px solid #8A1515',
              padding: '22px 30px',
              display: 'flex', alignItems: 'center', gap: 18,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: 36 }}>🚨</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 22, color: '#D04040' }}>Cas d'Urgence</div>
              <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 15, color: '#C0B0A0', letterSpacing: '0.07em', marginTop: 5, textTransform: 'uppercase' }}>Ouvrir immediatement un certificat d'urgence vitale</div>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 18, color: '#C03030' }}>→ Intervenir</div>
          </div>

        </div>

        {/* ═══ COLONNE DROITE ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* État du dispensaire */}
          <div style={PANEL}>
            <div style={PANEL_HEAD}>✦ Etat du Dispensaire</div>
            <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {ETAT.map(e => (
                <div key={e.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: BODY, fontWeight: 400, fontSize: 17, color: '#D0C0B0' }}>{e.label}</span>
                  <span style={{ fontFamily: MONO, fontSize: 13, color: e.col, letterSpacing: '0.07em', textTransform: 'uppercase' }}>● {e.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Registre du jour */}
          <div style={PANEL}>
            <div style={PANEL_HEAD}>✦ Registre du Jour</div>
            <div>
              {REGISTRE.map((l, i) => (
                <div key={i} style={{ padding: '13px 22px', borderBottom: i < REGISTRE.length - 1 ? '1px solid rgba(150,30,30,0.10)' : 'none', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: l.dot, marginTop: 6, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 13, color: '#C0A880', letterSpacing: '0.07em', marginBottom: 4 }}>{l.heure}</div>
                    <div style={{ fontFamily: BODY, fontWeight: 400, fontSize: 16, color: '#D0C0B0', lineHeight: 1.55 }}>{l.msg}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Patients en salle */}
          <div style={PANEL}>
            <div style={PANEL_HEAD}>✦ Patients en Salle</div>
            <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {PATIENTS.map(p => (
                <div key={p.nom} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: p.col, boxShadow: `0 0 5px ${p.col}`, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 17, color: '#E0D0C0' }}>{p.nom}</div>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 13, color: p.col, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{p.etat}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Citation */}
          <div style={{ ...PANEL, padding: '20px 24px', borderLeft: '3px solid rgba(160,40,40,0.50)' }}>
            <div style={{ fontFamily: BODY, fontWeight: 300, fontSize: 17, color: '#C8B8A8', lineHeight: 1.80, fontStyle: 'italic' }}>
              "Primum non nocere. La médecine du Far West exige autant de courage que de science."
            </div>
            <div style={{ fontFamily: MONO, fontSize: 12, color: '#907060', marginTop: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              — Dr. James Herrington, 1889
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
