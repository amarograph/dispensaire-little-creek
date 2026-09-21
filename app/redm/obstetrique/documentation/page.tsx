'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  DISPLAY, MONO, BODY, T,
  COL_SUIVI, COL_RX, COL_ACC, rpDisplay,
  type Patiente, type DocResult,
} from './_lib/shared';

export default function ObstetriqueDocumentationPage() {
  const router  = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const [hydrated,   setHydrated]   = useState(false);
  const [hover,      setHover]      = useState<string | null>(null);

  const [patientes,  setPatientes]  = useState<Patiente[]>([]);
  const [allDocs,    setAllDocs]    = useState<DocResult[]>([]);

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
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');`}</style>

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
            { id: 'suivi', href: '/redm/obstetrique/documentation/suivi-grossesse', label: 'Suivi de grossesse', icon: '🤰', desc: 'Compte rendu de consultation prénatale : terme, examen, complications éventuelles.', color: COL_SUIVI, badge: 'SUI' },
            { id: 'rx',    href: '/redm/obstetrique/documentation/prescription-medicale', label: 'Prescription médicale', icon: '💊', desc: 'Ordonnance de décoctions, consignes de repos et recommandations.', color: COL_RX, badge: 'RX' },
            { id: 'acc',   href: '/redm/obstetrique/documentation/compte-rendu-accouchement', label: "Compte-rendu d'accouchement", icon: '👶', desc: "Déroulement de l'accouchement, issue, soins prodigués et suivi post-natal.", color: COL_ACC, badge: 'ACC' },
          ] as const).map(m => {
            const h = hover === m.id;
            return (
              <div key={m.id} onClick={() => router.push(m.href)} onMouseEnter={() => setHover(m.id)} onMouseLeave={() => setHover(null)}
                style={{ background: h ? '#254B5C' : T.card, border: `2px solid ${h ? m.color + '90' : T.border}`, borderLeft: `4px solid ${h ? m.color : m.color + '60'}`, padding: '28px 24px', cursor: 'pointer', transition: 'all 0.18s', transform: h ? 'translateY(-2px)' : 'none', boxShadow: h ? '0 8px 30px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.35)' }}>
                <div style={{ fontSize: 42, marginBottom: 14 }}>{m.icon}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontFamily: DISPLAY, fontSize: 22, color: T.text }}>{m.label}</span>
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
        onNew={() => router.push('/redm/obstetrique/documentation/suivi-grossesse')}
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
        onNew={() => router.push('/redm/obstetrique/documentation/prescription-medicale')}
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
        onNew={() => router.push('/redm/obstetrique/documentation/compte-rendu-accouchement')}
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
    </div>
  );
}

/* ══ Composant section résultats ══ */
function ResultsSection({ icon, title, color, badge, count, onNew, newLabel, empty, children }: {
  icon: string; title: string; color: string; badge: string;
  count: number; onNew: () => void; newLabel: string; empty: string;
  children: React.ReactNode;
}) {
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
