'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const DISPLAY = "'Rye', 'Georgia', serif";
const BODY    = "'Josefin Slab', 'Georgia', serif";
const MONO    = "'Special Elite', 'Courier New', monospace";
const T = {
  bg: '#1A1208', card: '#1F1610', border: 'rgba(139,90,43,0.30)',
  gold: '#C8A850', text: '#E8D9C0', muted: '#8B7355', dim: '#5A4A35',
};

type Statut     = 'EN COURS' | 'TERMINÉE' | 'ABANDONNÉE';
type TypeSeance = 'Première consultation' | 'Suivi' | 'Urgence' | 'Hypnose' | 'Thérapie du deuil' | 'Conseil spirituel';
type Equilibre  = '' | 'I' | 'II' | 'III';

interface Dossier {
  id: string;
  patientNom: string; patientPrenom: string; patientAge: string; patientMetier: string;
  dateConsult: string; type: TypeSeance;
  plainte: string;
  antecedentsPersonnels: string; antecedentsFamiliaux: string; evenementsRecents: string;
  observations: string; observationMedecin: string;
  equilibreNerveux: Equilibre; noteThérapeute: string;
  traitement: string; prochaine: string;
  statut: Statut; confidentiel: boolean; createdAt: string;
}


const TYPES: TypeSeance[] = ['Première consultation', 'Suivi', 'Urgence', 'Hypnose', 'Thérapie du deuil', 'Conseil spirituel'];
const METIERS = [
  '', "Sherif East Wellster's", 'Sherif West Elizabeth', 'Maire', 'Marshall',
  'Fermier/ière', 'Médecin', 'Sans emploi', 'Salonnier/ière', 'Employé',
  'Patron/ne', 'Directeur/rice de Dispensaire', 'Tanneur',
  'Préparateur/rice de commande', 'Palefrenier/ière', 'Tisseur/euse',
  'Boucher/ère', 'Distilleur', 'Casino',
];
const EQUILIBRES: { val: Equilibre; label: string; desc: string; col: string }[] = [
  { val: '',    label: '— Non évalué',      desc: '',                                                                                                      col: T.dim   },
  { val: 'I',   label: 'Degré I — Léger',   desc: "Troubles passagers, n'altérant point durablement les facultés du sujet",                               col: '#4A6048' },
  { val: 'II',  label: 'Degré II — Modéré', desc: 'Atteinte notable nécessitant observation régulière et encadrement',                                    col: '#786030' },
  { val: 'III', label: 'Degré III — Grave', desc: 'Altération profonde des fonctions morales, nécessitant surveillance étroite',                          col: '#8B4040' },
];

const inp: React.CSSProperties = {
  fontFamily: MONO, fontSize: 17,
  background: 'rgba(0,0,0,0.28)', border: `1px solid ${T.border}`,
  color: T.text, padding: '13px 16px',
  outline: 'none', boxSizing: 'border-box', width: '100%',
  lineHeight: 1.5,
};
const lbl: React.CSSProperties = {
  fontFamily: MONO, fontSize: 14, color: T.dim,
  letterSpacing: '0.12em', marginBottom: 8, display: 'block',
};

function Section({ icon, title, color = T.gold, children }: { icon: string; title: string; color?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `4px solid ${color}`, marginBottom: 22, overflow: 'hidden' }}>
      <div style={{ padding: '14px 28px', borderBottom: `1px solid ${T.border}`, background: color + '10', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        <span style={{ fontFamily: MONO, fontSize: 16, color, letterSpacing: '0.14em' }}>{title}</span>
      </div>
      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>{children}</div>
    </div>
  );
}
function Row({ children, cols }: { children: React.ReactNode; cols: string }) {
  return <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 16 }}>{children}</div>;
}
function Field({ label, children, req }: { label: string; children: React.ReactNode; req?: boolean }) {
  return (
    <div>
      <label style={lbl}>{label}{req && <span style={{ color: '#C06060', marginLeft: 4 }}>*</span>}</label>
      {children}
    </div>
  );
}
function Textarea({ value, onChange, placeholder, rows = 4 }: { value: string; onChange: (v: string) => void; placeholder: string; rows?: number }) {
  return <textarea style={{ ...inp, resize: 'vertical', minHeight: rows * 28, lineHeight: 1.7 }} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />;
}

export default function NouveauDossierPage() {
  const router  = useRouter();

  const [patientNom,            setPatientNom]            = useState('');
  const [patientPrenom,         setPatientPrenom]         = useState('');
  const [patientAge,            setPatientAge]            = useState('');
  const [patientMetier,         setPatientMetier]         = useState('');
  const [dateConsult,           setDateConsult]           = useState(() => { const n = new Date(); const s = n.toLocaleDateString('fr-FR').split('/'); s[2] = String(Number(s[2])-136); return s.join('/'); });
  const [type,                  setType]                  = useState<TypeSeance>('Première consultation');
  const [plainte,               setPlainte]               = useState('');
  const [antecedentsPersonnels, setAntecedentsPersonnels] = useState('');
  const [antecedentsFamiliaux,  setAntecedentsFamiliaux]  = useState('');
  const [evenementsRecents,     setEvenementsRecents]     = useState('');
  const [observations,          setObservations]          = useState('');
  const [observationMedecin,    setObservationMedecin]    = useState('');
  const [equilibreNerveux,      setEquilibreNerveux]      = useState<Equilibre>('');
  const [noteThérapeute,        setNoteThérapeute]        = useState('');
  const [traitement,            setTraitement]            = useState('');
  const [prochaine,             setProchaine]             = useState('');
  const [statut,                setStatut]                = useState<Statut>('EN COURS');
  const [confidentiel,          setConfidentiel]          = useState(false);
  const [saved,                 setSaved]                 = useState(false);
  const [submitting,            setSubmitting]            = useState(false);

  const eqInfo = EQUILIBRES.find(e => e.val === equilibreNerveux);

  async function submit() {
    if (!patientNom.trim() || submitting) return;
    setSubmitting(true);
    const r = await fetch('/api/cabinet/dossiers', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientNom: patientNom.trim(), patientPrenom: patientPrenom.trim(),
        patientAge, patientMetier, dateConsult, type, plainte,
        antecedentsPersonnels, antecedentsFamiliaux, evenementsRecents,
        observations, observationMedecin, equilibreNerveux, noteThérapeute,
        traitement, prochaine, statut, confidentiel,
      }),
    });
    setSubmitting(false);
    if (r.ok) setSaved(true);
  }

  if (saved) return (
    <div style={{ fontFamily: BODY, maxWidth: 640, margin: '80px auto', textAlign: 'center' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Rye&family=Josefin+Slab:wght@300;400;600;700&family=Special+Elite&display=swap');`}</style>
      <div style={{ background: T.card, border: `2px solid rgba(74,96,72,0.55)`, padding: '56px 44px' }}>
        <div style={{ fontSize: 57, marginBottom: 18 }}>✔</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 33, color: T.gold, marginBottom: 10 }}>Dossier ouvert</div>
        <div style={{ fontFamily: BODY, fontSize: 22, color: T.text, marginBottom: 6 }}>{patientPrenom} {patientNom}</div>
        <div style={{ fontFamily: MONO, fontSize: 15, color: T.dim, marginBottom: 36 }}>{type} · {dateConsult}</div>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
          <button onClick={() => router.push('/redm/cabinet/patients')}
            style={{ fontFamily: MONO, fontSize: 15, letterSpacing: '0.12em', padding: '13px 28px', cursor: 'pointer', background: 'rgba(74,96,72,0.25)', color: '#8BAB88', border: '1px solid rgba(74,96,72,0.5)' }}>
            ← RETOUR AUX DOSSIERS
          </button>
          <button onClick={() => { setSaved(false); setPatientNom(''); setPatientPrenom(''); setPatientAge(''); setDateConsult((() => { const n = new Date(); const s = n.toLocaleDateString('fr-FR').split('/'); s[2] = String(Number(s[2])-136); return s.join('/'); })()); setType('Première consultation'); setPlainte(''); setAntecedentsPersonnels(''); setAntecedentsFamiliaux(''); setEvenementsRecents(''); setObservations(''); setObservationMedecin(''); setEquilibreNerveux(''); setNoteThérapeute(''); setTraitement(''); setProchaine(''); setStatut('EN COURS'); setConfidentiel(false); }}
            style={{ fontFamily: MONO, fontSize: 15, letterSpacing: '0.12em', padding: '13px 28px', cursor: 'pointer', background: 'rgba(200,168,80,0.15)', color: T.gold, border: `1px solid rgba(200,168,80,0.4)` }}>
            ✚ NOUVEAU DOSSIER
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: BODY, maxWidth: 900, margin: '0 auto' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Rye&family=Josefin+Slab:wght@300;400;600;700&family=Special+Elite&display=swap');`}</style>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <button onClick={() => router.push('/redm/cabinet/patients')}
            style={{ fontFamily: MONO, fontSize: 15, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '10px 22px', cursor: 'pointer', letterSpacing: '0.1em' }}>
            ← RETOUR
          </button>
          <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold, letterSpacing: '0.16em' }}>CABINET · DOSSIERS · NOUVEAU</span>
        </div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 38, color: T.gold, margin: 0 }}>📋 Nouveau Dossier Patient</h1>
        <p style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.1em', marginTop: 10 }}>DISPENSAIRE THÉRAPEUTIQUE · 1890</p>
      </div>

      {/* ── 1. IDENTITÉ ── */}
      <Section icon="👤" title="IDENTITÉ DU PATIENT">
        <Row cols="1fr 1fr 120px">
          <Field label="NOM" req><input style={inp} value={patientNom} onChange={e => setPatientNom(e.target.value)} placeholder="Nom de famille" /></Field>
          <Field label="PRÉNOM"><input style={inp} value={patientPrenom} onChange={e => setPatientPrenom(e.target.value)} placeholder="Prénom" /></Field>
          <Field label="ÂGE"><input style={inp} value={patientAge} onChange={e => setPatientAge(e.target.value)} placeholder="Ans" /></Field>
        </Row>
        <Row cols="1fr">
          <Field label="MÉTIER / PROFESSION">
            <select style={{ ...inp, cursor: 'pointer' }} value={patientMetier} onChange={e => setPatientMetier(e.target.value)}>
              {METIERS.map(m => <option key={m} value={m}>{m || '— Sélectionner un métier —'}</option>)}
            </select>
          </Field>
        </Row>
        <Row cols="1fr 1fr">
          <Field label="DATE DE CONSULTATION"><input style={inp} value={dateConsult} onChange={e => setDateConsult(e.target.value)} placeholder="JJ/MM/AAAA" /></Field>
          <Field label="TYPE DE SÉANCE">
            <select style={{ ...inp, cursor: 'pointer' }} value={type} onChange={e => setType(e.target.value as TypeSeance)}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
        </Row>
        <Field label="PLAINTE / MOTIF DE CONSULTATION">
          <input style={inp} value={plainte} onChange={e => setPlainte(e.target.value)} placeholder="Ce que rapporte le patient à son arrivée…" />
        </Field>
      </Section>

      {/* ── 2. INFORMATIONS ── */}
      <Section icon="📜" title="INFORMATIONS" color="#786030">
        <Field label="ANTÉCÉDENTS PERSONNELS">
          <Textarea value={antecedentsPersonnels} onChange={setAntecedentsPersonnels} placeholder="Maladies passées, traumatismes, épisodes notables dans la vie du patient…" rows={4} />
        </Field>
        <Field label="ANTÉCÉDENTS FAMILIAUX">
          <Textarea value={antecedentsFamiliaux} onChange={setAntecedentsFamiliaux} placeholder="Antécédents de folie, mélancolie, violence ou troubles nerveux dans la famille…" rows={4} />
        </Field>
        <Field label="ÉVÉNEMENTS RÉCENTS">
          <Textarea value={evenementsRecents} onChange={setEvenementsRecents} placeholder="Deuil, ruine, choc moral, conflit, événement déclencheur récent…" rows={4} />
        </Field>
      </Section>

      {/* ── 3. ÉTAT DE L'ÉQUILIBRE NERVEUX ── */}
      <Section icon="⚖" title="ÉTAT DE L'ÉQUILIBRE NERVEUX" color="#8B4040">
        <Field label="DEGRÉ D'ATTEINTE NERVEUSE">
          <select style={{ ...inp, cursor: 'pointer', fontSize: 18 }} value={equilibreNerveux} onChange={e => setEquilibreNerveux(e.target.value as Equilibre)}>
            {EQUILIBRES.map(e => <option key={e.val} value={e.val}>{e.label}</option>)}
          </select>
        </Field>
        {equilibreNerveux && eqInfo && (
          <div style={{ padding: '14px 18px', background: eqInfo.col + '15', border: `1px solid ${eqInfo.col}40`, borderLeft: `3px solid ${eqInfo.col}` }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 19, color: eqInfo.col, marginBottom: 6 }}>{eqInfo.label}</div>
            <div style={{ fontFamily: BODY, fontSize: 17, color: T.muted, fontStyle: 'italic', lineHeight: 1.6 }}>{eqInfo.desc}</div>
          </div>
        )}
      </Section>

      {/* ── 6. NOTE DU THÉRAPEUTE ── */}
      <Section icon="✍" title="NOTE DU THÉRAPEUTE" color={T.gold}>
        <Field label="NOTE CONFIDENTIELLE DU THÉRAPEUTE">
          <Textarea value={noteThérapeute} onChange={setNoteThérapeute} placeholder="Ressenti personnel, intuitions cliniques, plan thérapeutique envisagé, mise en garde pour les prochaines séances…" rows={6} />
        </Field>
      </Section>

      {/* ── 7. TRAITEMENT & STATUT ── */}
      <Section icon="💊" title="TRAITEMENT & RECOMMANDATIONS" color="#4A6048">
        <Field label="PRESCRIPTIONS / CONSEILS">
          <Textarea value={traitement} onChange={setTraitement} placeholder="Remèdes, exercices, conseils spirituels, recommandations pratiques…" rows={4} />
        </Field>
        <Field label="PROCHAINE SÉANCE">
          <input style={inp} value={prochaine} onChange={e => setProchaine(e.target.value)} placeholder="Date prévue ou note de suivi…" />
        </Field>
        <Row cols="1fr auto">
          <Field label="STATUT DU DOSSIER">
            <select style={{ ...inp, cursor: 'pointer' }} value={statut} onChange={e => setStatut(e.target.value as Statut)}>
              <option>EN COURS</option><option>TERMINÉE</option><option>ABANDONNÉE</option>
            </select>
          </Field>
          <div style={{ paddingTop: 26 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: MONO, fontSize: 14, color: confidentiel ? '#C06060' : T.dim, whiteSpace: 'nowrap' }}>
              <input type="checkbox" checked={confidentiel} onChange={e => setConfidentiel(e.target.checked)} style={{ width: 17, height: 17 }} />
              DOSSIER CONFIDENTIEL
            </label>
          </div>
        </Row>
      </Section>

      {/* ── Actions ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, marginTop: 12, marginBottom: 40 }}>
        <button onClick={() => router.push('/redm/cabinet/patients')}
          style={{ fontFamily: MONO, fontSize: 15, letterSpacing: '0.1em', padding: '13px 26px', cursor: 'pointer', background: 'transparent', color: T.muted, border: `1px solid ${T.border}` }}>
          ANNULER
        </button>
        <button onClick={submit} disabled={!patientNom.trim() || submitting}
          style={{ fontFamily: MONO, fontSize: 16, letterSpacing: '0.14em', padding: '14px 40px', cursor: patientNom.trim() ? 'pointer' : 'not-allowed', background: patientNom.trim() ? 'rgba(74,96,72,0.40)' : 'rgba(255,255,255,0.04)', color: patientNom.trim() ? '#8BAB88' : T.dim, border: `2px solid ${patientNom.trim() ? 'rgba(74,96,72,0.65)' : 'rgba(255,255,255,0.06)'}`, transition: 'all 0.2s' }}>
          {submitting ? '…' : '✔ OUVRIR LE DOSSIER'}
        </button>
      </div>
    </div>
  );
}
