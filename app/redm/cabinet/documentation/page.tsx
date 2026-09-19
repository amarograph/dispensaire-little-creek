'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

const DISPLAY = "'Burnic', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";
const BODY    = "'Cormorant Garamond', 'Georgia', serif";
const T = { bg: '#EDE0C2', card: '#F7EEDB', border: 'rgba(139,90,43,0.30)', gold: '#80682D', text: '#183746', muted: '#6A6D50', dim: '#646850' };
const COL  = '#6B7ABB';
const COL_S = '#526C45'; // synthèse — vert
const COL_P = '#A0784A'; // prescription — brun

/* ── LocalStorage keys (examens psychiques uniquement — reste local) ── */
const LS_EXAMS = 'redm_doc_examen_psychique_v1';

/* ── Helpers ── */
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function rpDate(d = new Date()) {
  const s = d.toLocaleDateString('fr-FR').split('/'); s[2] = String(Number(s[2]) - 136); return s.join('/');
}
function rpDisplay(date: string): string {
  const p = date.split('/');
  if (p.length !== 3) return date;
  const y = Number(p[2]);
  if (isNaN(y)) return date;
  p[2] = String(y >= 1900 ? y - 136 : y);
  return p.join('/');
}

/* ── Types ── */
type Verdict = 'APTE' | 'À SURVEILLER' | 'INAPTE';
type DocCreationType = 'Synthèse de consultation' | 'Prescription médicale';

interface Examen {
  id: string; createdAt: string;
  nom: string; prenom: string; age: string; fonction: string; county: string; lieu: string;
  date: string; docteur: string; reponses: Record<string, number>;
  score: number; verdict: Verdict;
  etatEmotionnel: string; stabiliteNerveuse: string;
  elementsRetenus: string; conclusion: string; recommandations: string;
}
interface Patient {
  id: string; patientNom: string; patientPrenom: string; patientAge: string;
  dateConsult: string; type: string; plainte: string;
  antecedentsPersonnels: string; antecedentsFamiliaux: string; evenementsRecents: string;
  equilibreNerveux: string; noteThérapeute: string; traitement: string; prochaine: string;
  statut: string; confidentiel: boolean; createdAt: string;
}
interface DocResult {
  id: string; patientId: string; type: string;
  titre: string; contenu: string; date: string; createdAt: string;
}

/* ── LS helpers (examens psychiques uniquement) ── */
function loadExams(): Examen[]  { try { return JSON.parse(localStorage.getItem(LS_EXAMS) ?? '[]'); } catch { return []; } }
function saveExams(d: Examen[]) { try { localStorage.setItem(LS_EXAMS, JSON.stringify(d)); } catch {} }

/* ── Mapper row Supabase → Patient ── */
function mapDossier(row: any): Patient {
  return {
    id:            String(row.id ?? ''),
    patientNom:    String(row.patient_nom    ?? ''),
    patientPrenom: String(row.patient_prenom ?? ''),
    patientAge:    String(row.patient_age    ?? ''),
    dateConsult:   String(row.date_consult   ?? ''),
    type:          String(row.type_seance    ?? ''),
    plainte:       String(row.plainte        ?? ''),
    antecedentsPersonnels: '', antecedentsFamiliaux: '',
    evenementsRecents: '', equilibreNerveux: '', noteThérapeute: '',
    traitement: '', prochaine: '', statut: String(row.statut ?? 'EN COURS'),
    confidentiel: Boolean(row.confidentiel), createdAt: String(row.created_at ?? ''),
  };
}

/* ── Mapper row Supabase → DocResult ── */
function mapDoc(x: any): DocResult {
  return {
    id:        String(x.id),
    patientId: String(x.patient_id),
    type:      x.type,
    titre:     x.titre,
    contenu:   x.contenu,
    date:      x.date,
    createdAt: x.created_at,
  };
}

const VERDICT_COL: Record<Verdict, string> = { 'APTE': '#4A8048', 'À SURVEILLER': '#80682D', 'INAPTE': '#963F36' };
const MAX_SCORE = 110;

/* ── Templates ── */
const TEMPLATE_SYNTHESE = `SYNTHÈSE DE CONSULTATION
L'ORDRES DES MÉDECINS - Hôpital de Little Creek - Dispensaire de Valentine
Année 1890

MOTIF DE LA CONSULTATION
Le patient se présente à la suite de :
[Décrire précisément la raison de la consultation — événement déclencheur, trouble principal, contexte]

ANAMNÈSE & HISTOIRE DES FAITS
Le patient rapporte :
[Contexte initial, rencontre, situation]
La situation évolua vers :
[Attachement, conflit, évolution]
Éléments importants :
• [Événement clé]
• [Événement clé]
• [Événement clé]
Dates notables :
• [Date + événement]
• [Date + événement]
Le patient :
[Réaction / comportement]
[Démarches entreprises]

OBSERVATION CLINIQUE ACTUELLE
À l'examen du [date] :
État général :
• [Tenue, posture, maintien]
• [Attitude générale]
Troubles observés :
Sommeil :
→ [Qualité / perturbations]
Pensée :
→ [Rumination, idées, organisation]
Isolement introspectif :
Lorsqu'il est seul :
• [Comportement]
• [Comportement]
État émotionnel :
• [Tristesse / colère / anxiété / vide]
• [Variations]
Appétit :
[État]
Fonctions cognitives :
[Attention / concentration]
Confiance en soi :
[État]

MÉCANISMES D'ADAPTATION
Le patient compense son état par :
• [Comportement]
• [Comportement]
Ces mécanismes constituent :
[Stabilisation / évitement / compensation]

ÉVOLUTION DE LA PERSONNALITÉ
Le patient note une évolution depuis :
[Durée / événement]
• [Avant → après]
• [Changement comportemental]
• [Changement émotionnel]

INTERPRÉTATION ALIÉNISTE
"[Nom du trouble — style 1890]"
Le patient présente :
[Description de l'état]
[Mécanisme interne]

PRONOSTIC
Le pronostic est :
[Favorable / réservé / incertain]
Sous réserve de :
[Conditions]
Risques :
• [Risque]
• [Risque]

CONSIGNES COMPLÉMENTAIRES
[Repos / activité]
[Recommandation]
[Interdiction]
Surveiller :
• [Symptôme]
• [Symptôme]
• [Symptôme]

SUIVI
Nouvel examen requis sous [durée],
ou immédiatement en cas de :
[Aggravation]

CONCLUSION DU MÉDECIN
[Phrase de conclusion — style 1890]
Le patient demeure [état], malgré [épreuve].
Son esprit [description].`;

const TEMPLATE_PRESCRIPTION = `Prescription Médicale
Docteur De Millet François

Patient
Nom et prénom : [Nom du patient]

──────────────────────────────────────

Décoction [Nom] – usage de jour

À consommer en cas de :
[Symptômes / indication précise], sans excès, afin de :
[Effet recherché sans altérer la vigilance].

Composition :
• [Plante]
• [Plante]
• [Plante]
• [Plante]
• [Plante]
• [Plante]

──────────────────────────────────────

Décoction [Nom] – usage nocturne

Réservée au soir, lorsque :
[Condition / moment de prise].

Destinée à :
[Effet recherché — sommeil / apaisement].

Composition :
• [Plante]
• [Plante]
• [Plante]
• [Plante]
• [Plante]

──────────────────────────────────────

Consignes complémentaires

Repos et calme recommandés durant :
[Durée]

[Activité recommandée : marche / cheval / repos]
[Autre recommandation : bains, alimentation, etc.]

Éviter toute consommation de :
[Alcool / tabac / autre]

Éviter tout contact avec :
[Personnes / situations à risque]

Noter tout épisode d'aggravation :
• [Symptôme]
• [Symptôme]
• [Symptôme]

──────────────────────────────────────

Suivi

Un nouvel examen est requis dans [durée],
ou immédiatement en cas de :
[Aggravation / symptôme critique]`;

const TEMPLATES: Record<DocCreationType, string> = {
  'Synthèse de consultation': TEMPLATE_SYNTHESE,
  'Prescription médicale':    TEMPLATE_PRESCRIPTION,
};

/* ══════════════════════════════════════════════════ PAGE ══ */
export default function DocumentationPage() {
  const router  = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  /* ── State général ── */
  const [hydrated,   setHydrated]   = useState(false);
  const [hover,      setHover]      = useState<string | null>(null);

  /* ── Examens psychiques ── */
  const [exams,      setExams]      = useState<Examen[]>([]);
  const [delExam,    setDelExam]    = useState<string | null>(null);
  const [editExam,   setEditExam]   = useState<Examen | null>(null);
  const [editForm,   setEditForm]   = useState<Partial<Examen>>({});

  /* ── Patients & docs ── */
  const [patients,   setPatients]   = useState<Patient[]>([]);
  const [allDocs,    setAllDocs]    = useState<DocResult[]>([]);

  /* ── Création doc (synthèse / prescription) ── */
  const [createType,      setCreateType]      = useState<DocCreationType | null>(null);
  const [useExisting,     setUseExisting]      = useState(true);
  const [selectedPat,     setSelectedPat]      = useState('');
  const [newNom,          setNewNom]           = useState('');
  const [newPrenom,       setNewPrenom]        = useState('');
  const [newAge,          setNewAge]           = useState('');
  const [createTitre,     setCreateTitre]      = useState('');
  const [createDate,      setCreateDate]       = useState('');
  const [createContenu,   setCreateContenu]    = useState('');
  const [patSearch,       setPatSearch]        = useState('');

  /* ── Certificat (vue plein écran) ── */
  const [certDoc,    setCertDoc]    = useState<DocResult | null>(null);
  const [certPat,    setCertPat]    = useState<Patient | null>(null);

  /* ── Suppression / édition docs ── */
  const [delDoc,     setDelDoc]     = useState<string | null>(null);

  /* ── Chargement ── */
  useEffect(() => {
    setExams(loadExams());
    // Patients depuis Supabase
    fetch('/api/cabinet/dossiers')
      .then(r => r.ok ? r.json() : { dossiers: [] })
      .then(data => { setPatients((data.dossiers ?? []).map(mapDossier)); })
      .catch(() => {});
    // Documents depuis Supabase
    fetch('/api/cabinet/documents')
      .then(r => r.ok ? r.json() : { documents: [] })
      .then(data => { setAllDocs((data.documents ?? []).map(mapDoc)); })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  /* ── Helpers ── */
  const syntheses     = allDocs.filter(d => d.type === 'Synthèse de consultation');
  const prescriptions = allDocs.filter(d => d.type === 'Prescription médicale');
  const patientById   = (id: string) => patients.find(p => p.id === id) ?? null;
  const filteredPats  = patients.filter(p =>
    `${p.patientPrenom} ${p.patientNom}`.toLowerCase().includes(patSearch.toLowerCase())
  );

  /* ── Ouvrir panel création ── */
  function openCreate(type: DocCreationType) {
    setCreateType(type);
    setUseExisting(true);
    setSelectedPat(patients[0]?.id ?? '');
    setNewNom(''); setNewPrenom(''); setNewAge('');
    setCreateTitre('');
    setCreateDate(rpDate());
    setCreateContenu(TEMPLATES[type]);
    setPatSearch('');
  }

  /* ── Soumettre création ── */
  async function submitCreate() {
    if (!createType) return;
    try {
      let patientId = '';

      if (useExisting) {
        if (!selectedPat) return;
        patientId = selectedPat;
      } else {
        if (!newNom.trim()) return;
        const r = await fetch('/api/cabinet/dossiers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientNom:    newNom.trim(),
            patientPrenom: newPrenom.trim(),
            patientAge:    newAge,
            dateConsult:   createDate,
            type:          'Première consultation',
            statut:        'EN COURS',
          }),
        });
        if (!r.ok) return;
        const d = await r.json();
        const newPat = mapDossier(d.dossier);
        setPatients(prev => [newPat, ...prev]);
        patientId = newPat.id;
      }

      const newId = uid();
      const r = await fetch('/api/cabinet/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id:         newId,
          patient_id: patientId,
          type:       createType,
          titre:      createTitre.trim() || createType,
          contenu:    createContenu,
          date:       createDate,
        }),
      });
      if (!r.ok) return;
      const saved = await r.json();
      const newDoc = mapDoc({ ...saved.document, id: saved?.document?.id ?? newId, patient_id: patientId });
      setAllDocs(prev => [newDoc, ...prev]);
      setCreateType(null);
    } catch {}
  }

  /* ── Supprimer un doc ── */
  async function deleteDoc(id: string) {
    await fetch('/api/cabinet/documents', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setAllDocs(prev => prev.filter(d => d.id !== id));
    setDelDoc(null);
  }

  /* ── Vue certificat ── */
  function openCert(doc: DocResult) {
    setCertDoc(doc);
    setCertPat(patientById(doc.patientId));
  }

  /* ── Examen psychique ── */
  function deleteExam(id: string) {
    const updated = exams.filter(e => e.id !== id);
    setExams(updated); saveExams(updated); setDelExam(null);
  }
  function startEditExam(ex: Examen) {
    setEditExam(ex);
    setEditForm({ nom: ex.nom, prenom: ex.prenom, age: ex.age, fonction: ex.fonction, county: ex.county, lieu: ex.lieu ?? 'Little Creek', date: ex.date, etatEmotionnel: ex.etatEmotionnel, stabiliteNerveuse: ex.stabiliteNerveuse, elementsRetenus: ex.elementsRetenus, conclusion: ex.conclusion, recommandations: ex.recommandations });
  }
  function saveEditExam() {
    if (!editExam) return;
    const updated = exams.map(e => e.id === editExam.id ? { ...e, ...editForm } : e);
    setExams(updated); saveExams(updated); setEditExam(null);
  }

  const inp: React.CSSProperties = { fontFamily: MONO, fontSize: 15, background: 'rgba(0,0,0,0.28)', border: `1px solid ${T.border}`, color: T.text, padding: '10px 14px', outline: 'none', boxSizing: 'border-box', width: '100%' };
  const lbl: React.CSSProperties = { fontFamily: MONO, fontSize: 12, color: T.dim, letterSpacing: '0.12em', marginBottom: 6, display: 'block' };

  /* ══ VUE CERTIFICAT ══ */
  if (certDoc) return (
    <div style={{ fontFamily: BODY }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
        @font-face { font-family: 'Libre Baskerville'; src: url('/SpecialElite-Regular.ttf') format('truetype'); font-weight: normal; font-style: normal; }
        @media print { .no-print { display: none !important; } .print-area { background: white !important; color: black !important; padding: 40px !important; font-family: 'Libre Baskerville', 'Courier New', monospace !important; } }
      `}</style>
      <div className="no-print" style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button onClick={() => { setCertDoc(null); setCertPat(null); }} style={{ fontFamily: MONO, fontSize: 14, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '9px 20px', cursor: 'pointer', letterSpacing: '0.1em' }}>← RETOUR</button>
        <button onClick={() => window.print()} style={{ fontFamily: MONO, fontSize: 14, background: 'rgba(107,122,187,0.22)', border: '1px solid rgba(107,122,187,0.55)', color: '#8899CC', padding: '9px 22px', cursor: 'pointer', letterSpacing: '0.1em' }}>🖨 IMPRIMER</button>
      </div>
      <div ref={printRef} className="print-area" style={{ background: '#FDFAF4', border: '2px solid #6A6D50', padding: '52px 60px', maxWidth: 800, margin: '0 auto', color: '#EADCB9', fontFamily: "'Libre Baskerville', 'Courier New', monospace" }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 20, letterSpacing: '0.12em', marginBottom: 4, fontWeight: 'bold' }}>CABINET THÉRAPEUTIQUE PSYCHIQUE</div>
          <div style={{ fontSize: 15, color: '#4A3018', marginBottom: 4 }}>Little Creek — Blackwater</div>
          <div style={{ fontSize: 13, color: '#6A5030', lineHeight: 1.7 }}>
            Sous la direction du Docteur François De Millet<br />
            Médecin – Thérapeute, formé aux doctrines modernes de la médecine mentale et des sciences morales
          </div>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 17, letterSpacing: '0.1em', textDecoration: 'underline', textUnderlineOffset: 6, fontWeight: 'bold' }}>
            {certDoc.titre.toUpperCase()}
          </div>
          <div style={{ fontSize: 13, color: '#6A5030', marginTop: 6, letterSpacing: '0.1em' }}>{certDoc.type}</div>
        </div>
        <div style={{ fontSize: 15, lineHeight: 2 }}>
          <p style={{ margin: '0 0 16px' }}>Je soussigné, <strong>Docteur François De Millet</strong>, médecin – thérapeute exerçant au sein du L'ORDRES DES MÉDECINS - Hôpital de Little Creek - Dispensaire de Valentine, certifie avoir procédé, en date du <strong>{rpDisplay(certDoc.date)}</strong>, à la rédaction du présent document concernant :</p>
          <p style={{ paddingLeft: 28, margin: '0 0 16px' }}>
            <strong>Nom et Prénom :</strong> {certPat ? `${certPat.patientPrenom} ${certPat.patientNom}` : '—'}<br />
            {certPat?.patientAge ? <><strong>Âge :</strong> {certPat.patientAge} ans<br /></> : null}
            {certPat?.type ? <><strong>Type de suivi :</strong> {certPat.type}</> : null}
          </p>
          <p style={{ margin: '24px 0 8px', fontWeight: 'bold', textDecoration: 'underline', textUnderlineOffset: 4 }}>CONTENU</p>
          <div style={{ margin: '0 0 32px', whiteSpace: 'pre-wrap', lineHeight: 2.1 }}>{certDoc.contenu}</div>
          <div style={{ marginTop: 52, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 14, color: '#6A5030', lineHeight: 2 }}>
              Fait à <strong>Little Creek</strong>, le <strong>{rpDisplay(certDoc.date)}</strong>
            </div>
            <div style={{ textAlign: 'right' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/signature.png" alt="Signature Dr De Millet" style={{ width: 520, display: 'block', marginLeft: 'auto' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ══ PAGE PRINCIPALE ══ */
  return (
    <div style={{ fontFamily: BODY }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
        @keyframes slide-in { from { transform: translateX(100%); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <button onClick={() => router.push('/redm/cabinet')} style={{ fontFamily: MONO, fontSize: 15, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '9px 20px', cursor: 'pointer', letterSpacing: '0.1em' }}>← RETOUR</button>
          <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold, letterSpacing: '0.18em' }}>CABINET · DOCUMENTATION</span>
        </div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 40, color: T.gold, margin: 0 }}>📁 Documentation</h1>
        <p style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.12em', marginTop: 8 }}>FORMULAIRES & DOCUMENTS OFFICIELS · 1890</p>
      </div>

      {/* ── FORMULAIRES ── */}
      <div style={{ marginBottom: 44 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <span style={{ fontFamily: DISPLAY, fontSize: 22, color: T.gold }}>📋 Formulaires</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(128,104,45,0.25)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>

          {/* Examen Psychique */}
          {[{ id: 'examen-psychique', href: '/redm/cabinet/documentation/examen-psychique', icon: '🧠', label: 'Examen Psychique & Moral', sub: 'SHERIF', desc: "Formulaire d'évaluation psychique et morale destiné aux agents de l'ordre.", color: COL, badge: 'PSY' }].map(m => {
            const h = hover === m.id;
            return (
              <div key={m.id} onClick={() => router.push(m.href)} onMouseEnter={() => setHover(m.id)} onMouseLeave={() => setHover(null)}
                style={{ background: h ? '#1A1A28' : T.card, border: `2px solid ${h ? m.color + '90' : T.border}`, borderLeft: `4px solid ${h ? m.color : m.color + '60'}`, padding: '28px 24px', cursor: 'pointer', transition: 'all 0.18s', transform: h ? 'translateY(-2px)' : 'none', boxShadow: h ? '0 8px 30px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.35)' }}>
                <div style={{ fontSize: 42, marginBottom: 14 }}>{m.icon}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontFamily: DISPLAY, fontSize: 22, color: T.text }}>{m.label}</span>
                  <span style={{ fontFamily: MONO, fontSize: 12, padding: '2px 7px', background: m.color + '22', color: m.color, border: `1px solid ${m.color}55`, letterSpacing: '0.1em', flexShrink: 0 }}>{m.badge}</span>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 12, color: m.color, letterSpacing: '0.12em', marginBottom: 8 }}>{m.sub}</div>
                <div style={{ fontFamily: BODY, fontSize: 16, color: T.dim, lineHeight: 1.55 }}>{m.desc}</div>
                <div style={{ fontFamily: MONO, fontSize: 14, color: h ? m.color : '#3A2A1A', marginTop: 14, letterSpacing: '0.1em', transition: 'color 0.15s' }}>→ OUVRIR</div>
              </div>
            );
          })}

          {/* Synthèse de consultation */}
          {(() => { const h = hover === 'synthese'; return (
            <div onClick={() => router.push('/redm/cabinet/documentation/synthese-consultation')} onMouseEnter={() => setHover('synthese')} onMouseLeave={() => setHover(null)}
              style={{ background: h ? '#1A2018' : T.card, border: `2px solid ${h ? COL_S + '90' : T.border}`, borderLeft: `4px solid ${h ? COL_S : COL_S + '60'}`, padding: '28px 24px', cursor: 'pointer', transition: 'all 0.18s', transform: h ? 'translateY(-2px)' : 'none', boxShadow: h ? '0 8px 30px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.35)' }}>
              <div style={{ fontSize: 42, marginBottom: 14 }}>📋</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontFamily: DISPLAY, fontSize: 22, color: T.text }}>Synthèse de consultation</span>
                <span style={{ fontFamily: MONO, fontSize: 12, padding: '2px 7px', background: COL_S + '22', color: COL_S, border: `1px solid ${COL_S}55`, letterSpacing: '0.1em', flexShrink: 0 }}>SYN</span>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 12, color: COL_S, letterSpacing: '0.12em', marginBottom: 8 }}>TOUS PATIENTS</div>
              <div style={{ fontFamily: BODY, fontSize: 16, color: T.dim, lineHeight: 1.55 }}>Compte rendu complet de séance avec anamnèse, observations et conclusion.</div>
              <div style={{ fontFamily: MONO, fontSize: 14, color: h ? COL_S : '#3A2A1A', marginTop: 14, letterSpacing: '0.1em', transition: 'color 0.15s' }}>→ CRÉER</div>
            </div>
          ); })()}

          {/* Prescription médicale */}
          {(() => { const h = hover === 'prescription'; return (
            <div onClick={() => router.push('/redm/cabinet/documentation/prescription-medicale')} onMouseEnter={() => setHover('prescription')} onMouseLeave={() => setHover(null)}
              style={{ background: h ? '#201808' : T.card, border: `2px solid ${h ? COL_P + '90' : T.border}`, borderLeft: `4px solid ${h ? COL_P : COL_P + '60'}`, padding: '28px 24px', cursor: 'pointer', transition: 'all 0.18s', transform: h ? 'translateY(-2px)' : 'none', boxShadow: h ? '0 8px 30px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.35)' }}>
              <div style={{ fontSize: 42, marginBottom: 14 }}>💊</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontFamily: DISPLAY, fontSize: 22, color: T.text }}>Prescription médicale</span>
                <span style={{ fontFamily: MONO, fontSize: 12, padding: '2px 7px', background: COL_P + '22', color: COL_P, border: `1px solid ${COL_P}55`, letterSpacing: '0.1em', flexShrink: 0 }}>RX</span>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 12, color: COL_P, letterSpacing: '0.12em', marginBottom: 8 }}>TOUS PATIENTS</div>
              <div style={{ fontFamily: BODY, fontSize: 16, color: T.dim, lineHeight: 1.55 }}>Ordonnance de décoctions, consignes de repos et recommandations thérapeutiques.</div>
              <div style={{ fontFamily: MONO, fontSize: 14, color: h ? COL_P : '#3A2A1A', marginTop: 14, letterSpacing: '0.1em', transition: 'color 0.15s' }}>→ CRÉER</div>
            </div>
          ); })()}

        </div>
      </div>

      {/* ── RÉSULTATS EXAMENS PSYCHIQUES ── */}
      <ResultsSection
        icon="🧠" title="Examens Psychiques & Moraux" color={COL} badge="PSY"
        count={hydrated ? exams.length : -1}
        onNew={() => router.push('/redm/cabinet/documentation/examen-psychique')}
        newLabel="✚ NOUVEL EXAMEN"
        empty="Aucun examen enregistré"
      >
        {exams.map((ex, i) => {
          const vc = VERDICT_COL[ex.verdict];
          return (
            <div key={ex.id} style={{ borderBottom: i < exams.length - 1 ? `1px solid ${T.border}` : 'none', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 20, background: delExam === ex.id ? 'rgba(139,64,64,0.08)' : 'transparent' }}>
              <div style={{ textAlign: 'center', minWidth: 72, flexShrink: 0 }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 28, color: vc, lineHeight: 1 }}>{ex.score}</div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: T.dim }}>/ {MAX_SCORE}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 19, color: T.text, marginBottom: 4 }}>{ex.prenom} {ex.nom}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: T.gold, background: 'rgba(128,104,45,0.10)', padding: '1px 8px' }}>{ex.fonction}</span>
                  {ex.county && <span style={{ fontFamily: MONO, fontSize: 12, color: T.muted }}>{ex.county}</span>}
                  <span style={{ fontFamily: MONO, fontSize: 12, color: T.dim }}>{rpDisplay(ex.date)}</span>
                </div>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 12, color: vc, background: vc + '18', border: `1px solid ${vc}40`, padding: '5px 14px', flexShrink: 0 }}>{ex.verdict}</div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => startEditExam(ex)} style={{ fontFamily: MONO, fontSize: 13, padding: '6px 10px', cursor: 'pointer', background: 'rgba(128,104,45,0.10)', color: T.gold, border: `1px solid rgba(128,104,45,0.3)` }}>✎</button>
                <button onClick={() => router.push(`/redm/cabinet/documentation/examen-psychique?id=${ex.id}&view=letter`)} style={{ fontFamily: MONO, fontSize: 12, padding: '6px 10px', cursor: 'pointer', background: `${COL}15`, color: COL, border: `1px solid ${COL}40` }}>📄 CERTIFICAT</button>
                {delExam === ex.id
                  ? <><button onClick={() => deleteExam(ex.id)} style={{ fontFamily: MONO, fontSize: 12, padding: '6px 10px', cursor: 'pointer', background: '#8B404025', color: '#963F36', border: '1px solid #8B404060' }}>OK?</button>
                      <button onClick={() => setDelExam(null)} style={{ fontFamily: MONO, fontSize: 12, padding: '6px 8px', cursor: 'pointer', background: 'transparent', color: T.dim, border: `1px solid ${T.border}` }}>✕</button></>
                  : <button onClick={() => setDelExam(ex.id)} style={{ fontFamily: MONO, fontSize: 13, padding: '6px 10px', cursor: 'pointer', background: 'transparent', color: '#8B6060', border: '1px solid rgba(139,64,64,0.3)' }}>✕</button>}
              </div>
            </div>
          );
        })}
      </ResultsSection>

      {/* ── RÉSULTATS SYNTHÈSES ── */}
      <ResultsSection
        icon="📋" title="Synthèses de consultation" color={COL_S} badge="SYN"
        count={hydrated ? syntheses.length : -1}
        onNew={() => router.push('/redm/cabinet/documentation/synthese-consultation')}
        newLabel="✚ NOUVELLE SYNTHÈSE"
        empty="Aucune synthèse enregistrée"
      >
        {syntheses.map((doc, i) => {
          const pat = patientById(doc.patientId);
          return (
            <div key={doc.id} style={{ borderBottom: i < syntheses.length - 1 ? `1px solid ${T.border}` : 'none', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 20, background: delDoc === doc.id ? 'rgba(139,64,64,0.08)' : 'transparent' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 19, color: T.text, marginBottom: 4 }}>{doc.titre}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {pat && <span style={{ fontFamily: MONO, fontSize: 12, color: T.gold, background: 'rgba(128,104,45,0.10)', padding: '1px 8px' }}>{pat.patientPrenom} {pat.patientNom}</span>}
                  <span style={{ fontFamily: MONO, fontSize: 12, color: T.dim }}>{rpDisplay(doc.date)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => openCert(doc)} style={{ fontFamily: MONO, fontSize: 12, padding: '6px 10px', cursor: 'pointer', background: `${COL_S}15`, color: COL_S, border: `1px solid ${COL_S}40` }}>📄 VOIR</button>
                {delDoc === doc.id
                  ? <><button onClick={() => deleteDoc(doc.id)} style={{ fontFamily: MONO, fontSize: 12, padding: '6px 10px', cursor: 'pointer', background: '#8B404025', color: '#963F36', border: '1px solid #8B404060' }}>OK?</button>
                      <button onClick={() => setDelDoc(null)} style={{ fontFamily: MONO, fontSize: 12, padding: '6px 8px', cursor: 'pointer', background: 'transparent', color: T.dim, border: `1px solid ${T.border}` }}>✕</button></>
                  : <button onClick={() => setDelDoc(doc.id)} style={{ fontFamily: MONO, fontSize: 13, padding: '6px 10px', cursor: 'pointer', background: 'transparent', color: '#8B6060', border: '1px solid rgba(139,64,64,0.3)' }}>✕</button>}
              </div>
            </div>
          );
        })}
      </ResultsSection>

      {/* ── RÉSULTATS PRESCRIPTIONS ── */}
      <ResultsSection
        icon="💊" title="Prescriptions médicales" color={COL_P} badge="RX"
        count={hydrated ? prescriptions.length : -1}
        onNew={() => router.push('/redm/cabinet/documentation/prescription-medicale')}
        newLabel="✚ NOUVELLE PRESCRIPTION"
        empty="Aucune prescription enregistrée"
      >
        {prescriptions.map((doc, i) => {
          const pat = patientById(doc.patientId);
          return (
            <div key={doc.id} style={{ borderBottom: i < prescriptions.length - 1 ? `1px solid ${T.border}` : 'none', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 20, background: delDoc === doc.id ? 'rgba(139,64,64,0.08)' : 'transparent' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 19, color: T.text, marginBottom: 4 }}>{doc.titre}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {pat && <span style={{ fontFamily: MONO, fontSize: 12, color: T.gold, background: 'rgba(128,104,45,0.10)', padding: '1px 8px' }}>{pat.patientPrenom} {pat.patientNom}</span>}
                  <span style={{ fontFamily: MONO, fontSize: 12, color: T.dim }}>{rpDisplay(doc.date)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => openCert(doc)} style={{ fontFamily: MONO, fontSize: 12, padding: '6px 10px', cursor: 'pointer', background: `${COL_P}15`, color: COL_P, border: `1px solid ${COL_P}40` }}>📄 VOIR</button>
                {delDoc === doc.id
                  ? <><button onClick={() => deleteDoc(doc.id)} style={{ fontFamily: MONO, fontSize: 12, padding: '6px 10px', cursor: 'pointer', background: '#8B404025', color: '#963F36', border: '1px solid #8B404060' }}>OK?</button>
                      <button onClick={() => setDelDoc(null)} style={{ fontFamily: MONO, fontSize: 12, padding: '6px 8px', cursor: 'pointer', background: 'transparent', color: T.dim, border: `1px solid ${T.border}` }}>✕</button></>
                  : <button onClick={() => setDelDoc(doc.id)} style={{ fontFamily: MONO, fontSize: 13, padding: '6px 10px', cursor: 'pointer', background: 'transparent', color: '#8B6060', border: '1px solid rgba(139,64,64,0.3)' }}>✕</button>}
              </div>
            </div>
          );
        })}
      </ResultsSection>

      {/* ══ PANEL CRÉATION ══ */}
      {createType && (
        <>
          <div onClick={() => setCreateType(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 40 }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 620, background: T.bg, borderLeft: `2px solid ${createType === 'Synthèse de consultation' ? COL_S : COL_P}`, zIndex: 50, display: 'flex', flexDirection: 'column', animation: 'slide-in 0.25s ease' }}>
            {/* En-tête */}
            <div style={{ padding: '24px 28px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 22, color: createType === 'Synthèse de consultation' ? COL_S : COL_P }}>
                  {createType === 'Synthèse de consultation' ? '📋' : '💊'} {createType}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 12, color: T.dim, marginTop: 4 }}>Nouveau document — rattacher à un patient</div>
              </div>
              <button onClick={() => setCreateType(null)} style={{ background: 'transparent', border: 'none', color: T.muted, fontSize: 26, cursor: 'pointer' }}>✕</button>
            </div>

            {/* Formulaire scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '22px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Sélection patient */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '16px 18px' }}>
                <div style={{ fontFamily: MONO, fontSize: 13, color: T.gold, letterSpacing: '0.1em', marginBottom: 12 }}>PATIENT</div>
                <div style={{ display: 'flex', gap: 0, marginBottom: 14, border: `1px solid ${T.border}` }}>
                  {(['existing', 'new'] as const).map(opt => (
                    <button key={opt} onClick={() => setUseExisting(opt === 'existing')}
                      style={{ flex: 1, fontFamily: MONO, fontSize: 13, padding: '8px', cursor: 'pointer', letterSpacing: '0.08em', border: 'none', background: (opt === 'existing') === useExisting ? 'rgba(128,104,45,0.18)' : 'transparent', color: (opt === 'existing') === useExisting ? T.gold : T.dim, borderBottom: (opt === 'existing') === useExisting ? `2px solid ${T.gold}` : '2px solid transparent' }}>
                      {opt === 'existing' ? '👤 PATIENT EXISTANT' : '✚ NOUVEAU PATIENT'}
                    </button>
                  ))}
                </div>

                {useExisting ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input style={inp} placeholder="Rechercher un patient…" value={patSearch} onChange={e => setPatSearch(e.target.value)} />
                    <select style={{ ...inp, cursor: 'pointer', maxHeight: 160 }} size={Math.min(5, filteredPats.length + 1)} value={selectedPat} onChange={e => setSelectedPat(e.target.value)}>
                      {filteredPats.length === 0
                        ? <option disabled>Aucun patient trouvé</option>
                        : filteredPats.map(p => <option key={p.id} value={p.id}>{p.patientPrenom} {p.patientNom}{p.patientAge ? ` — ${p.patientAge} ans` : ''}</option>)
                      }
                    </select>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><label style={lbl}>NOM *</label><input style={inp} value={newNom} onChange={e => setNewNom(e.target.value)} placeholder="Dupont" /></div>
                    <div><label style={lbl}>PRÉNOM</label><input style={inp} value={newPrenom} onChange={e => setNewPrenom(e.target.value)} placeholder="Jean" /></div>
                    <div style={{ gridColumn: '1/-1' }}><label style={lbl}>ÂGE</label><input style={inp} value={newAge} onChange={e => setNewAge(e.target.value)} placeholder="32 ans" /></div>
                  </div>
                )}
              </div>

              {/* Titre & date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
                <div><label style={lbl}>TITRE DU DOCUMENT</label>
                  <input style={inp} value={createTitre} onChange={e => setCreateTitre(e.target.value)} placeholder={createType} />
                </div>
                <div><label style={lbl}>DATE</label>
                  <input style={{ ...inp, width: 150 }} value={createDate} onChange={e => setCreateDate(e.target.value)} placeholder="JJ/MM/AAAA" />
                </div>
              </div>

              {/* Contenu / template */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={lbl}>CONTENU — REMPLISSEZ LES [ ] AVEC LES INFORMATIONS DU PATIENT</label>
                <textarea
                  style={{ ...inp, flex: 1, resize: 'none', minHeight: 420, lineHeight: 1.8, fontSize: 14, padding: '14px' }}
                  value={createContenu}
                  onChange={e => setCreateContenu(e.target.value)}
                />
              </div>
            </div>

            {/* Pied */}
            <div style={{ padding: '16px 28px 24px', borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
              <button onClick={submitCreate}
                disabled={useExisting ? !selectedPat : !newNom.trim()}
                style={{ width: '100%', fontFamily: MONO, fontSize: 16, letterSpacing: '0.14em', padding: '14px', cursor: 'pointer', background: `${createType === 'Synthèse de consultation' ? COL_S : COL_P}25`, color: createType === 'Synthèse de consultation' ? COL_S : COL_P, border: `2px solid ${createType === 'Synthèse de consultation' ? COL_S : COL_P}60` }}>
                ✔ ENREGISTRER LE DOCUMENT
              </button>
            </div>
          </div>
        </>
      )}

      {/* ══ PANEL ÉDITION EXAMEN ══ */}
      {editExam && (
        <>
          <div onClick={() => setEditExam(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 40 }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 500, background: T.bg, borderLeft: `2px solid ${COL}`, zIndex: 50, overflowY: 'auto', padding: '28px 28px 40px', animation: 'slide-in 0.25s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 20, color: T.gold }}>✎ Modifier l'examen</div>
              <button onClick={() => setEditExam(null)} style={{ background: 'transparent', border: 'none', color: T.muted, fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ fontFamily: DISPLAY, fontSize: 18, color: T.text, marginBottom: 18 }}>{editExam.prenom} {editExam.nom}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={lbl}>NOM</label><input style={inp} value={editForm.nom ?? ''} onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))} /></div>
                <div><label style={lbl}>PRÉNOM</label><input style={inp} value={editForm.prenom ?? ''} onChange={e => setEditForm(f => ({ ...f, prenom: e.target.value }))} /></div>
                <div><label style={lbl}>ÂGE</label><input style={inp} value={editForm.age ?? ''} onChange={e => setEditForm(f => ({ ...f, age: e.target.value }))} /></div>
                <div><label style={lbl}>DATE</label><input style={inp} value={editForm.date ?? ''} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} /></div>
                <div><label style={lbl}>FONCTION</label>
                  <select style={{ ...inp, cursor: 'pointer' }} value={editForm.fonction ?? ''} onChange={e => setEditForm(f => ({ ...f, fonction: e.target.value }))}>
                    <option>Sherif</option><option>Marshall</option>
                  </select>
                </div>
                <div><label style={lbl}>COMTÉ</label>
                  <select style={{ ...inp, cursor: 'pointer' }} value={editForm.county ?? ''} onChange={e => setEditForm(f => ({ ...f, county: e.target.value }))}>
                    <option value="">— Sélectionner —</option>
                    <option>East Wellster's</option><option>West Elizabeth</option>
                  </select>
                </div>
              </div>
              <div><label style={lbl}>ÉTAT ÉMOTIONNEL</label><input style={inp} value={editForm.etatEmotionnel ?? ''} onChange={e => setEditForm(f => ({ ...f, etatEmotionnel: e.target.value }))} /></div>
              <div><label style={lbl}>STABILITÉ NERVEUSE</label><input style={inp} value={editForm.stabiliteNerveuse ?? ''} onChange={e => setEditForm(f => ({ ...f, stabiliteNerveuse: e.target.value }))} /></div>
              <div><label style={lbl}>ÉLÉMENTS RETENUS</label><textarea style={{ ...inp, resize: 'vertical', minHeight: 70 }} value={editForm.elementsRetenus ?? ''} onChange={e => setEditForm(f => ({ ...f, elementsRetenus: e.target.value }))} /></div>
              <div><label style={lbl}>CONCLUSION</label><textarea style={{ ...inp, resize: 'vertical', minHeight: 80 }} value={editForm.conclusion ?? ''} onChange={e => setEditForm(f => ({ ...f, conclusion: e.target.value }))} /></div>
              <div><label style={lbl}>RECOMMANDATIONS</label><textarea style={{ ...inp, resize: 'vertical', minHeight: 70 }} value={editForm.recommandations ?? ''} onChange={e => setEditForm(f => ({ ...f, recommandations: e.target.value }))} /></div>
              <button onClick={saveEditExam} style={{ fontFamily: MONO, fontSize: 14, letterSpacing: '0.12em', padding: '13px', cursor: 'pointer', background: `${COL}33`, color: COL, border: `2px solid ${COL}80`, marginTop: 6 }}>
                ✔ ENREGISTRER LES MODIFICATIONS
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ══ Composant section résultats ══ */
function ResultsSection({ icon, title, color, badge, count, onNew, newLabel, empty, children }: {
  icon: string; title: string; color: string; badge: string;
  count: number; onNew: () => void; newLabel: string; empty: string;
  children: React.ReactNode;
}) {
  const MONO = "'Libre Baskerville', 'Courier New', monospace";
  const DISPLAY = "'Burnic', 'Georgia', serif";
  const T = { card: '#F7EEDB', border: 'rgba(139,90,43,0.30)', text: '#183746', dim: '#646850', gold: '#80682D' };
  const hasChildren = Array.isArray(children) ? children.some(Boolean) : !!children;
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 20, color: T.gold }}>{icon} {title}</span>
        <span style={{ fontFamily: MONO, fontSize: 12, padding: '2px 7px', background: color + '22', color, border: `1px solid ${color}55` }}>{badge}</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(128,104,45,0.20)' }} />
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `4px solid ${color}`, overflow: 'hidden' }}>
        <div style={{ padding: '14px 22px', borderBottom: `1px solid ${T.border}`, background: color + '10', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: MONO, fontSize: 12, color, letterSpacing: '0.1em' }}>{count < 0 ? '—' : count} DOCUMENT{count !== 1 ? 'S' : ''}</span>
          <button onClick={onNew} style={{ fontFamily: MONO, fontSize: 13, background: color + '22', border: `1px solid ${color}55`, color, padding: '7px 16px', cursor: 'pointer', letterSpacing: '0.1em' }}>{newLabel}</button>
        </div>
        {!hasChildren
          ? <div style={{ padding: '36px', textAlign: 'center', fontFamily: MONO, fontSize: 14, color: T.dim }}>{empty}</div>
          : <div style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>
        }
      </div>
    </div>
  );
}
