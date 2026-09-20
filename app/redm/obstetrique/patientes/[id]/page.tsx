'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

const DISPLAY = "'Central Station', 'Georgia', serif";
const BODY    = "'Cormorant Garamond', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";
const T = { bg: '#102B3B', card: '#183746', border: 'rgba(139,90,43,0.30)', gold: '#D1B77C', text: '#EADCB9', muted: '#C8BEA5', dim: '#C8BEA5' };

type Statut = 'EN COURS' | 'ACCOUCHÉE' | 'ABANDONNÉE' | 'CLÔTURÉE';
type Risque = '' | 'I' | 'II' | 'III';
interface Dossier {
  id: string; patientNom: string; patientPrenom: string; patientAge: string; patientMetier: string;
  dateConsult: string; type: string; plainte: string;
  antecedentsObstetricaux: string; antecedentsFamiliaux: string; evenementsRecents: string;
  risqueGrossesse: Risque; noteObstetricien: string;
  traitement: string; prochaine: string;
  statut: Statut; confidentiel: boolean; createdAt: string;
}

const STATUT_COL: Record<Statut, string> = { 'EN COURS': '#D1B77C', 'ACCOUCHÉE': '#A8B991', 'ABANDONNÉE': '#8B4040', 'CLÔTURÉE': '#5A4A6A' };
const RISQUE_INFO: Record<string, { label: string; desc: string; col: string }> = {
  I:   { label: 'Degré I — Faible',  desc: 'Grossesse sans complication apparente, suivi de routine', col: '#A8B991' },
  II:  { label: 'Degré II — Modéré', desc: 'Facteurs de risque nécessitant une surveillance rapprochée', col: '#786030' },
  III: { label: 'Degré III — Élevé', desc: "Risque important pour la mère et/ou l'enfant, surveillance étroite requise", col: '#8B4040' },
};

function InfoLine({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.12em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: BODY, fontSize: 18, color: T.text, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{value}</div>
    </div>
  );
}
function Block({ icon, title, color, children }: { icon: string; title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `3px solid ${color}`, marginBottom: 14, overflow: 'hidden' }}>
      <div style={{ padding: '10px 20px', borderBottom: `1px solid ${T.border}`, background: color + '10', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 19 }}>{icon}</span>
        <span style={{ fontFamily: MONO, fontSize: 14, color, letterSpacing: '0.14em' }}>{title}</span>
      </div>
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  );
}

export default function PatienteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [dossier,  setDossier]  = useState<Dossier | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/obstetrique/dossiers?id=${encodeURIComponent(id)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setDossier(data?.dossier ?? null); setHydrated(true); })
      .catch(() => setHydrated(true));
  }, [id]);

  if (!hydrated) return null;

  if (!dossier) return (
    <div style={{ fontFamily: BODY, textAlign: 'center', padding: 60 }}>
      <div style={{ fontFamily: MONO, fontSize: 15, color: T.dim }}>Dossier introuvable</div>
      <button onClick={() => router.push('/redm/obstetrique/patientes')} style={{ marginTop: 20, fontFamily: MONO, fontSize: 15, padding: '10px 22px', cursor: 'pointer', background: 'transparent', color: T.muted, border: `1px solid ${T.border}` }}>← RETOUR</button>
    </div>
  );

  const col = STATUT_COL[dossier.statut];
  const risque = dossier.risqueGrossesse ? RISQUE_INFO[dossier.risqueGrossesse] : null;

  return (
    <div style={{ fontFamily: BODY }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');`}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <button onClick={() => router.push('/redm/obstetrique/patientes')}
            style={{ fontFamily: MONO, fontSize: 15, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '9px 20px', cursor: 'pointer', letterSpacing: '0.1em' }}>
            ← RETOUR
          </button>
          <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold, letterSpacing: '0.16em' }}>OBSTÉTRIQUE · DOSSIERS · {(dossier.patientPrenom + ' ' + dossier.patientNom).toUpperCase()}</span>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `5px solid ${col}`, padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
          <div style={{ width: 70, height: 70, background: col + '20', border: `2px solid ${col}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISPLAY, fontSize: 30, color: col, flexShrink: 0 }}>
            {(dossier.patientPrenom[0] ?? '?')}{(dossier.patientNom[0] ?? '')}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: DISPLAY, fontSize: 33, color: T.text }}>{dossier.patientPrenom} {dossier.patientNom}</span>
              {dossier.patientAge && <span style={{ fontFamily: MONO, fontSize: 15, color: T.muted }}>{dossier.patientAge} ans</span>}
              {dossier.patientMetier && <span style={{ fontFamily: MONO, fontSize: 14, color: T.dim }}>· {dossier.patientMetier}</span>}
              {dossier.confidentiel && <span style={{ fontFamily: MONO, fontSize: 14, color: '#DF9A88', background: '#8B404018', padding: '2px 8px' }}>CONFIDENTIEL</span>}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: MONO, fontSize: 14, color: col, background: col + '18', padding: '3px 10px' }}>{dossier.statut}</span>
              <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold, background: 'rgba(209,183,124,0.10)', padding: '3px 10px' }}>{dossier.type}</span>
              <span style={{ fontFamily: MONO, fontSize: 14, color: T.dim }}>Ouvert le {dossier.dateConsult}</span>
              {risque && <span style={{ fontFamily: MONO, fontSize: 14, color: risque.col, background: risque.col + '18', padding: '3px 10px' }}>Risque {dossier.risqueGrossesse}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Détails du dossier ── */}
      {dossier.plainte && <Block icon="🗣" title="MOTIF / TERME DE GROSSESSE" color={T.gold}><InfoLine label="" value={dossier.plainte} /></Block>}

      {(dossier.antecedentsObstetricaux || dossier.antecedentsFamiliaux || dossier.evenementsRecents) && (
        <Block icon="📜" title="INFORMATIONS" color="#786030">
          <InfoLine label="ANTÉCÉDENTS OBSTÉTRICAUX"        value={dossier.antecedentsObstetricaux} />
          <InfoLine label="ANTÉCÉDENTS FAMILIAUX"           value={dossier.antecedentsFamiliaux} />
          <InfoLine label="ÉVÉNEMENTS RÉCENTS / COMPLICATIONS" value={dossier.evenementsRecents} />
        </Block>
      )}

      {risque && (
        <Block icon="⚖" title="NIVEAU DE RISQUE DE LA GROSSESSE" color={risque.col}>
          <div style={{ fontFamily: DISPLAY, fontSize: 22, color: risque.col, marginBottom: 6 }}>{risque.label}</div>
          <div style={{ fontFamily: BODY, fontSize: 17, color: T.muted, fontStyle: 'italic', lineHeight: 1.6 }}>{risque.desc}</div>
        </Block>
      )}

      {dossier.noteObstetricien && <Block icon="✍" title="NOTE DE L'OBSTÉTRICIEN" color="#6B4A78"><InfoLine label="" value={dossier.noteObstetricien} /></Block>}

      {(dossier.traitement || dossier.prochaine) && (
        <Block icon="💊" title="TRAITEMENT & RECOMMANDATIONS" color="#A8B991">
          <InfoLine label="PRESCRIPTIONS / CONSEILS"     value={dossier.traitement} />
          <InfoLine label="PROCHAINE CONSULTATION"        value={dossier.prochaine} />
        </Block>
      )}

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <button onClick={() => router.push('/redm/obstetrique/patientes')}
          style={{ fontFamily: MONO, fontSize: 14, padding: '9px 20px', cursor: 'pointer', background: 'rgba(209,183,124,0.10)', color: T.gold, border: `1px solid rgba(209,183,124,0.3)`, letterSpacing: '0.08em' }}>
          ✎ Modifier depuis la liste des dossiers
        </button>
      </div>
    </div>
  );
}
