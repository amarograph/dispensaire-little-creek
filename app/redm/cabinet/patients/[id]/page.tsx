'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';

const DISPLAY = "'Central Station', 'Georgia', serif";
const BODY    = "'Cormorant Garamond', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";
const T = { bg: '#102B3B', card: '#183746', border: 'rgba(139,90,43,0.30)', gold: '#D1B77C', text: '#EADCB9', muted: '#C8BEA5', dim: '#C8BEA5' };

/* ── Types ── */
type Statut    = 'EN COURS' | 'TERMINÉE' | 'ABANDONNÉE';
type Equilibre = '' | 'I' | 'II' | 'III';
interface Dossier {
  id: string; patientNom: string; patientPrenom: string; patientAge: string; patientMetier: string;
  dateConsult: string; type: string; plainte: string;
  antecedentsPersonnels: string; antecedentsFamiliaux: string; evenementsRecents: string;
  equilibreNerveux: Equilibre; noteThérapeute: string;
  traitement: string; prochaine: string;
  statut: Statut; confidentiel: boolean; createdAt: string;
}
type DocType = 'Synthèse de consultation' | 'Prescription médicale' | 'Rapport médical' | 'Lettre de correspondance' | "Note d'évolution" | 'Attestation';
interface Document {
  id: string; patientId: string; type: DocType;
  titre: string; contenu: string; date: string; createdAt: string;
}

/* ── Types comptabilité ── */
type StatutPaiement = 'PAYÉ' | 'EN ATTENTE' | 'ANNULÉ';
type TypePrestation = 'Consultation' | 'Traitement';
type Payeur         = 'Civil' | 'Sherif WE' | 'Sherif NH' | 'Marshall' | 'Vétéran';
interface Facture {
  id: string; patientNom: string; dateSeance: string;
  prestations: TypePrestation[]; montant: number;
  payeur: Payeur; statut: StatutPaiement; notes: string; createdAt: string;
}
interface SemaineArchivee {
  id: string; weekLabel: string; weekStart: string;
  factures: Facture[]; archivedAt: string;
  totalPercu: number; totalAttente: number;
}

/* ── localStorage pour comptabilité uniquement ── */
const LS_COMPTA   = 'redm_cabinet_compta_v1';
const LS_COMPTA_A = 'redm_cabinet_compta_archives_v1';
function loadAllFactures(): Facture[] {
  try {
    const current: Facture[]         = JSON.parse(localStorage.getItem(LS_COMPTA)   ?? '[]');
    const arcs: SemaineArchivee[]    = JSON.parse(localStorage.getItem(LS_COMPTA_A) ?? '[]');
    const archived: Facture[]        = arcs.flatMap(a => a.factures);
    return [...current, ...archived];
  } catch { return []; }
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
/** Parse DD/MM/YYYY (RP ou réel) → timestamp pour tri */
function parseDateTs(dateStr: string): number {
  const p = dateStr.split('/');
  if (p.length !== 3) return 0;
  const [d, m, y] = p.map(Number);
  const realY = y < 1900 ? y + 136 : y;
  return new Date(realY, m - 1, d).getTime();
}
/** Convertit une date DD/MM/YYYY → DD/MM/YYYY en année RP (−136), peu importe si elle est déjà en 1890 */
function rpDisplay(date: string): string {
  const p = date.split('/');
  if (p.length !== 3) return date;
  const y = Number(p[2]);
  if (isNaN(y)) return date;
  p[2] = String(y >= 1900 ? y - 136 : y);
  return p.join('/');
}

/* ── Constantes ── */
const STATUT_COL: Record<Statut, string> = { 'EN COURS': '#D1B77C', 'TERMINÉE': '#A8B991', 'ABANDONNÉE': '#8B4040' };
const EQ_INFO: Record<string, { label: string; desc: string; col: string }> = {
  I:   { label: 'Degré I — Léger',   desc: "Troubles passagers, n'altérant point durablement les facultés du sujet", col: '#A8B991' },
  II:  { label: 'Degré II — Modéré', desc: 'Atteinte notable nécessitant observation régulière et encadrement',      col: '#786030' },
  III: { label: 'Degré III — Grave', desc: 'Altération profonde des fonctions morales, nécessitant surveillance étroite', col: '#8B4040' },
};
const DOC_TYPES: DocType[] = ['Synthèse de consultation', 'Prescription médicale', 'Rapport médical', 'Lettre de correspondance', "Note d'évolution", 'Attestation'];
const DOC_ICONS: Record<DocType, string> = {
  'Synthèse de consultation': '📋', 'Prescription médicale': '💊',
  'Rapport médical': '🔬', 'Lettre de correspondance': '✉️',
  "Note d'évolution": '📝', 'Attestation': '📜',
};
const DOC_COL: Record<DocType, string> = {
  'Synthèse de consultation': '#D1B77C', 'Prescription médicale': '#A8B991',
  'Rapport médical': '#AAB9C6', 'Lettre de correspondance': '#786030',
  "Note d'évolution": '#6B4A78', 'Attestation': '#8B4040',
};

/* ── Templates ── */
const TEMPLATES: Partial<Record<DocType, string>> = {
  'Synthèse de consultation': `SYNTHÈSE DE CONSULTATION
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
Son esprit [description].`,

  'Prescription médicale': `Prescription Médicale
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
[Aggravation / symptôme critique]`,
};

/* ── Constantes compta ── */
const PAI_COL:  Record<StatutPaiement, string> = { 'PAYÉ': '#A8B991', 'EN ATTENTE': '#D1B77C', 'ANNULÉ': '#8B4040' };
const PAI_ICON: Record<StatutPaiement, string> = { 'PAYÉ': '✔', 'EN ATTENTE': '⏳', 'ANNULÉ': '✕' };
const TARIFS: Record<TypePrestation, number>   = { 'Consultation': 1, 'Traitement': 0.4 };
function fmt$(n: number) { return n.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' $'; }

/* ── Styles ── */
const inp: React.CSSProperties = { fontFamily: MONO, fontSize: 16, background: 'rgba(0,0,0,0.28)', border: `1px solid ${T.border}`, color: T.text, padding: '10px 14px', outline: 'none', boxSizing: 'border-box', width: '100%' };
const lbl: React.CSSProperties = { fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.12em', marginBottom: 6, display: 'block' };

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

/* ══════════════════════════════════════════════════════════ PAGE ══ */
export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [dossier,   setDossier]   = useState<Dossier | null>(null);
  const [docs,      setDocs]      = useState<Document[]>([]);
  const [factures,  setFactures]  = useState<Facture[]>([]);
  const [hydrated,  setHydrated]  = useState(false);

  /* Nouveau doc */
  const [docPanelOpen, setDocPanelOpen] = useState(false);
  const [editingDoc,   setEditingDoc]   = useState<Document | null>(null);
  const [docType,      setDocType]      = useState<DocType>('Synthèse de consultation');
  const [docTitre,     setDocTitre]     = useState('');
  const [docContenu,   setDocContenu]   = useState('');
  const [docDate,      setDocDate]      = useState('');
  const [delDocConfirm, setDelDocConfirm] = useState<string | null>(null);
  const [docSaving,    setDocSaving]    = useState(false);
  const [docError,     setDocError]     = useState('');
  const [docsLoading,  setDocsLoading]  = useState(true);
  const [docsError,    setDocsError]    = useState('');
  const [expandedDoc,  setExpandedDoc]   = useState<string | null>(null);
  const [certDoc,      setCertDoc]       = useState<Document | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const printRef    = useRef<HTMLDivElement>(null);

  /* Onglet actif */
  const [tab, setTab] = useState<'dossier' | 'documents' | 'facturation'>('dossier');

  useEffect(() => {
    if (!id) return;
    // Charge le dossier depuis Supabase via l'API
    fetch(`/api/cabinet/dossiers?id=${encodeURIComponent(id)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.dossier) { setHydrated(true); return; }
        const row = data.dossier;
        const d: Dossier = {
          id:                    String(row.id ?? ''),
          patientNom:            String(row.patient_nom            ?? ''),
          patientPrenom:         String(row.patient_prenom         ?? ''),
          patientAge:            String(row.patient_age            ?? ''),
          patientMetier:         String(row.patient_metier         ?? ''),
          dateConsult:           String(row.date_consult           ?? ''),
          type:                  String(row.type_seance            ?? 'Première consultation'),
          plainte:               String(row.plainte                ?? ''),
          antecedentsPersonnels: String(row.antecedents_personnels ?? ''),
          antecedentsFamiliaux:  String(row.antecedents_familiaux  ?? ''),
          evenementsRecents:     String(row.evenements_recents     ?? ''),
          equilibreNerveux:      (row.equilibre_nerveux            ?? '') as Equilibre,
          noteThérapeute:        String(row.note_therapeute        ?? ''),
          traitement:            String(row.traitement             ?? ''),
          prochaine:             String(row.prochaine              ?? ''),
          statut:                (row.statut                       ?? 'EN COURS') as Statut,
          confidentiel:          Boolean(row.confidentiel),
          createdAt:             String(row.created_at             ?? ''),
        };
        setDossier(d);

        // Charge les documents depuis Supabase
        setDocsLoading(true);
        setDocsError('');
        fetch(`/api/cabinet/documents?patient_id=${encodeURIComponent(String(row.id))}`)
          .then(async r => {
            if (!r.ok) {
              let msg = `Erreur ${r.status}`;
              try { const e = await r.json(); msg = e.error ?? msg; } catch {}
              throw new Error(msg);
            }
            return r.json();
          })
          .then(dd => {
            const mapped: Document[] = (dd.documents ?? []).map((x: any) => ({
              id: String(x.id), patientId: String(x.patient_id),
              type: x.type, titre: x.titre, contenu: x.contenu,
              date: x.date, createdAt: x.created_at,
            }));
            setDocs(mapped);
            setDocsLoading(false);
          })
          .catch(err => {
            setDocsError(err.message ?? 'Impossible de charger les documents.');
            setDocsLoading(false);
          });

        const fullName = [d.patientPrenom, d.patientNom].filter(Boolean).join(' ').toLowerCase();
        const nomSeul  = d.patientNom.toLowerCase();
        const all = loadAllFactures().filter(f => {
          const fn = f.patientNom.toLowerCase();
          return fn === fullName || fn === nomSeul || fullName.includes(fn) || fn.includes(nomSeul);
        });
        all.sort((a, b) => parseDateTs(b.dateSeance) - parseDateTs(a.dateSeance));
        setFactures(all);
        setHydrated(true);
      })
      .catch(() => setHydrated(true));
  }, [id]);

  function openNewDoc() {
    const defaultType: DocType = 'Synthèse de consultation';
    setEditingDoc(null);
    setDocType(defaultType);
    setDocTitre('');
    setDocContenu(TEMPLATES[defaultType] ?? '');
    setDocDate((() => { const n = new Date(); const s = n.toLocaleDateString('fr-FR').split('/'); s[2] = String(Number(s[2])-136); return s.join('/'); })());
    setDocPanelOpen(true);
  }

  function handleDocTypeChange(newType: DocType) {
    setDocType(newType);
    // Auto-remplir le template si le contenu est vide ou était un template précédent
    const prevTemplate = TEMPLATES[docType] ?? '';
    if (!docContenu.trim() || docContenu === prevTemplate) {
      setDocContenu(TEMPLATES[newType] ?? '');
    }
  }
  function openEditDoc(doc: Document) {
    setEditingDoc(doc);
    setDocType(doc.type);
    setDocTitre(doc.titre);
    setDocContenu(doc.contenu);
    setDocDate(doc.date);
    setDocPanelOpen(true);
  }
  async function submitDoc() {
    if (!docTitre.trim() || !dossier) return;
    setDocSaving(true);
    setDocError('');
    try {
      if (editingDoc) {
        const r = await fetch('/api/cabinet/documents', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingDoc.id, type: docType, titre: docTitre, contenu: docContenu, date: docDate }),
        });
        if (!r.ok) { let m = `Erreur ${r.status}`; try { const e = await r.json(); m = e.error ?? m; } catch {} throw new Error(m); }
        setDocs(prev => prev.map(d => d.id === editingDoc.id ? { ...d, type: docType, titre: docTitre, contenu: docContenu, date: docDate } : d));
        setDocPanelOpen(false);
      } else {
        const newId = uid();
        const r = await fetch('/api/cabinet/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: newId, patient_id: dossier.id, type: docType, titre: docTitre, contenu: docContenu, date: docDate }),
        });
        if (!r.ok) { let m = `Erreur ${r.status}`; try { const e = await r.json(); m = e.error ?? m; } catch {} throw new Error(m); }
        const saved = await r.json();
        const newDoc: Document = {
          id: saved?.document?.id ? String(saved.document.id) : newId,
          patientId: dossier.id, type: docType, titre: docTitre,
          contenu: docContenu, date: docDate,
          createdAt: saved?.document?.created_at ?? new Date().toISOString(),
        };
        setDocs(prev => [newDoc, ...prev]);
        setDocPanelOpen(false);
      }
    } catch (err: any) {
      setDocError(err.message ?? 'Impossible de sauvegarder le document.');
    } finally {
      setDocSaving(false);
    }
  }

  async function deleteDoc(docId: string) {
    await fetch('/api/cabinet/documents', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: docId }),
    });
    setDocs(p => p.filter(d => d.id !== docId));
    setDelDocConfirm(null);
  }

  /* ── Formatage gras / italique ── */
  function applyFormat(marker: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const before   = docContenu.slice(0, start);
    const selected = docContenu.slice(start, end);
    const after    = docContenu.slice(end);
    const newText  = before + marker + selected + marker + after;
    setDocContenu(newText);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + marker.length, end + marker.length);
    }, 0);
  }

  /* ── Rendu markdown inline (gras / italique) ── */
  function renderContent(text: string) {
    return text.split('\n').map((line, li) => (
      <span key={li}>
        {li > 0 && <br />}
        {line.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/).map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**'))
            return <strong key={i} style={{ fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
          if (part.startsWith('*') && part.endsWith('*'))
            return <em key={i}>{part.slice(1, -1)}</em>;
          return part;
        })}
      </span>
    ));
  }

  if (!hydrated) return null;

  /* ── Enregistrer en PNG format A4 ── */
  async function saveAsPng() {
    const el = printRef.current;
    if (!el || !certDoc) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(el, { backgroundColor: '#183746', scale: 2, useCORS: true, allowTaint: true, logging: false });
      const link = document.createElement('a');
      link.download = `${certDoc.titre}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) { console.error('PNG export:', e); }
  }

  /* ══ VUE CERTIFICAT DOCUMENT ══ */
  if (certDoc && dossier) return (
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
        <button onClick={() => setCertDoc(null)} style={{ fontFamily: MONO, fontSize: 14, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '9px 20px', cursor: 'pointer', letterSpacing: '0.1em' }}>← RETOUR</button>
        <button onClick={() => window.print()} style={{ fontFamily: MONO, fontSize: 14, background: 'rgba(107,122,187,0.22)', border: '1px solid rgba(107,122,187,0.55)', color: '#8899CC', padding: '9px 22px', cursor: 'pointer', letterSpacing: '0.1em' }}>🖨 IMPRIMER</button>
        <button onClick={saveAsPng} style={{ fontFamily: MONO, fontSize: 14, background: 'rgba(122,154,106,0.18)', border: '1px solid rgba(122,154,106,0.5)', color: '#526C45', padding: '9px 22px', cursor: 'pointer', letterSpacing: '0.1em' }}>💾 ENREGISTRER PNG</button>
      </div>

      {/* Certificat */}
      <div ref={printRef} className="print-area" style={{ background: '#183746', border: '2px solid #C8BEA5', padding: '52px 60px', width: 794, maxWidth: 794, margin: '0 auto', color: '#102B3B', fontFamily: "'Libre Baskerville', 'Courier New', monospace" }}>

        {/* En-tête */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 20, letterSpacing: '0.12em', marginBottom: 4, fontWeight: 'bold' }}>CABINET THÉRAPEUTIQUE PSYCHIQUE</div>
          <div style={{ fontSize: 15, color: '#4A3018', marginBottom: 4 }}>Little Creek — Blackwater</div>
          <div style={{ fontSize: 14, color: '#6A5030', lineHeight: 1.7 }}>
            Sous la direction du Docteur François De Millet<br />
            Médecin – Thérapeute, formé aux doctrines modernes de la médecine mentale et des sciences morales
          </div>
        </div>

        {/* Titre */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 17, letterSpacing: '0.1em', textDecoration: 'underline', textUnderlineOffset: 6, fontWeight: 'bold' }}>
            {certDoc.titre.toUpperCase()}
          </div>
          <div style={{ fontSize: 14, color: '#6A5030', marginTop: 6, letterSpacing: '0.1em' }}>{certDoc.type}</div>
        </div>

        {/* Corps */}
        <div style={{ fontSize: 15, lineHeight: 2 }}>
          <p style={{ margin: '0 0 16px' }}>Je soussigné, <strong>Docteur François De Millet</strong>, médecin – thérapeute exerçant au sein du L'ORDRES DES MÉDECINS - Hôpital de Little Creek - Dispensaire de Valentine, certifie avoir procédé, en date du <strong>{rpDisplay(certDoc.date)}</strong>, à la rédaction du présent document concernant :</p>
          <p style={{ paddingLeft: 28, margin: '0 0 16px' }}>
            <strong>Nom et Prénom :</strong> {dossier.patientPrenom} {dossier.patientNom}<br />
            {dossier.patientAge ? <><strong>Âge :</strong> {dossier.patientAge} ans<br /></> : null}
            {dossier.patientMetier ? <><strong>Profession :</strong> {dossier.patientMetier}<br /></> : null}
            <strong>Type de suivi :</strong> {dossier.type}
          </p>

          <p style={{ margin: '24px 0 8px', fontWeight: 'bold', textDecoration: 'underline', textUnderlineOffset: 4 }}>OBJET DU DOCUMENT</p>
          <p style={{ margin: '0 0 16px' }}>{certDoc.type}</p>

          <p style={{ margin: '24px 0 8px', fontWeight: 'bold', textDecoration: 'underline', textUnderlineOffset: 4 }}>CONTENU</p>
          <div style={{ margin: '0 0 32px', whiteSpace: 'pre-wrap', lineHeight: 2.1 }}>{certDoc.contenu}</div>

          {/* Signature */}
          <div style={{ marginTop: 52 }}>
            <div style={{ fontSize: 14, color: '#6A5030', lineHeight: 2 }}>
              Fait à <strong>Little Creek</strong>, le <strong>{rpDisplay(certDoc.date)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  if (!dossier) return (
    <div style={{ fontFamily: BODY, textAlign: 'center', padding: 60 }}>
      <div style={{ fontFamily: MONO, fontSize: 15, color: T.dim }}>Dossier introuvable</div>
      <button onClick={() => router.push('/redm/cabinet/patients')} style={{ marginTop: 20, fontFamily: MONO, fontSize: 15, padding: '10px 22px', cursor: 'pointer', background: 'transparent', color: T.muted, border: `1px solid ${T.border}` }}>← RETOUR</button>
    </div>
  );

  const col = STATUT_COL[dossier.statut];
  const eq  = dossier.equilibreNerveux ? EQ_INFO[dossier.equilibreNerveux] : null;

  return (
    <div style={{ fontFamily: BODY }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap'); @keyframes slide-in{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <button onClick={() => router.push('/redm/cabinet/patients')}
            style={{ fontFamily: MONO, fontSize: 15, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '9px 20px', cursor: 'pointer', letterSpacing: '0.1em' }}>
            ← RETOUR
          </button>
          <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold, letterSpacing: '0.16em' }}>CABINET · DOSSIERS · {(dossier.patientPrenom + ' ' + dossier.patientNom).toUpperCase()}</span>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `5px solid ${col}`, padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
          {/* Avatar initiales */}
          <div style={{ width: 70, height: 70, background: col + '20', border: `2px solid ${col}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISPLAY, fontSize: 30, color: col, flexShrink: 0 }}>
            {(dossier.patientPrenom[0] ?? '?')}{(dossier.patientNom[0] ?? '')}
          </div>
          {/* Infos principales */}
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
              {eq && <span style={{ fontFamily: MONO, fontSize: 14, color: eq.col, background: eq.col + '18', padding: '3px 10px' }}>Degré {dossier.equilibreNerveux}</span>}
            </div>
          </div>
          {/* Compteur docs */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 35, color: T.gold }}>{docs.length}</div>
            <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.1em' }}>DOCUMENT{docs.length !== 1 ? 'S' : ''}</div>
          </div>
        </div>
      </div>

      {/* ── Onglets ── */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 22, borderBottom: `1px solid ${T.border}` }}>
        {([
          ['dossier',     '📋 DOSSIER',     T.gold,    null],
          ['documents',   '📄 DOCUMENTS',   T.gold,    docs.length],
          ['facturation', '💰 FACTURATION', '#D1B77C', factures.length],
        ] as const).map(([key, label, col, cnt]) => {
          const on = tab === key;
          return (
            <button key={key} onClick={() => setTab(key)}
              style={{ fontFamily: MONO, fontSize: 15, letterSpacing: '0.12em', padding: '12px 28px', cursor: 'pointer', background: on ? `${col}12` : 'transparent', color: on ? col : T.dim, border: 'none', borderBottom: `3px solid ${on ? col : 'transparent'}`, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 7 }}>
              {label}
              {cnt !== null && cnt > 0 && <span style={{ fontFamily: MONO, fontSize: 14, color: col, background: `${col}22`, padding: '1px 6px' }}>{cnt}</span>}
            </button>
          );
        })}
      </div>

      {/* ══ ONGLET DOSSIER ══ */}
      {tab === 'dossier' && (
        <div>
          {dossier.plainte && <Block icon="🗣" title="PLAINTE / MOTIF" color={T.gold}><InfoLine label="" value={dossier.plainte} /></Block>}

          {(dossier.antecedentsPersonnels || dossier.antecedentsFamiliaux || dossier.evenementsRecents) && (
            <Block icon="📜" title="INFORMATIONS" color="#786030">
              <InfoLine label="ANTÉCÉDENTS PERSONNELS"  value={dossier.antecedentsPersonnels} />
              <InfoLine label="ANTÉCÉDENTS FAMILIAUX"   value={dossier.antecedentsFamiliaux} />
              <InfoLine label="ÉVÉNEMENTS RÉCENTS"      value={dossier.evenementsRecents} />
            </Block>
          )}

          {eq && (
            <Block icon="⚖" title="ÉTAT DE L'ÉQUILIBRE NERVEUX" color={eq.col}>
              <div style={{ fontFamily: DISPLAY, fontSize: 22, color: eq.col, marginBottom: 6 }}>{eq.label}</div>
              <div style={{ fontFamily: BODY, fontSize: 17, color: T.muted, fontStyle: 'italic', lineHeight: 1.6 }}>{eq.desc}</div>
            </Block>
          )}

          {dossier.noteThérapeute && <Block icon="✍" title="NOTE DU THÉRAPEUTE" color="#6B4A78"><InfoLine label="" value={dossier.noteThérapeute} /></Block>}

          {(dossier.traitement || dossier.prochaine) && (
            <Block icon="💊" title="TRAITEMENT & RECOMMANDATIONS" color="#A8B991">
              <InfoLine label="PRESCRIPTIONS / CONSEILS" value={dossier.traitement} />
              <InfoLine label="PROCHAINE SÉANCE"          value={dossier.prochaine} />
            </Block>
          )}
        </div>
      )}

      {/* ══ ONGLET DOCUMENTS ══ */}
      {tab === 'documents' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button onClick={openNewDoc}
              style={{ fontFamily: MONO, fontSize: 15, letterSpacing: '0.12em', padding: '10px 24px', cursor: 'pointer', background: 'rgba(209,183,124,0.15)', color: T.gold, border: `1px solid rgba(209,183,124,0.45)` }}>
              ✚ CRÉER UN DOCUMENT
            </button>
          </div>

          {docsError && (
            <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(200,80,80,0.10)', border: '1px solid rgba(200,80,80,0.35)', color: '#DF9A88', fontFamily: MONO, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>⚠ Erreur chargement documents : {docsError}</span>
              <button onClick={() => {
                setDocsError('');
                setDocsLoading(true);
                fetch(`/api/cabinet/documents?patient_id=${encodeURIComponent(dossier.id)}`)
                  .then(async r => {
                    if (!r.ok) { let m = `Erreur ${r.status}`; try { const e = await r.json(); m = e.error ?? m; } catch {} throw new Error(m); }
                    return r.json();
                  })
                  .then(dd => { setDocs((dd.documents ?? []).map((x: any) => ({ id: String(x.id), patientId: String(x.patient_id), type: x.type, titre: x.titre, contenu: x.contenu, date: x.date, createdAt: x.created_at }))); setDocsLoading(false); })
                  .catch(err => { setDocsError(err.message); setDocsLoading(false); });
              }} style={{ fontFamily: MONO, fontSize: 14, padding: '3px 10px', cursor: 'pointer', background: 'rgba(200,80,80,0.15)', color: '#DF9A88', border: '1px solid rgba(200,80,80,0.4)' }}>
                ↺ Réessayer
              </button>
            </div>
          )}

          {docsLoading ? (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '32px 20px', textAlign: 'center', fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.10em' }}>
              Chargement des documents…
            </div>
          ) : docs.length === 0 && !docsError ? (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '48px 20px', textAlign: 'center', fontFamily: MONO, fontSize: 15, color: T.dim, letterSpacing: '0.12em' }}>
              Aucun document — créez le premier document de ce dossier
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...docs].sort((a, b) => parseDateTs(b.date) - parseDateTs(a.date)).map((doc, idx) => {
                const isOpen = expandedDoc === doc.id;
                return (
                  <div key={doc.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `3px solid ${isOpen ? T.gold : T.border}`, overflow: 'hidden', transition: 'border-color 0.15s' }}>
                    {/* En-tête cliquable */}
                    <div onClick={() => setExpandedDoc(isOpen ? null : doc.id)}
                      style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#254B5C')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div style={{ width: 36, height: 36, background: isOpen ? 'rgba(209,183,124,0.18)' : 'rgba(209,183,124,0.08)', border: `1px solid rgba(200,168,80,${isOpen ? '0.5' : '0.2'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 16, color: T.gold, flexShrink: 0, transition: 'all 0.15s' }}>
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: DISPLAY, fontSize: 20, color: T.text }}>{doc.titre}</div>
                        <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, marginTop: 2 }}>{doc.date}{doc.contenu ? ` · ${doc.contenu.length} caractères` : ''}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setCertDoc(doc)}
                          style={{ fontFamily: MONO, fontSize: 14, padding: '5px 10px', cursor: 'pointer', background: 'rgba(107,122,187,0.12)', color: '#8899CC', border: `1px solid rgba(107,122,187,0.35)` }}>📄</button>
                        <button onClick={() => openEditDoc(doc)}
                          style={{ fontFamily: MONO, fontSize: 14, padding: '5px 10px', cursor: 'pointer', background: 'rgba(209,183,124,0.10)', color: T.gold, border: `1px solid rgba(209,183,124,0.3)` }}>✎</button>
                        {delDocConfirm === doc.id
                          ? <><button onClick={() => deleteDoc(doc.id)} style={{ fontFamily: MONO, fontSize: 14, padding: '5px 8px', cursor: 'pointer', background: '#8B404025', color: '#DF9A88', border: '1px solid #8B404060' }}>OK?</button>
                              <button onClick={() => setDelDocConfirm(null)} style={{ fontFamily: MONO, fontSize: 14, padding: '5px 6px', cursor: 'pointer', background: 'transparent', color: T.dim, border: `1px solid ${T.border}` }}>✕</button></>
                          : <button onClick={() => setDelDocConfirm(doc.id)} style={{ fontFamily: MONO, fontSize: 14, padding: '5px 8px', cursor: 'pointer', background: 'transparent', color: '#8B6060', border: '1px solid rgba(139,64,64,0.3)' }}>✕</button>}
                      </div>
                      <span style={{ fontFamily: MONO, fontSize: 16, color: T.dim, marginLeft: 4 }}>{isOpen ? '▲' : '▼'}</span>
                    </div>
                    {/* Contenu — visible seulement si ouvert */}
                    {isOpen && doc.contenu && (
                      <div style={{ borderTop: `1px solid ${T.border}`, padding: '18px 24px 20px', fontFamily: BODY, fontSize: 17, color: T.text, lineHeight: 1.9 }}>
                        {renderContent(doc.contenu)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ ONGLET FACTURATION ══ */}
      {tab === 'facturation' && (() => {
        const totalPercu   = factures.filter(f => f.statut === 'PAYÉ').reduce((s, f) => s + f.montant, 0);
        const totalAttente = factures.filter(f => f.statut === 'EN ATTENTE').reduce((s, f) => s + f.montant, 0);
        const totalBrut    = factures.reduce((s, f) => s + f.montant, 0);

        return (
          <div>
            {/* Stats résumé */}
            {factures.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
                {[
                  { l: 'TOTAL SOINS',   v: fmt$(totalBrut),    c: T.gold    },
                  { l: 'TOTAL PERÇU',   v: fmt$(totalPercu),   c: '#A8B991' },
                  { l: 'EN ATTENTE',    v: fmt$(totalAttente), c: '#D1B77C' },
                ].map(s => (
                  <div key={s.l} style={{ background: T.card, border: `1px solid ${T.border}`, padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ fontFamily: DISPLAY, fontSize: 22, color: s.c }}>{s.v}</div>
                    <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, marginTop: 3, letterSpacing: '0.1em' }}>{s.l}</div>
                  </div>
                ))}
              </div>
            )}

            {factures.length === 0 ? (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '48px 20px', textAlign: 'center' }}>
                <div style={{ fontFamily: MONO, fontSize: 15, color: T.dim, letterSpacing: '0.12em', marginBottom: 10 }}>
                  Aucune facturation enregistrée pour ce patient
                </div>
                <div style={{ fontFamily: BODY, fontSize: 14, color: T.dim, fontStyle: 'italic' }}>
                  Les factures apparaîtront ici dès qu'une ligne sera créée dans Comptabilité avec ce nom
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {factures.map(f => {
                  const col  = PAI_COL[f.statut];
                  const pres = f.prestations ?? ['Consultation' as TypePrestation];
                  return (
                    <div key={f.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `4px solid ${col}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px' }}>
                        {/* Date */}
                        <div style={{ textAlign: 'center', minWidth: 50, flexShrink: 0 }}>
                          <div style={{ fontFamily: DISPLAY, fontSize: 17, color: T.gold }}>{rpDisplay(f.dateSeance).slice(0,5)}</div>
                          <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim }}>{rpDisplay(f.dateSeance).slice(6)}</div>
                        </div>
                        {/* Prestations + payeur */}
                        <div style={{ flex: 1, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                          {pres.map((p, i) => (
                            <span key={i} style={{ fontFamily: MONO, fontSize: 14, color: T.gold, background: 'rgba(209,183,124,0.10)', padding: '2px 8px', border: '1px solid rgba(209,183,124,0.20)' }}>
                              {p} <span style={{ color: T.muted }}>{fmt$(TARIFS[p] ?? 0)}</span>
                            </span>
                          ))}
                          <span style={{ fontFamily: MONO, fontSize: 14, color: '#88AAC0', background: 'rgba(72,104,120,0.18)', padding: '2px 7px' }}>{f.payeur}</span>
                          {f.notes && <span style={{ fontFamily: BODY, fontSize: 14, color: T.muted, fontStyle: 'italic' }}>{f.notes}</span>}
                        </div>
                        {/* Montant */}
                        <div style={{ fontFamily: DISPLAY, fontSize: 22, color: col, flexShrink: 0, minWidth: 70, textAlign: 'right' }}>
                          {fmt$(f.montant)}
                        </div>
                        {/* Statut */}
                        <div style={{ fontFamily: MONO, fontSize: 14, color: col, background: `${col}18`, padding: '5px 10px', border: `1px solid ${col}50`, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                          {PAI_ICON[f.statut]} {f.statut}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: 14, fontFamily: MONO, fontSize: 14, color: T.dim, textAlign: 'center', borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
              Factures associées par correspondance de nom · Gestion complète dans{' '}
              <span onClick={() => router.push('/redm/comptabilite')} style={{ color: T.gold, cursor: 'pointer', textDecoration: 'underline' }}>Comptabilité</span>
            </div>
          </div>
        );
      })()}

      {/* ══ PANNEAU DOCUMENT ══ */}
      {docPanelOpen && (
        <>
          <div onClick={() => setDocPanelOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 40 }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 600, background: T.bg, borderLeft: `2px solid ${T.gold}`, zIndex: 50, display: 'flex', flexDirection: 'column', animation: 'slide-in 0.25s ease' }}>
            {/* En-tête panneau */}
            <div style={{ padding: '24px 28px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 24, color: T.gold }}>{editingDoc ? '✎ Modifier le document' : '✚ Nouveau document'}</div>
              <button onClick={() => setDocPanelOpen(false)} style={{ background: 'transparent', border: 'none', color: T.muted, fontSize: 26, cursor: 'pointer' }}>✕</button>
            </div>

            {/* Corps scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '22px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Type de document */}
              {!editingDoc && (
                <div>
                  <label style={lbl}>TYPE DE DOCUMENT</label>
                  <select style={{ ...inp, cursor: 'pointer' }}
                    value={docType}
                    onChange={e => handleDocTypeChange(e.target.value as DocType)}>
                    {DOC_TYPES.map(t => (
                      <option key={t} value={t}>{DOC_ICONS[t]} {t}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Titre + Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
                <div>
                  <label style={lbl}>TITRE DU DOCUMENT *</label>
                  <input style={{ ...inp, fontSize: 18, padding: '12px 16px' }}
                    value={docTitre} onChange={e => setDocTitre(e.target.value)}
                    placeholder="Intitulé du document…" />
                </div>
                <div>
                  <label style={lbl}>DATE (RP)</label>
                  <input style={{ ...inp, width: 140, textAlign: 'center' }}
                    value={docDate} onChange={e => setDocDate(e.target.value)}
                    placeholder="JJ/MM/AAAA" />
                </div>
              </div>

              {/* Contenu libre */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={lbl}>CONTENU DE LA SÉANCE</label>
                {/* Barre de formatage */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                  {[
                    { label: 'B', marker: '**', title: 'Gras', style: { fontWeight: 700 } as React.CSSProperties },
                    { label: 'I', marker: '*',  title: 'Italique', style: { fontStyle: 'italic' } as React.CSSProperties },
                  ].map(({ label, marker, title, style }) => (
                    <button key={label} type="button" title={title}
                      onMouseDown={e => { e.preventDefault(); applyFormat(marker); }}
                      style={{ fontFamily: BODY, fontSize: 18, ...style, padding: '4px 12px', cursor: 'pointer', background: 'rgba(209,183,124,0.08)', color: T.gold, border: `1px solid rgba(209,183,124,0.3)`, letterSpacing: 0 }}>
                      {label}
                    </button>
                  ))}
                  <span style={{ fontFamily: MONO, fontSize: 14, color: T.dim, alignSelf: 'center', marginLeft: 6 }}>Sélectionner du texte puis cliquer</span>
                </div>
                <textarea
                  ref={textareaRef}
                  style={{ ...inp, flex: 1, resize: 'none', minHeight: 'calc(100vh - 320px)', lineHeight: 1.85, fontSize: 17, padding: '16px' }}
                  value={docContenu}
                  onChange={e => setDocContenu(e.target.value)}
                  placeholder="Rédigez le compte rendu de la séance ici… Pas de limite de mots." />
              </div>
            </div>

            {/* Pied fixe — bouton enregistrer */}
            <div style={{ padding: '16px 28px 24px', borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
              {docError && (
                <div style={{ marginBottom: 10, padding: '8px 14px', background: 'rgba(200,80,80,0.12)', border: '1px solid rgba(200,80,80,0.35)', color: '#DF9A88', fontFamily: MONO, fontSize: 14 }}>
                  ⚠ {docError}
                </div>
              )}
              <button onClick={submitDoc} disabled={!docTitre.trim() || docSaving}
                style={{ width: '100%', fontFamily: MONO, fontSize: 16, letterSpacing: '0.14em', padding: '14px', cursor: docTitre.trim() && !docSaving ? 'pointer' : 'not-allowed', background: docTitre.trim() ? 'rgba(209,183,124,0.20)' : 'rgba(255,255,255,0.04)', color: docTitre.trim() ? T.gold : T.dim, border: `2px solid ${docTitre.trim() ? 'rgba(209,183,124,0.55)' : 'rgba(255,255,255,0.06)'}` }}>
                {docSaving ? '⟳ ENREGISTREMENT...' : editingDoc ? '✔ ENREGISTRER LES MODIFICATIONS' : '✔ ENREGISTRER LE DOCUMENT'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
