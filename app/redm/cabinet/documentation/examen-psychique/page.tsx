'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const DISPLAY = "'Central Station', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";
const BODY    = "'Cormorant Garamond', 'Georgia', serif";
const T = { bg: '#102B3B', card: '#183746', border: 'rgba(139,90,43,0.30)', gold: '#D1B77C', text: '#EADCB9', muted: '#C8BEA5', dim: '#C8BEA5' };
const COL = '#6B7ABB';

/* ── LocalStorage ── */
const LS_EXAMS    = 'redm_doc_examen_psychique_v1';
const LS_PATIENTS = 'redm_cabinet_patients_v2';
function loadExams(): Examen[]     { try { return JSON.parse(localStorage.getItem(LS_EXAMS)    ?? '[]'); } catch { return []; } }
function saveExams(d: Examen[])    { try { localStorage.setItem(LS_EXAMS, JSON.stringify(d)); }    catch {} }
function loadPatients(): Dossier[] { try { return JSON.parse(localStorage.getItem(LS_PATIENTS) ?? '[]'); } catch { return []; } }
function savePatients(d: Dossier[]){ try { localStorage.setItem(LS_PATIENTS, JSON.stringify(d)); } catch {} }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function rpDate(d = new Date()) {
  const s = d.toLocaleDateString('fr-FR').split('/'); s[2] = String(Number(s[2]) - 136); return s.join('/');
}
/** Convertit une date DD/MM/YYYY → DD/MM/YYYY en année RP (−136), peu importe si déjà en 1890 */
function rpDisplay(date: string): string {
  const p = date.split('/');
  if (p.length !== 3) return date;
  const y = Number(p[2]);
  if (isNaN(y)) return date;
  p[2] = String(y >= 1900 ? y - 136 : y);
  return p.join('/');
}

/* ── Interfaces ── */
interface Reponses { [key: string]: number }
interface Examen {
  id: string; createdAt: string;
  nom: string; prenom: string; age: string; fonction: string; county: string; lieu: string;
  date: string; docteur: string;
  reponses: Reponses;
  score: number; verdict: Verdict;
  etatEmotionnel: string; stabiliteNerveuse: string;
  elementsRetenus: string; conclusion: string; recommandations: string;
}
interface Dossier {
  id: string; patientNom: string; patientPrenom: string; patientAge: string;
  dateConsult: string; type: string; plainte: string;
  antecedentsPersonnels: string; antecedentsFamiliaux: string; evenementsRecents: string;
  equilibreNerveux: string; noteThérapeute: string;
  traitement: string; prochaine: string;
  statut: string; confidentiel: boolean; createdAt: string;
}

/* ── Verdict ── */
type Verdict = 'APTE' | 'À SURVEILLER' | 'INAPTE';
function getVerdict(score: number): Verdict {
  if (score >= 76) return 'APTE';
  if (score >= 41) return 'À SURVEILLER';
  return 'INAPTE';
}
const VERDICT_COL: Record<Verdict, string> = { 'APTE': '#4A8048', 'À SURVEILLER': '#D1B77C', 'INAPTE': '#DF9A88' };
const VERDICT_DESC: Record<Verdict, string> = {
  'APTE':         'Présente toutes les dispositions requises pour l\'exercice de ses fonctions, sans réserve notable.',
  'À SURVEILLER': 'Présente certaines fragilités d\'ordre nerveux, émotionnel ou moral nécessitant une observation régulière et un suivi thérapeutique recommandé.',
  'INAPTE':       'Présente des troubles susceptibles d\'altérer le jugement, la maîtrise de soi ou le discernement, pouvant constituer un risque dans l\'exercice de ses fonctions.',
};

/* ── Questions ── */
interface Scale { question: string; left: string; right: string }
const SCALES: { section: string; color: string; items: Scale[] }[] = [
  { section: 'OBSERVATION GÉNÉRALE DU PORT ET DU MAINTIEN', color: '#8B7ABB', items: [
    { question: 'Le sujet se présente-t-il avec un maintien droit et assuré ?', left: 'Instable ou négligé', right: 'Maintien droit et assuré' },
    { question: 'Son regard est-il :', left: 'Fixe ou agité', right: 'Franc et soutenu' },
    { question: 'Agitation nerveuse, tremblement des mains ou raideur corporelle.', left: 'Marquée', right: 'Aucune' },
  ]},
  { section: 'LUCIDITÉ & RAISON', color: '#7A9ABB', items: [
    { question: 'Pouvez-vous nommer le lieu où vous vous trouvez et la raison de votre présence ?', left: 'Incorrecte', right: 'Correcte' },
    { question: 'Quel jour de la semaine sommes-nous, et en quelle saison de l\'année ?', left: 'Incorrecte', right: 'Correcte' },
    { question: 'Avez-vous éprouvé des difficultés à distinguer le réel de l\'imaginaire ?', left: 'Fréquemment', right: 'Jamais' },
    { question: 'Vous arrive-t-il d\'entendre des voix, des murmures ou des injonctions que nul autre n\'entend ?', left: 'Fréquentes', right: 'Aucune' },
  ]},
  { section: 'DISPOSITIONS MORALES', color: '#BB8A6B', items: [
    { question: 'Estimez-vous que la loi est :', left: 'Un obstacle', right: 'Un guide juste' },
    { question: 'Avez-vous déjà ressenti le désir de punir un individu au-delà de ce que la loi prescrit ?', left: 'Souvent', right: 'Jamais' },
    { question: 'Lorsqu\'un malfaiteur échappe à la justice, que ressentez-vous ?', left: 'Vengeance personnelle', right: 'Frustration maîtrisée' },
  ]},
  { section: 'MAÎTRISE DES PASSIONS ET DES INSTINCTS', color: '#BB6B6B', items: [
    { question: 'Êtes-vous sujet à des accès de colère soudaine ?', left: 'Violents', right: 'Aucune' },
    { question: 'Ces accès vous ont-ils déjà conduit à des gestes que vous avez regrettés ?', left: 'Plusieurs fois', right: 'Jamais' },
    { question: 'Consommez-vous de l\'alcool ?', left: 'Excessive', right: 'Aucune' },
  ]},
  { section: 'SOMMEIL, RÊVES ET TROUBLES NOCTURNES', color: '#4A7A78', items: [
    { question: 'Comment dormez-vous ?', left: 'Agité', right: 'Paisible' },
    { question: 'Êtes-vous sujet à des cauchemars récurrents ?', left: 'Récurrents', right: 'Aucun' },
    { question: 'Ces rêves concernent-ils (violence, mort, poursuite) :', left: 'Obsessionnels', right: 'Sans violence' },
  ]},
  { section: 'RAPPORT À LA MORT, À LA VIOLENCE ET À LA SOLITUDE', color: '#6B6B6B', items: [
    { question: 'La vue d\'un cadavre provoque-t-elle chez vous :', left: 'Indifférence', right: 'Détachement sain' },
    { question: 'Préférez-vous travailler :', left: 'Seul par méfiance', right: 'En équipe' },
    { question: 'Craignez-vous parfois de devenir dur, insensible ou cruel avec le temps ?', left: 'Souvent', right: 'Non' },
  ]},
  { section: 'JUGEMENT FINAL DE L\'EXAMINATEUR', color: '#D1B77C', items: [
    { question: 'État de la raison', left: 'Préoccupant', right: 'Sain' },
    { question: 'Solidité morale', left: 'Déclinante', right: 'Forte' },
    { question: 'Aptitude à exercer l\'autorité', left: 'Insuffisante', right: 'Pleine' },
  ]},
];

const TOTAL_QUESTIONS = SCALES.reduce((s, sec) => s + sec.items.length, 0); // 22
const MAX_SCORE = TOTAL_QUESTIONS * 5; // 110

/* ── Composant échelle ── */
function ScaleInput({ id, scale, value, onChange }: { id: string; scale: Scale; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ marginBottom: 22, paddingBottom: 22, borderBottom: `1px solid ${T.border}` }}>
      <div style={{ fontFamily: BODY, fontSize: 17, color: T.text, marginBottom: 14, lineHeight: 1.5 }}>{scale.question}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: MONO, fontSize: 13, color: '#DF9A88', minWidth: 150, textAlign: 'right', lineHeight: 1.4 }}>{scale.left}</span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {[1, 2, 3, 4, 5].map(v => (
            <button key={v} type="button" onClick={() => onChange(v)}
              style={{ width: 42, height: 42, borderRadius: '50%', cursor: 'pointer', background: value === v ? COL : 'rgba(0,0,0,0.3)', border: `2px solid ${value === v ? COL : T.border}`, color: value === v ? '#fff' : T.dim, fontFamily: MONO, fontSize: 16, transition: 'all 0.15s', flexShrink: 0 }}>
              {v}
            </button>
          ))}
        </div>
        <span style={{ fontFamily: MONO, fontSize: 13, color: '#4A8048', minWidth: 150, lineHeight: 1.4 }}>{scale.right}</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════ PAGE ════════════════════════════════ */
export default function ExamenPsychiquePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const printRef = useRef<HTMLDivElement>(null);

  const [view,    setView]    = useState<'form' | 'result' | 'archives' | 'letter'>('form');
  const [archives, setArchives] = useState<Examen[]>([]);
  const [current,  setCurrent]  = useState<Examen | null>(null);
  const [hydrated, setHydrated] = useState(false);

  /* Champs identité */
  const [nom,       setNom]       = useState('');
  const [prenom,    setPrenom]    = useState('');
  const [age,       setAge]       = useState('');
  const [fonction,  setFonction]  = useState('Sherif');
  const [county,    setCounty]    = useState('');
  const [lieu,      setLieu]      = useState('Little Creek');
  const [date,      setDate]      = useState(rpDate());
  const [docteur,   setDocteur]   = useState('Dr François De Millet');
  const [reponses,  setReponses]  = useState<Reponses>({});

  /* Champs conclusion */
  const [etatEmotionnel,    setEtatEmotionnel]    = useState('');
  const [stabiliteNerveuse, setStabiliteNerveuse] = useState('');
  const [elementsRetenus,   setElementsRetenus]   = useState('');
  const [conclusion,        setConclusion]        = useState('');
  const [recommandations,   setRecommandations]   = useState('');

  useEffect(() => {
    const list = loadExams();
    setArchives(list);
    setHydrated(true);
    // Ouvrir directement le certificat si ?id=xxx&view=letter
    const paramId   = searchParams.get('id');
    const paramView = searchParams.get('view');
    if (paramId && paramView === 'letter') {
      const found = list.find(e => e.id === paramId);
      if (found) { setCurrent(found); setView('letter'); }
    }
  }, []);

  /* Score */
  const answered    = Object.keys(reponses).length;
  const score       = Object.values(reponses).reduce((s, v) => s + v, 0);
  const verdict     = getVerdict(score);
  const verdictCol  = VERDICT_COL[verdict];

  function setReponse(key: string, val: number) { setReponses(r => ({ ...r, [key]: val })); }

  /* ── Créer dossier patient ── */
  function createPatientDossier(ex: Examen) {
    const patients = loadPatients();
    const dossier: Dossier = {
      id: uid(),
      patientNom:    ex.nom,
      patientPrenom: ex.prenom,
      patientAge:    ex.age,
      dateConsult:   ex.date,
      type:          'Première consultation',
      plainte:       `Examen psychique & moral — ${ex.fonction}${ex.county ? ' du comté de ' + ex.county : ''}`,
      antecedentsPersonnels: '',
      antecedentsFamiliaux:  '',
      evenementsRecents:     '',
      equilibreNerveux:      ex.score < 41 ? 'III' : ex.score < 76 ? 'II' : 'I',
      noteThérapeute:        `Score examen psychique : ${ex.score}/${MAX_SCORE} — Verdict : ${ex.verdict}\n\n${ex.conclusion}`,
      traitement:            ex.recommandations,
      prochaine:             '',
      statut:                'EN COURS',
      confidentiel:          true,
      createdAt:             new Date().toISOString(),
    };
    savePatients([dossier, ...patients]);
  }

  /* ── Soumettre ── */
  function submit() {
    if (!nom.trim() || answered < TOTAL_QUESTIONS) return;
    const v = getVerdict(score);
    const examen: Examen = {
      id: uid(), createdAt: new Date().toISOString(),
      nom, prenom, age, fonction, county, lieu, date, docteur,
      reponses, score, verdict: v,
      etatEmotionnel, stabiliteNerveuse, elementsRetenus, conclusion, recommandations,
    };
    const list = [examen, ...loadExams()];
    saveExams(list);
    setArchives(list);
    createPatientDossier(examen);
    setCurrent(examen);
    setView('result');
  }

  function reset() {
    setNom(''); setPrenom(''); setAge(''); setFonction('Sherif'); setCounty('');
    setDate(rpDate()); setLieu('Little Creek'); setDocteur('Dr François De Millet'); setReponses({});
    setEtatEmotionnel(''); setStabiliteNerveuse(''); setElementsRetenus('');
    setConclusion(''); setRecommandations('');
    setView('form');
  }

  /* ══════════════════════ VUE RÉSULTAT ══════════════════════ */
  if (view === 'result' && current) {
    const vc = VERDICT_COL[current.verdict];
    return (
      <div style={{ fontFamily: BODY, maxWidth: 720, margin: '0 auto' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');`}</style>

        {/* Fiche résultat */}
        <div style={{ background: T.card, border: `2px solid ${vc}55`, borderTop: `6px solid ${vc}`, padding: '40px 44px', marginBottom: 24 }}>
          <div style={{ fontFamily: MONO, fontSize: 13, color: COL, letterSpacing: '0.18em', marginBottom: 16, textAlign: 'center' }}>
            CABINET THÉRAPEUTIQUE · EXAMEN PSYCHIQUE & MORAL
          </div>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 30, color: T.gold, marginBottom: 6 }}>{current.prenom} {current.nom}</div>
            <div style={{ fontFamily: MONO, fontSize: 15, color: T.muted, marginBottom: 16 }}>{current.fonction}{current.county ? ` — Comté de ${current.county}` : ''} · {current.date}</div>
            <div style={{ display: 'inline-block', background: vc + '22', border: `2px solid ${vc}`, padding: '14px 40px', textAlign: 'center' }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 50, color: vc, lineHeight: 1 }}>{current.score}</div>
              <div style={{ fontFamily: MONO, fontSize: 13, color: T.dim, letterSpacing: '0.1em', marginTop: 4 }}>POINTS / {MAX_SCORE}</div>
            </div>
          </div>

          {/* Verdict */}
          <div style={{ background: vc + '15', border: `1px solid ${vc}40`, borderLeft: `5px solid ${vc}`, padding: '18px 24px', marginBottom: 20 }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 26, color: vc, marginBottom: 6 }}>{current.verdict}</div>
            <div style={{ fontFamily: BODY, fontSize: 17, color: T.text, lineHeight: 1.6 }}>{VERDICT_DESC[current.verdict]}</div>
          </div>

          {/* Détails conclusion */}
          {current.conclusion && (
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 18, marginTop: 4 }}>
              <div style={{ fontFamily: MONO, fontSize: 13, color: T.dim, letterSpacing: '0.1em', marginBottom: 8 }}>CONCLUSION DU MÉDECIN</div>
              <div style={{ fontFamily: BODY, fontSize: 16, color: T.text, lineHeight: 1.65, fontStyle: 'italic' }}>{current.conclusion}</div>
            </div>
          )}

          <div style={{ marginTop: 24, paddingTop: 18, borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: MONO, fontSize: 13, color: T.dim }}>✔ Dossier patient créé automatiquement</div>
            <div style={{ fontFamily: MONO, fontSize: 13, color: T.dim }}>Signé : {current.docteur}</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 60 }}>
          <button onClick={() => setView('letter')} style={{ fontFamily: MONO, fontSize: 14, letterSpacing: '0.1em', padding: '13px 22px', cursor: 'pointer', background: `${COL}22`, color: COL, border: `1px solid ${COL}55`, flex: 1 }}>
            📄 VOIR LE CERTIFICAT
          </button>
          <button onClick={() => setView('archives')} style={{ fontFamily: MONO, fontSize: 14, letterSpacing: '0.1em', padding: '13px 22px', cursor: 'pointer', background: 'rgba(209,183,124,0.12)', color: T.gold, border: `1px solid rgba(209,183,124,0.4)`, flex: 1 }}>
            📁 ARCHIVES
          </button>
          <button onClick={reset} style={{ fontFamily: MONO, fontSize: 14, letterSpacing: '0.1em', padding: '13px 22px', cursor: 'pointer', background: 'rgba(74,96,72,0.2)', color: '#A8B991', border: '1px solid rgba(74,96,72,0.4)', flex: 1 }}>
            ✚ NOUVEL EXAMEN
          </button>
          <button onClick={() => router.push('/redm/cabinet/patients')} style={{ fontFamily: MONO, fontSize: 14, letterSpacing: '0.1em', padding: '13px 22px', cursor: 'pointer', background: 'transparent', color: T.muted, border: `1px solid ${T.border}`, flex: 1 }}>
            👤 VOIR LE DOSSIER
          </button>
        </div>
      </div>
    );
  }

  /* ── Enregistrer en PNG format A4 ── */
  async function saveAsPng() {
    const el = printRef.current;
    if (!el) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(el, { backgroundColor: '#183746', scale: 2, useCORS: true, allowTaint: true, logging: false });
      const link = document.createElement('a');
      link.download = `examen-${current?.prenom ?? ''}-${current?.nom ?? ''}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) { console.error('PNG export:', e); }
  }

  /* ══════════════════════ VUE LETTRE / CERTIFICAT ══════════════════════ */
  if (view === 'letter' && current) {
    const vc = VERDICT_COL[current.verdict];
    return (
      <div style={{ fontFamily: BODY }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
          @font-face {
            font-family: 'Libre Baskerville';
            src: url('/SpecialElite-Regular.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
          }
          @media print {
            .no-print { display: none !important; }
            .print-area { background: white !important; color: black !important; padding: 40px !important; font-family: 'Libre Baskerville', 'Courier New', monospace !important; }
          }
        `}</style>

        <div className="no-print" style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <button onClick={() => searchParams.get('id') ? router.push('/redm/cabinet/documentation') : setView('result')} style={{ fontFamily: MONO, fontSize: 14, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '9px 20px', cursor: 'pointer', letterSpacing: '0.1em' }}>← RETOUR</button>
          <button onClick={() => window.print()} style={{ fontFamily: MONO, fontSize: 14, background: `${COL}22`, border: `1px solid ${COL}55`, color: COL, padding: '9px 22px', cursor: 'pointer', letterSpacing: '0.1em' }}>🖨 IMPRIMER</button>
          <button onClick={saveAsPng} style={{ fontFamily: MONO, fontSize: 14, background: 'rgba(122,154,106,0.18)', border: '1px solid rgba(122,154,106,0.5)', color: '#526C45', padding: '9px 22px', cursor: 'pointer', letterSpacing: '0.1em' }}>💾 ENREGISTRER PNG</button>
        </div>

        {/* Certificat */}
        <div ref={printRef} className="print-area" style={{ background: '#183746', border: '2px solid #C8BEA5', padding: '52px 60px', width: 794, maxWidth: 794, margin: '0 auto', color: '#102B3B', fontFamily: "'Libre Baskerville', 'Courier New', monospace" }}>

          {/* En-tête */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 20, letterSpacing: '0.12em', marginBottom: 4, fontWeight: 'bold' }}>CABINET THÉRAPEUTIQUE PSYCHIQUE</div>
            <div style={{ fontSize: 15, color: '#4A3018', marginBottom: 4 }}>Little Creek — Blackwater</div>
            <div style={{ fontSize: 13, color: '#6A5030', lineHeight: 1.7 }}>
              Sous la direction du Docteur François De Millet<br />
              Médecin – Thérapeute, formé aux doctrines modernes de la médecine mentale et des sciences morales
            </div>
          </div>

          {/* Titre */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 17, letterSpacing: '0.1em', textDecoration: 'underline', textUnderlineOffset: 6, fontWeight: 'bold' }}>
              CERTIFICAT D'EXAMEN PSYCHIQUE ET MORAL
            </div>
          </div>

          {/* Corps */}
          <div style={{ fontSize: 15, lineHeight: 2 }}>
            <p style={{ margin: '0 0 16px' }}>Je soussigné, <strong>Docteur François De Millet</strong>, médecin – thérapeute exerçant au sein du L'ORDRES DES MÉDECINS - Hôpital de Little Creek - Dispensaire de Valentine, certifie avoir procédé, en date du <strong>{rpDisplay(current.date)}</strong>, à un examen attentif des facultés psychiques, morales et comportementales de :</p>
            <p style={{ paddingLeft: 28, margin: '0 0 16px' }}>
              <strong>Nom et Prénom :</strong> {current.prenom} {current.nom}<br />
              <strong>Fonction :</strong> {current.fonction}{current.county ? ` du comté de ${current.county}` : ''}
            </p>

            <p style={{ margin: '24px 0 8px', fontWeight: 'bold', textDecoration: 'underline', textUnderlineOffset: 4 }}>OBJET DE L'EXAMEN</p>
            <p style={{ margin: '0 0 16px' }}>Le présent examen a été requis afin d'évaluer l'état de stabilité mentale, la maîtrise des émotions, le discernement moral ainsi que l'aptitude du sujet à exercer des fonctions d'autorité impliquant jugement, sang-froid et responsabilité.</p>

            <p style={{ margin: '24px 0 8px', fontWeight: 'bold', textDecoration: 'underline', textUnderlineOffset: 4 }}>OBSERVATIONS GÉNÉRALES</p>
            <p style={{ margin: '0 0 8px' }}>À l'issue de l'entretien, des observations cliniques et de l'analyse comportementale, il ressort que le sujet présente :</p>
            <ul style={{ paddingLeft: 28, margin: '0 0 16px', lineHeight: 2.2 }}>
              <li>Une conscience claire de sa fonction et des responsabilités qui lui incombent</li>
              <li>Une capacité de raisonnement globalement cohérente</li>
              <li>Un état émotionnel : <strong>{current.etatEmotionnel || '________________________'}</strong></li>
              <li>Une stabilité nerveuse : <strong>{current.stabiliteNerveuse || '____________________'}</strong></li>
            </ul>
            {current.elementsRetenus && (
              <p style={{ margin: '0 0 16px' }}>Toutefois, certains éléments ont retenu l'attention du praticien, notamment : <em>{current.elementsRetenus}</em></p>
            )}

            <p style={{ margin: '24px 0 8px', fontWeight: 'bold', textDecoration: 'underline', textUnderlineOffset: 4 }}>CONCLUSION MÉDICALE</p>
            <p style={{ margin: '0 0 12px' }}>Au regard des éléments observés, le sujet est classé dans la catégorie suivante :</p>

            {(['APTE', 'À SURVEILLER', 'INAPTE'] as Verdict[]).map(v => (
              <div key={v} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 18, height: 18, border: '2px solid #102B3B', background: current.verdict === v ? '#102B3B' : 'transparent', flexShrink: 0, marginTop: 4 }} />
                <div style={{ lineHeight: 1.7 }}>
                  <strong>{v === 'INAPTE' ? 'POTENTIELLEMENT DANGEREUX / INAPTE' : v} :</strong>{' '}
                  <span style={{ fontStyle: 'italic', fontSize: 13 }}>{VERDICT_DESC[v]}</span>
                </div>
              </div>
            ))}

            <p style={{ margin: '16px 0' }}><strong>Score obtenu :</strong> {current.score} points sur {MAX_SCORE}</p>
            {current.conclusion && <p style={{ margin: '0 0 16px' }}><strong>Motifs :</strong> {current.conclusion}</p>}

            {current.recommandations && (
              <>
                <p style={{ margin: '24px 0 8px', fontWeight: 'bold', textDecoration: 'underline', textUnderlineOffset: 4 }}>RECOMMANDATIONS</p>
                <p style={{ margin: '0 0 16px' }}>{current.recommandations}</p>
              </>
            )}

            {/* Signature */}
            <div style={{ marginTop: 52 }}>
              <div style={{ fontSize: 14, color: '#6A5030', lineHeight: 2 }}>
                Fait à <strong>{current.lieu || 'Little Creek'}</strong>, le <strong>{rpDisplay(current.date)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════ VUE ARCHIVES ══════════════════════ */
  if (view === 'archives') return (
    <div style={{ fontFamily: BODY }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');`}</style>
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <button onClick={() => setView('form')} style={{ fontFamily: MONO, fontSize: 15, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '9px 20px', cursor: 'pointer', letterSpacing: '0.1em' }}>← RETOUR</button>
        <span style={{ fontFamily: DISPLAY, fontSize: 26, color: T.gold }}>📁 Archives — Examens Psychiques</span>
        <span style={{ fontFamily: MONO, fontSize: 13, color: T.dim, marginLeft: 'auto' }}>{archives.length} examen{archives.length !== 1 ? 's' : ''}</span>
      </div>
      {archives.length === 0
        ? <div style={{ fontFamily: MONO, fontSize: 15, color: T.dim, padding: 40, textAlign: 'center', border: `1px dashed ${T.border}` }}>Aucun examen archivé</div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {archives.map(ex => {
              const vc = VERDICT_COL[ex.verdict];
              return (
                <div key={ex.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `5px solid ${vc}`, padding: '20px 26px', display: 'flex', alignItems: 'center', gap: 22 }}>
                  <div style={{ textAlign: 'center', minWidth: 80, flexShrink: 0 }}>
                    <div style={{ fontFamily: DISPLAY, fontSize: 32, color: vc }}>{ex.score}</div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: vc, letterSpacing: '0.08em' }}>/ {MAX_SCORE}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: DISPLAY, fontSize: 20, color: T.text, marginBottom: 4 }}>{ex.prenom} {ex.nom}</div>
                    <div style={{ fontFamily: MONO, fontSize: 13, color: T.dim, marginBottom: 6 }}>{ex.fonction}{ex.county ? ` — Comté de ${ex.county}` : ''} · {ex.date} · {ex.docteur}</div>
                    {ex.conclusion && <div style={{ fontFamily: BODY, fontSize: 15, color: T.muted, fontStyle: 'italic', lineHeight: 1.5 }}>{ex.conclusion}</div>}
                  </div>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontFamily: MONO, fontSize: 13, color: vc, background: vc + '18', border: `1px solid ${vc}40`, padding: '6px 14px', letterSpacing: '0.1em' }}>{ex.verdict}</div>
                  </div>
                  <button onClick={() => { setCurrent(ex); setView('letter'); }}
                    style={{ fontFamily: MONO, fontSize: 13, background: `${COL}18`, border: `1px solid ${COL}40`, color: COL, padding: '8px 14px', cursor: 'pointer', flexShrink: 0, letterSpacing: '0.08em' }}>
                    📄 CERTIFICAT
                  </button>
                </div>
              );
            })}
          </div>}
    </div>
  );

  /* ══════════════════════ VUE FORMULAIRE ══════════════════════ */
  const inp: React.CSSProperties = { fontFamily: MONO, fontSize: 16, background: 'rgba(0,0,0,0.28)', border: `1px solid ${T.border}`, color: T.text, padding: '11px 16px', outline: 'none', boxSizing: 'border-box', width: '100%' };
  const lbl: React.CSSProperties = { fontFamily: MONO, fontSize: 13, color: T.dim, letterSpacing: '0.12em', marginBottom: 8, display: 'block' };
  const canSubmit = nom.trim() && answered === TOTAL_QUESTIONS;

  return (
    <div style={{ fontFamily: BODY, maxWidth: 880, margin: '0 auto' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');`}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <button onClick={() => router.push('/redm/cabinet/documentation')}
            style={{ fontFamily: MONO, fontSize: 15, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '9px 20px', cursor: 'pointer', letterSpacing: '0.1em' }}>
            ← RETOUR
          </button>
          <span style={{ fontFamily: MONO, fontSize: 13, color: COL, letterSpacing: '0.16em' }}>CABINET · DOCUMENTATION · EXAMEN PSYCHIQUE</span>
          <button onClick={() => setView('archives')} style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 13, background: 'rgba(209,183,124,0.10)', border: `1px solid rgba(209,183,124,0.3)`, color: T.gold, padding: '8px 16px', cursor: 'pointer', letterSpacing: '0.1em' }}>
            📁 ARCHIVES ({archives.length})
          </button>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderTop: `4px solid ${COL}`, padding: '28px 32px', textAlign: 'center' }}>
          <div style={{ fontFamily: MONO, fontSize: 13, color: COL, letterSpacing: '0.2em', marginBottom: 8 }}>DISPENSAIRE MÉDICAL · 1890</div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: 34, color: T.gold, margin: '0 0 6px' }}>Examen Psychique & Moral</h1>
          <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.12em', marginBottom: 4 }}>FORMULAIRE OFFICIEL — AGENTS DE L'ORDRE (SHERIF)</div>
          <div style={{ fontFamily: MONO, fontSize: 12, color: T.dim }}>Score max : {MAX_SCORE} pts · APTE ≥ 76 · À SURVEILLER 41–75 · INAPTE ≤ 40</div>
        </div>
      </div>

      {/* Identité */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `4px solid ${COL}`, marginBottom: 24, overflow: 'hidden' }}>
        <div style={{ padding: '14px 24px', borderBottom: `1px solid ${T.border}`, background: COL + '12' }}>
          <span style={{ fontFamily: MONO, fontSize: 15, color: COL, letterSpacing: '0.14em' }}>👤 IDENTITÉ DU SUJET</span>
        </div>
        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
          <div><label style={lbl}>NOM *</label><input style={inp} value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom de famille" /></div>
          <div><label style={lbl}>PRÉNOM</label><input style={inp} value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Prénom" /></div>
          <div><label style={lbl}>ÂGE</label><input style={inp} value={age} onChange={e => setAge(e.target.value)} placeholder="Âge" /></div>
          <div><label style={lbl}>FONCTION</label>
            <select style={{ ...inp, cursor: 'pointer' }} value={fonction} onChange={e => setFonction(e.target.value)}>
              <option value="Sherif">Sherif</option>
              <option value="Marshall">Marshall</option>
            </select>
          </div>
          <div><label style={lbl}>COMTÉ</label>
            <select style={{ ...inp, cursor: 'pointer' }} value={county} onChange={e => setCounty(e.target.value)}>
              <option value="">— Sélectionner —</option>
              <option value="East Wellster's">East Wellster's</option>
              <option value="West Elizabeth">West Elizabeth</option>
            </select>
          </div>
          <div><label style={lbl}>DATE DE L'EXAMEN</label><input style={inp} value={date} onChange={e => setDate(e.target.value)} /></div>
          <div><label style={lbl}>LIEU DE L'EXAMEN</label>
            <select style={{ ...inp, cursor: 'pointer' }} value={lieu} onChange={e => setLieu(e.target.value)}>
              <option value="Little Creek">Little Creek</option>
              <option value="Blackwater">Blackwater</option>
            </select>
          </div>
          <div><label style={lbl}>DOCTEUR EN CHARGE</label><input style={inp} value={docteur} onChange={e => setDocteur(e.target.value)} /></div>
        </div>
      </div>

      {/* Score en direct */}
      {answered > 0 && (
        <div style={{ background: T.card, border: `1px solid ${verdictCol}40`, borderLeft: `4px solid ${verdictCol}`, padding: '16px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 13, color: T.dim, letterSpacing: '0.1em', marginBottom: 4 }}>{answered}/{TOTAL_QUESTIONS} questions · {score}/{MAX_SCORE} points</div>
            <div style={{ fontFamily: MONO, fontSize: 16, color: verdictCol, letterSpacing: '0.08em' }}>{verdict}</div>
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: 44, color: verdictCol }}>{score}</div>
        </div>
      )}

      {/* Sections questions */}
      {SCALES.map((sec, si) => (
        <div key={si} style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `4px solid ${sec.color}`, marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ padding: '14px 24px', borderBottom: `1px solid ${T.border}`, background: sec.color + '12' }}>
            <span style={{ fontFamily: MONO, fontSize: 14, color: sec.color, letterSpacing: '0.14em' }}>{sec.section}</span>
          </div>
          <div style={{ padding: '24px' }}>
            {sec.items.map((item, qi) => {
              const key = `${si}-${qi}`;
              return <ScaleInput key={key} id={key} scale={item} value={reponses[key] ?? 0} onChange={v => setReponse(key, v)} />;
            })}
          </div>
        </div>
      ))}

      {/* Champs conclusion médecin */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `4px solid ${T.gold}`, marginBottom: 24, overflow: 'hidden' }}>
        <div style={{ padding: '14px 24px', borderBottom: `1px solid ${T.border}`, background: T.gold + '10' }}>
          <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold, letterSpacing: '0.14em' }}>✍ CONCLUSION DU MÉDECIN</span>
        </div>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><label style={lbl}>ÉTAT ÉMOTIONNEL</label><input style={inp} value={etatEmotionnel} onChange={e => setEtatEmotionnel(e.target.value)} placeholder="Stable, agité, mélancolique…" /></div>
            <div><label style={lbl}>STABILITÉ NERVEUSE</label><input style={inp} value={stabiliteNerveuse} onChange={e => setStabiliteNerveuse(e.target.value)} placeholder="Bonne, fragile, préoccupante…" /></div>
          </div>
          <div><label style={lbl}>ÉLÉMENTS PARTICULIERS RETENUS</label><textarea style={{ ...inp, resize: 'vertical', minHeight: 80 }} value={elementsRetenus} onChange={e => setElementsRetenus(e.target.value)} placeholder="Observations spécifiques, comportements notables…" /></div>
          <div><label style={lbl}>CONCLUSION GÉNÉRALE</label><textarea style={{ ...inp, resize: 'vertical', minHeight: 90 }} value={conclusion} onChange={e => setConclusion(e.target.value)} placeholder="Appréciation globale du praticien…" /></div>
          <div><label style={lbl}>RECOMMANDATIONS</label><textarea style={{ ...inp, resize: 'vertical', minHeight: 80 }} value={recommandations} onChange={e => setRecommandations(e.target.value)} placeholder="Suivi recommandé, mesures à prendre…" /></div>
        </div>
      </div>

      {/* Bouton soumettre */}
      {!canSubmit && answered < TOTAL_QUESTIONS && answered > 0 && (
        <div style={{ fontFamily: MONO, fontSize: 13, color: '#D1B77C', marginBottom: 12, textAlign: 'center' }}>
          {TOTAL_QUESTIONS - answered} question{TOTAL_QUESTIONS - answered > 1 ? 's' : ''} restante{TOTAL_QUESTIONS - answered > 1 ? 's' : ''}
        </div>
      )}
      <button onClick={submit} disabled={!canSubmit}
        style={{ fontFamily: MONO, fontSize: 16, letterSpacing: '0.14em', padding: '16px 40px', cursor: canSubmit ? 'pointer' : 'not-allowed', background: canSubmit ? `${COL}33` : 'rgba(255,255,255,0.04)', color: canSubmit ? COL : T.dim, border: `2px solid ${canSubmit ? COL + '80' : T.border}`, width: '100%', marginBottom: 60, transition: 'all 0.2s' }}>
        ✔ ENREGISTRER L'EXAMEN — CRÉER LE DOSSIER PATIENT
      </button>
    </div>
  );
}
