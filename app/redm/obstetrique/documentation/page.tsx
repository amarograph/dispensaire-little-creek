'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

const DISPLAY = "'Central Station', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";
const BODY    = "'Cormorant Garamond', 'Georgia', serif";
const T = { bg: '#102B3B', card: '#183746', border: 'rgba(139,90,43,0.30)', gold: '#D1B77C', text: '#EADCB9', muted: '#C8BEA5', dim: '#C8BEA5' };

type DocCreationType = 'Suivi de grossesse' | 'Prescription médicale' | "Compte-rendu d'accouchement";
const COL_SUIVI = '#526C45';
const COL_RX    = '#A0784A';
const COL_ACC   = '#6B7ABB';

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

interface Patiente {
  id: string; patientNom: string; patientPrenom: string; patientAge: string;
  type: string; statut: string;
}
interface DocResult {
  id: string; patientId: string; type: DocCreationType | string;
  titre: string; contenu: string; date: string; createdAt: string;
}

const TEMPLATE_SUIVI = `SUIVI DE GROSSESSE
DISPENSAIRE DE LITTLE CREEK — OBSTÉTRIQUE
Année 1890

IDENTITÉ DE LA PATIENTE
Nom et prénom : [Nom de la patiente]
Âge : [Âge]

TERME DE LA GROSSESSE
Semaines de grossesse : [Nombre de semaines]
Date présumée de l'accouchement : [Date]

EXAMEN DU JOUR
État général :
[Tenue, posture, mine générale]
Poids et évolution :
[Observation]
Mouvements de l'enfant :
[Perçus / non perçus, fréquence]

SIGNES OBSERVÉS
• [Signe]
• [Signe]
• [Signe]

COMPLICATIONS ÉVENTUELLES
[Saignements, douleurs, œdèmes, autre — ou "néant"]

RECOMMANDATIONS
[Repos, alimentation, activité]
[Prochaine visite recommandée]

CONCLUSION
[État général de la grossesse — favorable / à surveiller / préoccupant]`;

const TEMPLATE_RX = `Prescription Médicale
Obstétrique — Dispensaire de Little Creek

Patiente
Nom et prénom : [Nom de la patiente]

──────────────────────────────────────

[Nom du remède] – usage [de jour / nocturne]

À consommer en cas de :
[Symptômes / indication précise], afin de :
[Effet recherché].

Composition :
• [Plante]
• [Plante]
• [Plante]

──────────────────────────────────────

Consignes complémentaires

Repos recommandé durant :
[Durée]

Éviter :
[Alcool / efforts / autre]

Noter tout épisode d'aggravation :
• [Symptôme]
• [Symptôme]

──────────────────────────────────────

Suivi

Une nouvelle consultation est requise dans [durée],
ou immédiatement en cas de :
[Aggravation / symptôme critique]`;

const TEMPLATE_ACCOUCHEMENT = `COMPTE-RENDU D'ACCOUCHEMENT
DISPENSAIRE DE LITTLE CREEK — OBSTÉTRIQUE
Année 1890

IDENTITÉ DE LA PATIENTE
Nom et prénom : [Nom de la patiente]
Âge : [Âge]

DÉROULEMENT DE L'ACCOUCHEMENT
Date et heure : [Date] à [Heure]
Lieu : [Dispensaire / domicile]
Durée du travail : [Durée]
Présentation : [Céphalique / siège / autre]

ISSUE
Enfant : [Vivant / mort-né], [Sexe]
État de l'enfant à la naissance :
[Observations]
État de la mère :
[Observations]

COMPLICATIONS
[Hémorragie, déchirure, autre — ou "néant"]

SOINS PRODIGUÉS
[Soins apportés à la mère et à l'enfant]

RECOMMANDATIONS POST-NATALES
[Repos, alimentation, surveillance]
[Prochaine visite recommandée]

CONCLUSION
[État général à l'issue de l'accouchement]`;

const TEMPLATES: Record<DocCreationType, string> = {
  'Suivi de grossesse': TEMPLATE_SUIVI,
  'Prescription médicale': TEMPLATE_RX,
  "Compte-rendu d'accouchement": TEMPLATE_ACCOUCHEMENT,
};

export default function ObstetriqueDocumentationPage() {
  const router  = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const [hydrated,   setHydrated]   = useState(false);
  const [hover,      setHover]      = useState<string | null>(null);

  const [patientes,  setPatientes]  = useState<Patiente[]>([]);
  const [allDocs,    setAllDocs]    = useState<DocResult[]>([]);

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

  const [certDoc,    setCertDoc]    = useState<DocResult | null>(null);
  const [certPat,    setCertPat]    = useState<Patiente | null>(null);

  const [delDoc,     setDelDoc]     = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/obstetrique/dossiers')
      .then(r => r.ok ? r.json() : { dossiers: [] })
      .then(data => { setPatientes(data.dossiers ?? []); })
      .catch(() => {});
    fetch('/api/obstetrique/documents')
      .then(r => r.ok ? r.json() : { documents: [] })
      .then(data => { setAllDocs(data.documents ?? []); })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  const suivis        = allDocs.filter(d => d.type === 'Suivi de grossesse');
  const prescriptions = allDocs.filter(d => d.type === 'Prescription médicale');
  const accouchements = allDocs.filter(d => d.type === "Compte-rendu d'accouchement");
  const patienteById  = (id: string) => patientes.find(p => p.id === id) ?? null;
  const filteredPats  = patientes.filter(p =>
    `${p.patientPrenom} ${p.patientNom}`.toLowerCase().includes(patSearch.toLowerCase())
  );

  function openCreate(type: DocCreationType) {
    setCreateType(type);
    setUseExisting(true);
    setSelectedPat(patientes[0]?.id ?? '');
    setNewNom(''); setNewPrenom(''); setNewAge('');
    setCreateTitre('');
    setCreateDate(rpDate());
    setCreateContenu(TEMPLATES[type]);
    setPatSearch('');
  }

  async function submitCreate() {
    if (!createType) return;
    try {
      let patientId = '';

      if (useExisting) {
        if (!selectedPat) return;
        patientId = selectedPat;
      } else {
        if (!newNom.trim()) return;
        const r = await fetch('/api/obstetrique/dossiers', {
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
        const newPat: Patiente = d.dossier;
        setPatientes(prev => [newPat, ...prev]);
        patientId = newPat.id;
      }

      const r = await fetch('/api/obstetrique/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          type:       createType,
          titre:      createTitre.trim() || createType,
          contenu:    createContenu,
          date:       createDate,
        }),
      });
      if (!r.ok) return;
      const saved = await r.json();
      setAllDocs(prev => [saved.document, ...prev]);
      setCreateType(null);
    } catch {}
  }

  async function deleteDoc(id: string) {
    await fetch('/api/obstetrique/documents', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setAllDocs(prev => prev.filter(d => d.id !== id));
    setDelDoc(null);
  }

  function openCert(doc: DocResult) {
    setCertDoc(doc);
    setCertPat(patienteById(doc.patientId));
  }

  const inp: React.CSSProperties = { fontFamily: MONO, fontSize: 15, background: 'rgba(0,0,0,0.28)', border: `1px solid ${T.border}`, color: T.text, padding: '10px 14px', outline: 'none', boxSizing: 'border-box', width: '100%' };
  const lbl: React.CSSProperties = { fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.12em', marginBottom: 6, display: 'block' };

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
      <div ref={printRef} className="print-area" style={{ background: '#183746', border: '2px solid #C8BEA5', padding: '52px 60px', maxWidth: 800, margin: '0 auto', color: '#102B3B', fontFamily: "'Libre Baskerville', 'Courier New', monospace" }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 20, letterSpacing: '0.12em', marginBottom: 4, fontWeight: 'bold' }}>DISPENSAIRE DE LITTLE CREEK — OBSTÉTRIQUE</div>
          <div style={{ fontSize: 15, color: '#4A3018', marginBottom: 4 }}>Little Creek — West Elizabeth</div>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 17, letterSpacing: '0.1em', textDecoration: 'underline', textUnderlineOffset: 6, fontWeight: 'bold' }}>
            {certDoc.titre.toUpperCase()}
          </div>
          <div style={{ fontSize: 14, color: '#6A5030', marginTop: 6, letterSpacing: '0.1em' }}>{certDoc.type}</div>
        </div>
        <div style={{ fontSize: 15, lineHeight: 2 }}>
          <p style={{ margin: '0 0 16px' }}>Document rédigé le <strong>{rpDisplay(certDoc.date)}</strong>, concernant :</p>
          <p style={{ paddingLeft: 28, margin: '0 0 16px' }}>
            <strong>Nom et Prénom :</strong> {certPat ? `${certPat.patientPrenom} ${certPat.patientNom}` : '—'}<br />
            {certPat?.patientAge ? <><strong>Âge :</strong> {certPat.patientAge} ans<br /></> : null}
          </p>
          <p style={{ margin: '24px 0 8px', fontWeight: 'bold', textDecoration: 'underline', textUnderlineOffset: 4 }}>CONTENU</p>
          <div style={{ margin: '0 0 32px', whiteSpace: 'pre-wrap', lineHeight: 2.1 }}>{certDoc.contenu}</div>
          <div style={{ marginTop: 52 }}>
            <div style={{ fontSize: 14, color: '#6A5030', lineHeight: 2 }}>
              Fait à <strong>Little Creek</strong>, le <strong>{rpDisplay(certDoc.date)}</strong>
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
          <button onClick={() => router.push('/redm/obstetrique')} style={{ fontFamily: MONO, fontSize: 15, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '9px 20px', cursor: 'pointer', letterSpacing: '0.1em' }}>← RETOUR</button>
          <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold, letterSpacing: '0.18em' }}>OBSTÉTRIQUE · DOCUMENTATION</span>
        </div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 40, color: T.gold, margin: 0 }}>📁 Documentation</h1>
        <p style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.12em', marginTop: 8 }}>FORMULAIRES & DOCUMENTS OFFICIELS · 1890</p>
      </div>

      {/* ── FORMULAIRES ── */}
      <div style={{ marginBottom: 44 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <span style={{ fontFamily: DISPLAY, fontSize: 22, color: T.gold }}>📋 Formulaires</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(209,183,124,0.25)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>

          {([
            { id: 'suivi', type: 'Suivi de grossesse' as DocCreationType, icon: '🤰', desc: 'Compte rendu de consultation prénatale : terme, examen, complications éventuelles.', color: COL_SUIVI, badge: 'SUI' },
            { id: 'rx',    type: 'Prescription médicale' as DocCreationType, icon: '💊', desc: 'Ordonnance de décoctions, consignes de repos et recommandations.', color: COL_RX, badge: 'RX' },
            { id: 'acc',   type: "Compte-rendu d'accouchement" as DocCreationType, icon: '👶', desc: "Déroulement de l'accouchement, issue, soins prodigués et suivi post-natal.", color: COL_ACC, badge: 'ACC' },
          ] as const).map(m => {
            const h = hover === m.id;
            return (
              <div key={m.id} onClick={() => openCreate(m.type)} onMouseEnter={() => setHover(m.id)} onMouseLeave={() => setHover(null)}
                style={{ background: h ? '#254B5C' : T.card, border: `2px solid ${h ? m.color + '90' : T.border}`, borderLeft: `4px solid ${h ? m.color : m.color + '60'}`, padding: '28px 24px', cursor: 'pointer', transition: 'all 0.18s', transform: h ? 'translateY(-2px)' : 'none', boxShadow: h ? '0 8px 30px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.35)' }}>
                <div style={{ fontSize: 42, marginBottom: 14 }}>{m.icon}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontFamily: DISPLAY, fontSize: 22, color: T.text }}>{m.type}</span>
                  <span style={{ fontFamily: MONO, fontSize: 14, padding: '2px 7px', background: m.color + '22', color: m.color, border: `1px solid ${m.color}55`, letterSpacing: '0.1em', flexShrink: 0 }}>{m.badge}</span>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 14, color: m.color, letterSpacing: '0.12em', marginBottom: 8 }}>TOUTES PATIENTES</div>
                <div style={{ fontFamily: BODY, fontSize: 16, color: T.dim, lineHeight: 1.55 }}>{m.desc}</div>
                <div style={{ fontFamily: MONO, fontSize: 14, color: h ? m.color : '#3A2A1A', marginTop: 14, letterSpacing: '0.1em', transition: 'color 0.15s' }}>→ CRÉER</div>
              </div>
            );
          })}

        </div>
      </div>

      {/* ── RÉSULTATS SUIVIS DE GROSSESSE ── */}
      <ResultsSection
        icon="🤰" title="Suivis de grossesse" color={COL_SUIVI} badge="SUI"
        count={hydrated ? suivis.length : -1}
        onNew={() => openCreate('Suivi de grossesse')}
        newLabel="✚ NOUVEAU SUIVI"
        empty="Aucun suivi enregistré"
      >
        {suivis.map((doc, i) => {
          const pat = patienteById(doc.patientId);
          return (
            <div key={doc.id} style={{ borderBottom: i < suivis.length - 1 ? `1px solid ${T.border}` : 'none', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 19, color: T.text, marginBottom: 4 }}>{doc.titre}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {pat && <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold, background: 'rgba(209,183,124,0.10)', padding: '1px 8px' }}>{pat.patientPrenom} {pat.patientNom}</span>}
                  <span style={{ fontFamily: MONO, fontSize: 14, color: T.dim }}>{rpDisplay(doc.date)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => openCert(doc)} style={{ fontFamily: MONO, fontSize: 14, padding: '6px 10px', cursor: 'pointer', background: `${COL_SUIVI}15`, color: COL_SUIVI, border: `1px solid ${COL_SUIVI}40` }}>📄 VOIR</button>
                {delDoc === doc.id
                  ? <><button onClick={() => deleteDoc(doc.id)} style={{ fontFamily: MONO, fontSize: 14, padding: '6px 10px', cursor: 'pointer', background: '#8B404025', color: '#DF9A88', border: '1px solid #8B404060' }}>OK?</button>
                      <button onClick={() => setDelDoc(null)} style={{ fontFamily: MONO, fontSize: 14, padding: '6px 8px', cursor: 'pointer', background: 'transparent', color: T.dim, border: `1px solid ${T.border}` }}>✕</button></>
                  : <button onClick={() => setDelDoc(doc.id)} style={{ fontFamily: MONO, fontSize: 14, padding: '6px 10px', cursor: 'pointer', background: 'transparent', color: '#8B6060', border: '1px solid rgba(139,64,64,0.3)' }}>✕</button>}
              </div>
            </div>
          );
        })}
      </ResultsSection>

      {/* ── RÉSULTATS PRESCRIPTIONS ── */}
      <ResultsSection
        icon="💊" title="Prescriptions médicales" color={COL_RX} badge="RX"
        count={hydrated ? prescriptions.length : -1}
        onNew={() => openCreate('Prescription médicale')}
        newLabel="✚ NOUVELLE PRESCRIPTION"
        empty="Aucune prescription enregistrée"
      >
        {prescriptions.map((doc, i) => {
          const pat = patienteById(doc.patientId);
          return (
            <div key={doc.id} style={{ borderBottom: i < prescriptions.length - 1 ? `1px solid ${T.border}` : 'none', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 19, color: T.text, marginBottom: 4 }}>{doc.titre}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {pat && <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold, background: 'rgba(209,183,124,0.10)', padding: '1px 8px' }}>{pat.patientPrenom} {pat.patientNom}</span>}
                  <span style={{ fontFamily: MONO, fontSize: 14, color: T.dim }}>{rpDisplay(doc.date)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => openCert(doc)} style={{ fontFamily: MONO, fontSize: 14, padding: '6px 10px', cursor: 'pointer', background: `${COL_RX}15`, color: COL_RX, border: `1px solid ${COL_RX}40` }}>📄 VOIR</button>
                {delDoc === doc.id
                  ? <><button onClick={() => deleteDoc(doc.id)} style={{ fontFamily: MONO, fontSize: 14, padding: '6px 10px', cursor: 'pointer', background: '#8B404025', color: '#DF9A88', border: '1px solid #8B404060' }}>OK?</button>
                      <button onClick={() => setDelDoc(null)} style={{ fontFamily: MONO, fontSize: 14, padding: '6px 8px', cursor: 'pointer', background: 'transparent', color: T.dim, border: `1px solid ${T.border}` }}>✕</button></>
                  : <button onClick={() => setDelDoc(doc.id)} style={{ fontFamily: MONO, fontSize: 14, padding: '6px 10px', cursor: 'pointer', background: 'transparent', color: '#8B6060', border: '1px solid rgba(139,64,64,0.3)' }}>✕</button>}
              </div>
            </div>
          );
        })}
      </ResultsSection>

      {/* ── RÉSULTATS COMPTES-RENDUS D'ACCOUCHEMENT ── */}
      <ResultsSection
        icon="👶" title="Comptes-rendus d'accouchement" color={COL_ACC} badge="ACC"
        count={hydrated ? accouchements.length : -1}
        onNew={() => openCreate("Compte-rendu d'accouchement")}
        newLabel="✚ NOUVEAU COMPTE-RENDU"
        empty="Aucun compte-rendu enregistré"
      >
        {accouchements.map((doc, i) => {
          const pat = patienteById(doc.patientId);
          return (
            <div key={doc.id} style={{ borderBottom: i < accouchements.length - 1 ? `1px solid ${T.border}` : 'none', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 19, color: T.text, marginBottom: 4 }}>{doc.titre}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {pat && <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold, background: 'rgba(209,183,124,0.10)', padding: '1px 8px' }}>{pat.patientPrenom} {pat.patientNom}</span>}
                  <span style={{ fontFamily: MONO, fontSize: 14, color: T.dim }}>{rpDisplay(doc.date)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => openCert(doc)} style={{ fontFamily: MONO, fontSize: 14, padding: '6px 10px', cursor: 'pointer', background: `${COL_ACC}15`, color: COL_ACC, border: `1px solid ${COL_ACC}40` }}>📄 VOIR</button>
                {delDoc === doc.id
                  ? <><button onClick={() => deleteDoc(doc.id)} style={{ fontFamily: MONO, fontSize: 14, padding: '6px 10px', cursor: 'pointer', background: '#8B404025', color: '#DF9A88', border: '1px solid #8B404060' }}>OK?</button>
                      <button onClick={() => setDelDoc(null)} style={{ fontFamily: MONO, fontSize: 14, padding: '6px 8px', cursor: 'pointer', background: 'transparent', color: T.dim, border: `1px solid ${T.border}` }}>✕</button></>
                  : <button onClick={() => setDelDoc(doc.id)} style={{ fontFamily: MONO, fontSize: 14, padding: '6px 10px', cursor: 'pointer', background: 'transparent', color: '#8B6060', border: '1px solid rgba(139,64,64,0.3)' }}>✕</button>}
              </div>
            </div>
          );
        })}
      </ResultsSection>

      {/* ══ PANEL CRÉATION ══ */}
      {createType && (
        <>
          <div onClick={() => setCreateType(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 40 }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 620, background: T.bg, borderLeft: `2px solid ${createType === 'Suivi de grossesse' ? COL_SUIVI : createType === 'Prescription médicale' ? COL_RX : COL_ACC}`, zIndex: 50, display: 'flex', flexDirection: 'column', animation: 'slide-in 0.25s ease' }}>
            <div style={{ padding: '24px 28px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 22, color: createType === 'Suivi de grossesse' ? COL_SUIVI : createType === 'Prescription médicale' ? COL_RX : COL_ACC }}>
                  {createType === 'Suivi de grossesse' ? '🤰' : createType === 'Prescription médicale' ? '💊' : '👶'} {createType}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, marginTop: 4 }}>Nouveau document — rattacher à une patiente</div>
              </div>
              <button onClick={() => setCreateType(null)} style={{ background: 'transparent', border: 'none', color: T.muted, fontSize: 26, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '22px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '16px 18px' }}>
                <div style={{ fontFamily: MONO, fontSize: 14, color: T.gold, letterSpacing: '0.1em', marginBottom: 12 }}>PATIENTE</div>
                <div style={{ display: 'flex', gap: 0, marginBottom: 14, border: `1px solid ${T.border}` }}>
                  {(['existing', 'new'] as const).map(opt => (
                    <button key={opt} onClick={() => setUseExisting(opt === 'existing')}
                      style={{ flex: 1, fontFamily: MONO, fontSize: 14, padding: '8px', cursor: 'pointer', letterSpacing: '0.08em', border: 'none', background: (opt === 'existing') === useExisting ? 'rgba(209,183,124,0.18)' : 'transparent', color: (opt === 'existing') === useExisting ? T.gold : T.dim, borderBottom: (opt === 'existing') === useExisting ? `2px solid ${T.gold}` : '2px solid transparent' }}>
                      {opt === 'existing' ? '👤 PATIENTE EXISTANTE' : '✚ NOUVELLE PATIENTE'}
                    </button>
                  ))}
                </div>

                {useExisting ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input style={inp} placeholder="Rechercher une patiente…" value={patSearch} onChange={e => setPatSearch(e.target.value)} />
                    <select style={{ ...inp, cursor: 'pointer', maxHeight: 160 }} size={Math.min(5, filteredPats.length + 1)} value={selectedPat} onChange={e => setSelectedPat(e.target.value)}>
                      {filteredPats.length === 0
                        ? <option disabled>Aucune patiente trouvée</option>
                        : filteredPats.map(p => <option key={p.id} value={p.id}>{p.patientPrenom} {p.patientNom}{p.patientAge ? ` — ${p.patientAge} ans` : ''}</option>)
                      }
                    </select>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><label style={lbl}>NOM *</label><input style={inp} value={newNom} onChange={e => setNewNom(e.target.value)} placeholder="Dupont" /></div>
                    <div><label style={lbl}>PRÉNOM</label><input style={inp} value={newPrenom} onChange={e => setNewPrenom(e.target.value)} placeholder="Jeanne" /></div>
                    <div style={{ gridColumn: '1/-1' }}><label style={lbl}>ÂGE</label><input style={inp} value={newAge} onChange={e => setNewAge(e.target.value)} placeholder="28 ans" /></div>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
                <div><label style={lbl}>TITRE DU DOCUMENT</label>
                  <input style={inp} value={createTitre} onChange={e => setCreateTitre(e.target.value)} placeholder={createType} />
                </div>
                <div><label style={lbl}>DATE</label>
                  <input style={{ ...inp, width: 150 }} value={createDate} onChange={e => setCreateDate(e.target.value)} placeholder="JJ/MM/AAAA" />
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={lbl}>CONTENU — REMPLISSEZ LES [ ] AVEC LES INFORMATIONS DE LA PATIENTE</label>
                <textarea
                  style={{ ...inp, flex: 1, resize: 'none', minHeight: 420, lineHeight: 1.8, fontSize: 14, padding: '14px' }}
                  value={createContenu}
                  onChange={e => setCreateContenu(e.target.value)}
                />
              </div>
            </div>

            <div style={{ padding: '16px 28px 24px', borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
              <button onClick={submitCreate}
                disabled={useExisting ? !selectedPat : !newNom.trim()}
                style={{ width: '100%', fontFamily: MONO, fontSize: 16, letterSpacing: '0.14em', padding: '14px', cursor: 'pointer', background: `${createType === 'Suivi de grossesse' ? COL_SUIVI : createType === 'Prescription médicale' ? COL_RX : COL_ACC}25`, color: createType === 'Suivi de grossesse' ? COL_SUIVI : createType === 'Prescription médicale' ? COL_RX : COL_ACC, border: `2px solid ${createType === 'Suivi de grossesse' ? COL_SUIVI : createType === 'Prescription médicale' ? COL_RX : COL_ACC}60` }}>
                ✔ ENREGISTRER LE DOCUMENT
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
  const DISPLAY = "'Central Station', 'Georgia', serif";
  const T = { card: '#183746', border: 'rgba(139,90,43,0.30)', text: '#EADCB9', dim: '#C8BEA5', gold: '#D1B77C' };
  const hasChildren = Array.isArray(children) ? children.some(Boolean) : !!children;
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 20, color: T.gold }}>{icon} {title}</span>
        <span style={{ fontFamily: MONO, fontSize: 14, padding: '2px 7px', background: color + '22', color, border: `1px solid ${color}55` }}>{badge}</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(209,183,124,0.20)' }} />
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `4px solid ${color}`, overflow: 'hidden' }}>
        <div style={{ padding: '14px 22px', borderBottom: `1px solid ${T.border}`, background: color + '10', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: MONO, fontSize: 14, color, letterSpacing: '0.1em' }}>{count < 0 ? '—' : count} DOCUMENT{count !== 1 ? 'S' : ''}</span>
          <button onClick={onNew} style={{ fontFamily: MONO, fontSize: 14, background: color + '22', border: `1px solid ${color}55`, color, padding: '7px 16px', cursor: 'pointer', letterSpacing: '0.1em' }}>{newLabel}</button>
        </div>
        {!hasChildren
          ? <div style={{ padding: '36px', textAlign: 'center', fontFamily: MONO, fontSize: 14, color: T.dim }}>{empty}</div>
          : <div style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>
        }
      </div>
    </div>
  );
}
