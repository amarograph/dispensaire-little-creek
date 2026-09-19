'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { isAdmin as checkIsAdmin } from '@/lib/permissions';
import { DEFAULT_DISPENSAIRE_STATUS, sanitaireColor, sanitaireLabel, type DispensaireStatus } from './_lib/sanitaireListes';

const DISPLAY = "'Rye', 'Georgia', serif";
const BODY    = "'Josefin Slab', 'Georgia', serif";
const MONO    = "'Special Elite', 'Courier New', monospace";

const MODULES = [
  { id: 'comptabilite', href: '/redm/comptabilite',  icon: '💰', label: 'Caisse et Comptabilité', sub: 'HONORAIRES & RECETTES', desc: 'Enregistrer les honoraires, suivre les paiements et consulter les comptes du dispensaire.', color: '#C8A850', badge: 'FIN' },
  { id: 'inventaire',   href: '/redm/inventaire',    icon: '📦', label: 'Inventaire',             sub: 'STOCKS DU DISPENSAIRE', desc: "Consulter l'état des stocks de plantes et de produits médicaux du dispensaire.", color: '#8B6F47', badge: 'INV' },
  { id: 'bibliotheque', href: '/redm/bibliotheque',  icon: '📚', label: 'Bibliothèque',           sub: 'TRAITÉS & MANUELS', desc: "Traités médicaux, formulaires de remèdes et guides de soins de l'époque.",    color: '#486878', badge: 'REF' },
  { id: 'archives',     href: '/redm/archives',      icon: '🗄', label: 'Archives',               sub: 'REGISTRES',         desc: 'Consulter les registres de consultations et dossiers des patients.',           color: '#5A7848', badge: 'REG' },
  { id: 'agenda',       href: '/redm/agenda',        icon: '📅', label: 'Agenda',                 sub: 'RENDEZ-VOUS',       desc: 'Planifier et consulter les rendez-vous du dispensaire. RDV du cabinet anonymisés.', color: '#486060', badge: 'AGD' },
  { id: 'cabinet',      href: '/redm/cabinet',       icon: '🛋', label: 'Cabinet Thérapeutique',  sub: "SOINS DE L'ÂME",   desc: "Suivi psychologique, consultations de l'esprit et thérapies de l'époque.",   color: '#4A6048', badge: 'PSY' },
  { id: 'direction',    href: '/redm/direction',     icon: '🏛', label: 'Direction',              sub: 'ACCÈS RÉSERVÉ',     desc: 'Comptabilité et gestion administrative du dispensaire — direction & co-direction.', color: '#C8A850', badge: 'DIR' },
];

const DEFAULT_DISPENSAIRE = {
  labelMedecins: 'Médecins',
  labelRisque:   'Risque sanitaire',
  labelEpidemie: 'Épidémie en cours',
  alertMessage: 'Risque sanitaire élevé ou épidémie en cours, veuillez vous protéger et respecter les protocoles à la lettre pour votre sécurité.',
  alertMessageCritique: 'ALERTE CRITIQUE — Risque sanitaire ou épidémie majeure en cours. Isolement immédiat et respect strict des protocoles exigés pour votre sécurité.',
};

const DEFAULT_CITATION = {
  text:   'Primum non nocere. La médecine de 1892 exige autant de courage que de science.',
  author: 'Dr. James Herrington, 1889',
};

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
  fontSize: 18,
  color: '#D04040',
  letterSpacing: '0.10em',
  background: 'rgba(120,20,20,0.08)',
  textTransform: 'uppercase' as const,
};

export default function RedMDashboardClient({ roles }: { roles: string[] }) {
  const router = useRouter();
  const isAdmin = checkIsAdmin(roles);
  const canAccessCabinet = isAdmin || roles.some(r => ['redm_therapeute', 'redm_directeur', 'redm_co_directeur'].includes(r));
  const canAccessDirection = isAdmin || roles.some(r => ['redm_directeur', 'redm_co_directeur'].includes(r));
  const visibleModules = MODULES.filter(m => m.id !== 'direction' || canAccessDirection);
  const [hover, setHover] = useState<string | null>(null);
  const [time, setTime] = useState('──:──');
  const [date, setDate] = useState('');

  const [CITATION, setCitation] = useState(DEFAULT_CITATION);

  const [DISPENSAIRE,   setDispensaire]   = useState(DEFAULT_DISPENSAIRE);
  const [medecinsCount, setMedecinsCount] = useState<number | null>(null);
  const [sanitaire,     setSanitaire]     = useState<DispensaireStatus>(DEFAULT_DISPENSAIRE_STATUS);

  type RDV = { id: string; patientNom: string; date: string; heure: string; type: string; statut: string; };
  const [rdvs, setRdvs] = useState<RDV[]>([]);
  const [TITRES] = useState({
    surtitle:      'Dispensaire Medical · Territoire de New Hanover',
    title:         'Carnet du dispensaire',
    subtitle:      'Registre des soins, actes medicaux et comptabilite',
    modules:       'Modules du Dispensaire',
    panelEtat:     'Etat du Dispensaire',
  });

  useEffect(() => {
    fetch('/api/admin/redm-dashboard', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (!d) return;
        if (d.citation)     setCitation(d.citation);
        if (d.dispensaire)  setDispensaire(c => ({ ...c, ...d.dispensaire }));
      })
      .catch(() => {});

    fetch('/api/redm/medecins')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d?.medecins)) setMedecinsCount(d.medecins.length); })
      .catch(() => {});

    fetch('/api/redm/dispensaire-status')
      .then(r => r.json())
      .then(d => {
        if (d?.epidemie && d?.risque) setSanitaire({ epidemie: d.epidemie, risque: d.risque });
      })
      .catch(() => {});

    Promise.all([
      fetch('/api/agenda-commun').then(r => r.json()).catch(() => []),
      fetch('/api/agenda').then(r => r.json()).catch(() => []),
    ]).then(([commun, cabinet]: [RDV[], RDV[]]) => {
      const todayReal = new Date();
      const todayMidnight = new Date(todayReal.getFullYear(), todayReal.getMonth(), todayReal.getDate());

      function isUpcoming(r: RDV) {
        if (r.statut === 'ANNULÉ' || r.statut === 'PASSÉ') return false;
        const parts = (r.date ?? '').split('/');
        if (parts.length !== 3) return false;
        const [d, m, y] = parts.map(Number);
        if (!d || !m || !y) return false;
        return new Date(y + 134, m - 1, d) >= todayMidnight;
      }

      const communUpcoming = (commun ?? []).filter(isUpcoming);
      const cabinetUpcoming = (cabinet ?? []).filter(isUpcoming)
        .map(r => ({ ...r, patientNom: 'RDV Cabinet Thérapeutique', id: 'cab-' + r.id }));

      const merged = [...communUpcoming, ...cabinetUpcoming].sort((a, b) => {
        const pa = a.date.split('/').map(Number);
        const pb = b.date.split('/').map(Number);
        const da = new Date(pa[2] + 134, pa[1] - 1, pa[0]).getTime();
        const db = new Date(pb[2] + 134, pb[1] - 1, pb[0]).getTime();
        return da !== db ? da - db : a.heure.localeCompare(b.heure);
      });
      setRdvs(merged);
    });
  }, []);

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setTime(n.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
      const dateStr = n.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
      setDate(dateStr.replace(String(n.getFullYear()), String(n.getFullYear() - 134)));
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
            <div style={{ position: 'absolute', top: 10, right: 28, fontFamily: DISPLAY, fontSize: 130, color: 'rgba(140,30,30,0.06)', lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>✚</div>

            <div>
              <div style={{ fontFamily: MONO, fontSize: 17, color: '#8A6A5A', letterSpacing: '0.16em', marginBottom: 12, textTransform: 'uppercase' }}>
                ✦ {TITRES.surtitle}
              </div>
              <div style={{ fontFamily: DISPLAY, fontSize: 50, color: '#E8D8C0', lineHeight: 1.15 }}>
                {TITRES.title}
              </div>
              <div style={{ fontFamily: BODY, fontWeight: 400, fontSize: 24, color: '#B0A090', marginTop: 10, letterSpacing: '0.04em' }}>
                {TITRES.subtitle}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 22, paddingTop: 18, borderTop: '1px solid rgba(150,30,30,0.20)' }}>
              <div style={{ fontFamily: MONO, fontSize: 18, color: '#B0A090', textTransform: 'capitalize' }}>{date}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{ fontFamily: MONO, fontSize: 47, color: '#C03030', lineHeight: 1, letterSpacing: '0.06em' }}>{time}</div>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 17, color: '#60B060', letterSpacing: '0.10em', textTransform: 'uppercase' }}>✦ Ouvert</div>
                  <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 16, color: '#A09080', letterSpacing: '0.08em', textTransform: 'uppercase' }}>En service</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── RÈGLEMENT INTERNE ── */}
          <div
            onClick={() => router.push('/redm/bibliotheque?cat=reglement-interne')}
            style={{ ...PANEL, borderLeft: '4px solid #C8A850', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 18, cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(20,16,8,0.97)')}
            onMouseLeave={e => (e.currentTarget.style.background = CARD_BG)}
          >
            <div style={{ width: 46, height: 46, background: 'rgba(200,168,80,0.12)', border: '1px solid rgba(200,168,80,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>⚖</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 19, color: '#C8A850', lineHeight: 1.3 }}>Règlement Interne du Dispensaire</div>
              <div style={{ fontFamily: BODY, fontWeight: 400, fontSize: 15, color: '#A09080' }}>Préambule et 10 chapitres — conduite, hygiène, soins, discipline</div>
            </div>
            <span style={{ fontFamily: MONO, fontSize: 13, color: '#C8A850', letterSpacing: '0.1em', flexShrink: 0 }}>CONSULTER →</span>
          </div>

          {/* ── SERMENT D'HIPPOCRATE ── */}
          <div
            onClick={() => router.push('/redm/bibliotheque?cat=serment-hippocrate')}
            style={{ ...PANEL, borderLeft: '4px solid #C8A850', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 18, cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(20,16,8,0.97)')}
            onMouseLeave={e => (e.currentTarget.style.background = CARD_BG)}
          >
            <div style={{ width: 46, height: 46, background: 'rgba(200,168,80,0.12)', border: '1px solid rgba(200,168,80,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>⚕</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 19, color: '#C8A850', lineHeight: 1.3 }}>Serment d'Hippocrate</div>
              <div style={{ fontFamily: BODY, fontWeight: 400, fontSize: 15, color: '#A09080' }}>Prêté par Apollon, Esculape, Hygie et Panacée — Valentine, 1892</div>
            </div>
            <span style={{ fontFamily: MONO, fontSize: 13, color: '#C8A850', letterSpacing: '0.1em', flexShrink: 0 }}>CONSULTER →</span>
          </div>

          {/* ── CIRCUIT DE CUEILLETTE ── */}
          <div
            onClick={() => router.push('/redm/circuit-cueillette')}
            style={{ ...PANEL, borderLeft: '4px solid #4A7A40', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 18, cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(8,14,8,0.97)')}
            onMouseLeave={e => (e.currentTarget.style.background = CARD_BG)}
          >
            <div style={{ width: 46, height: 46, background: 'rgba(74,122,64,0.14)', border: '1px solid rgba(74,122,64,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🌿</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 19, color: '#7AAA70', lineHeight: 1.3 }}>Circuit de Cueillette</div>
              <div style={{ fontFamily: BODY, fontWeight: 400, fontSize: 15, color: '#A09080' }}>Parcours de récolte des plantes médicinales du comté</div>
            </div>
            <span style={{ fontFamily: MONO, fontSize: 13, color: '#7AAA70', letterSpacing: '0.1em', flexShrink: 0 }}>CONSULTER →</span>
          </div>

          {/* ── PROCHAINS RENDEZ-VOUS ── */}
          <div style={{ ...PANEL, overflow: 'hidden' }}>
            <div style={{ ...PANEL_HEAD, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📅 Prochains Rendez-vous</span>
              <button onClick={() => router.push('/redm/agenda')}
                style={{ fontFamily: MONO, fontSize: 12, padding: '5px 12px', cursor: 'pointer', background: 'rgba(200,168,80,0.12)', color: '#C8A850', border: '1px solid rgba(200,168,80,0.35)', letterSpacing: '0.08em' }}>
                + AGENDA
              </button>
            </div>
            {rdvs.length === 0 ? (
              <div style={{ padding: '22px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: MONO, fontSize: 13, color: '#5A4A35', letterSpacing: '0.08em' }}>Aucun rendez-vous à venir</span>
                <button onClick={() => router.push('/redm/agenda')}
                  style={{ fontFamily: MONO, fontSize: 12, padding: '5px 12px', cursor: 'pointer', background: 'transparent', color: '#8B7355', border: '1px solid rgba(139,90,43,0.30)', letterSpacing: '0.06em' }}>
                  Planifier un RDV →
                </button>
              </div>
            ) : (
              <div>
                {rdvs.slice(0, 5).map((r, i) => {
                  const isCabinet = r.id.startsWith('cab-');
                  const statCol: Record<string, string> = { 'CONFIRMÉ': '#4A6048', 'EN ATTENTE': '#C8A850', 'ANNULÉ': '#8B4040', 'PASSÉ': '#5A4A35' };
                  const col = isCabinet ? '#5A4A35' : (statCol[r.statut] ?? '#8B7355');
                  const isFirst = i === 0;
                  return (
                    <div key={r.id}
                      onClick={() => { if (isCabinet && !canAccessCabinet) return; router.push(isCabinet ? '/redm/cabinet/agenda' : '/redm/agenda'); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 22px', borderBottom: i < Math.min(rdvs.length, 5) - 1 ? '1px solid rgba(150,30,30,0.15)' : 'none', cursor: isCabinet && !canAccessCabinet ? 'default' : 'pointer', background: isFirst ? 'rgba(200,168,80,0.04)' : 'transparent', transition: 'background 0.15s', opacity: isCabinet ? 0.7 : 1 }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,168,80,0.07)')}
                      onMouseLeave={e => (e.currentTarget.style.background = isFirst ? 'rgba(200,168,80,0.04)' : 'transparent')}>
                      <div style={{ textAlign: 'center', minWidth: 54, flexShrink: 0 }}>
                        <div style={{ fontFamily: MONO, fontSize: 18, color: isFirst && !isCabinet ? '#C8A850' : '#8B7355', lineHeight: 1 }}>{r.heure || '—'}</div>
                        <div style={{ fontFamily: MONO, fontSize: 11, color: '#5A4A35', marginTop: 2, letterSpacing: '0.06em' }}>{r.date}</div>
                      </div>
                      <div style={{ width: 2, height: 32, background: `${col}60`, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 16, color: isCabinet ? '#6A5A4A' : '#D8C8A8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: isCabinet ? 'italic' : 'normal' }}>{r.patientNom}</div>
                        <div style={{ fontFamily: MONO, fontSize: 12, color: '#6A5A4A', letterSpacing: '0.06em' }}>{isCabinet ? 'Cabinet Thérapeutique' : r.type}</div>
                      </div>
                      {!isCabinet && <span style={{ fontFamily: MONO, fontSize: 11, color: col, background: col + '18', padding: '3px 8px', border: `1px solid ${col}35`, letterSpacing: '0.06em', flexShrink: 0 }}>{r.statut}</span>}
                      {isCabinet && <span style={{ fontFamily: MONO, fontSize: 11, color: '#5A4A35', background: 'rgba(90,74,53,0.15)', padding: '3px 8px', border: '1px solid rgba(90,74,53,0.25)', letterSpacing: '0.06em', flexShrink: 0 }}>🔒</span>}
                    </div>
                  );
                })}
                {rdvs.length > 5 && (
                  <div style={{ padding: '10px 22px', fontFamily: MONO, fontSize: 12, color: '#5A4A35', letterSpacing: '0.08em' }}>
                    +{rdvs.length - 5} autre{rdvs.length - 5 > 1 ? 's' : ''} rendez-vous →
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── SÉPARATEUR ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: DISPLAY, fontSize: 19, color: '#C03030', whiteSpace: 'nowrap', letterSpacing: '0.06em' }}>{TITRES.modules}</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(180,40,40,0.50)' }} />
            <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 16, color: '#A09080', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{visibleModules.length} Services</span>
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
                  <div style={{ position: 'absolute', bottom: 6, right: 10, fontFamily: DISPLAY, fontSize: 61, color: `${m.color}09`, lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>✚</div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ width: 56, height: 56, background: m.color + '12', border: `1px solid ${m.color + '40'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 33 }}>
                      {m.icon}
                    </div>
                    <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 15, padding: '4px 10px', background: m.color + '18', color: m.color === '#705030' ? '#D4A860' : m.color, border: `1px solid ${m.color + '40'}`, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
                      {m.badge}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontFamily: DISPLAY, fontSize: 24, color: '#E8D8C0', lineHeight: 1.2, marginBottom: 5 }}>{m.label}</div>
                    <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 15, color: m.color === '#705030' ? '#D4A860' : m.color, letterSpacing: '0.12em', marginBottom: 8, textTransform: 'uppercase' }}>{m.sub}</div>
                    <div style={{ fontFamily: BODY, fontWeight: 400, fontSize: 18, color: '#C0B0A0', lineHeight: 1.65 }}>{m.desc}</div>
                  </div>

                  <div style={{ paddingTop: 10, borderTop: `1px solid ${m.color + '25'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 15, color: '#A09080', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Disponible</span>
                    <span style={{ fontFamily: MONO, fontSize: 17, color: h ? (m.color === '#705030' ? '#D4A860' : m.color) : '#A09080', transition: 'color 0.15s' }}>→ Consulter</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* ═══ COLONNE DROITE ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Information dispensaire */}
          <div style={PANEL}>
            <div style={PANEL_HEAD}>
              <span>✦ {TITRES.panelEtat}</span>
            </div>
            <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: BODY, fontWeight: 400, fontSize: 20, color: '#D0C0B0' }}>{DISPENSAIRE.labelMedecins}</span>
                <span style={{ fontFamily: MONO, fontSize: 16, color: '#C8A850', letterSpacing: '0.07em' }}>● {medecinsCount ?? '—'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: BODY, fontWeight: 400, fontSize: 20, color: '#D0C0B0' }}>{DISPENSAIRE.labelRisque}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <span style={{ fontFamily: MONO, fontSize: 16, letterSpacing: '0.07em', color: sanitaireColor(sanitaire.risque) }}>
                    ● {sanitaireLabel(sanitaire.risque)}
                  </span>
                  {canAccessDirection && (
                    <button onClick={() => router.push('/redm/direction/alerte-sanitaire')}
                      style={{ fontFamily: MONO, fontSize: 11, padding: '4px 10px', cursor: 'pointer', background: 'rgba(200,160,64,0.12)', color: '#C8A040', border: '1px solid rgba(200,160,64,0.35)', letterSpacing: '0.08em' }}>
                      GÉRER
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: BODY, fontWeight: 400, fontSize: 20, color: '#D0C0B0' }}>{DISPENSAIRE.labelEpidemie}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <span style={{ fontFamily: MONO, fontSize: 16, letterSpacing: '0.07em', color: sanitaireColor(sanitaire.epidemie) }}>
                    ● {sanitaireLabel(sanitaire.epidemie)}
                  </span>
                  {canAccessDirection && (
                    <button onClick={() => router.push('/redm/direction/alerte-sanitaire')}
                      style={{ fontFamily: MONO, fontSize: 11, padding: '4px 10px', cursor: 'pointer', background: 'rgba(200,160,64,0.12)', color: '#C8A040', border: '1px solid rgba(200,160,64,0.35)', letterSpacing: '0.08em' }}>
                      GÉRER
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Citation */}
          <div style={{ ...PANEL, padding: '20px 24px', borderLeft: '3px solid rgba(160,40,40,0.50)' }}>
            <div style={{ fontFamily: BODY, fontWeight: 300, fontSize: 20, color: '#C8B8A8', lineHeight: 1.80, fontStyle: 'italic' }}>
              "{CITATION.text}"
            </div>
            <div style={{ fontFamily: MONO, fontSize: 15, color: '#907060', marginTop: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              — {CITATION.author}
            </div>
          </div>

          {/* Note de prix */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/noteprix.png"
            alt="Note de prix"
            style={{ width: '100%', display: 'block', borderRadius: 2, boxShadow: '0 4px 16px rgba(0,0,0,0.6)' }}
          />

        </div>
      </div>
    </div>
  );
}
