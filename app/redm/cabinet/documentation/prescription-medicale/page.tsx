'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const DISPLAY = "'Burnic', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";
const BODY    = "'Cormorant Garamond', 'Georgia', serif";
const T = { bg: '#EDE0C2', card: '#F7EEDB', border: 'rgba(139,90,43,0.30)', gold: '#80682D', text: '#183746', muted: '#6A6D50', dim: '#646850' };
const COL = '#A0784A';

function uid()  { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function rpDate(d = new Date()) {
  const s = d.toLocaleDateString('fr-FR').split('/'); s[2] = String(Number(s[2]) - 136); return s.join('/');
}
function rpDisplay(date: string): string {
  const p = date.split('/'); if (p.length !== 3) return date;
  const y = Number(p[2]); if (isNaN(y)) return date;
  p[2] = String(y >= 1900 ? y - 136 : y); return p.join('/');
}

interface Patient {
  id: string; patientNom: string; patientPrenom: string; patientAge: string;
  dateConsult: string; type: string; plainte: string;
}
interface DocResult { id: string; patientId: string; type: string; titre: string; contenu: string; date: string; createdAt: string; }

function mapDossier(row: any): Patient {
  return {
    id:            String(row.id ?? ''),
    patientNom:    String(row.patient_nom    ?? ''),
    patientPrenom: String(row.patient_prenom ?? ''),
    patientAge:    String(row.patient_age    ?? ''),
    dateConsult:   String(row.date_consult   ?? ''),
    type:          String(row.type_seance    ?? ''),
    plainte:       String(row.plainte        ?? ''),
  };
}

const TEMPLATE = `Prescription Médicale
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

export default function PrescriptionMedicalePage() {
  const router   = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const [view,        setView]        = useState<'form' | 'letter'>('form');
  const [hydrated,    setHydrated]    = useState(false);
  const [patients,    setPatients]    = useState<Patient[]>([]);
  const [search,      setSearch]      = useState('');
  const [useExisting, setUseExisting] = useState(true);
  const [selectedPat, setSelectedPat] = useState<Patient | null>(null);
  const [newNom,      setNewNom]      = useState('');
  const [newPrenom,   setNewPrenom]   = useState('');
  const [newAge,      setNewAge]      = useState('');
  const [titre,       setTitre]       = useState('');
  const [date,        setDate]        = useState('');
  const [contenu,     setContenu]     = useState(TEMPLATE);
  const [savedDoc,    setSavedDoc]    = useState<DocResult | null>(null);
  const [savedPat,    setSavedPat]    = useState<Patient | null>(null);
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState('');

  useEffect(() => {
    setDate(rpDate());
    fetch('/api/cabinet/dossiers')
      .then(r => r.ok ? r.json() : { dossiers: [] })
      .then(data => {
        const pats: Patient[] = (data.dossiers ?? []).map(mapDossier);
        setPatients(pats);
        setSelectedPat(pats[0] ?? null);
        setHydrated(true);
      })
      .catch(() => setHydrated(true));
  }, []);

  const filtered = patients.filter(p =>
    `${p.patientPrenom} ${p.patientNom}`.toLowerCase().includes(search.toLowerCase())
  );

  async function submit() {
    if (saving) return;
    setSaving(true);
    setSaveError('');
    try {
      let pat: Patient | null = null;

      if (useExisting) {
        pat = selectedPat;
        if (!pat) { setSaveError('Aucun patient sélectionné.'); return; }
      } else {
        if (!newNom.trim()) { setSaveError('Le nom est requis.'); return; }
        const r = await fetch('/api/cabinet/dossiers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientNom:    newNom.trim(),
            patientPrenom: newPrenom.trim(),
            patientAge:    newAge,
            dateConsult:   date,
            type:          'Première consultation',
            statut:        'EN COURS',
          }),
        });
        if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error ?? `Erreur ${r.status}`); }
        const d = await r.json();
        pat = mapDossier(d.dossier);
        setPatients(prev => [pat!, ...prev]);
        setSelectedPat(pat);
      }

      const newId = uid();
      const r = await fetch('/api/cabinet/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id:         newId,
          patient_id: pat.id,
          type:       'Prescription médicale',
          titre:      titre.trim() || 'Prescription médicale',
          contenu,
          date,
        }),
      });
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error ?? `Erreur ${r.status}`); }
      const saved = await r.json();

      const doc: DocResult = {
        id:        String(saved?.document?.id ?? newId),
        patientId: pat.id,
        type:      'Prescription médicale',
        titre:     titre.trim() || 'Prescription médicale',
        contenu, date,
        createdAt: saved?.document?.created_at ?? new Date().toISOString(),
      };
      setSavedDoc(doc);
      setSavedPat(pat);
      setView('letter');
    } catch (err: any) {
      setSaveError(err.message ?? 'Impossible de sauvegarder.');
    } finally {
      setSaving(false);
    }
  }

  const canSubmit = saving ? false : useExisting ? !!selectedPat : !!newNom.trim();

  async function saveAsPng() {
    const el = printRef.current;
    if (!el || !savedDoc) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(el, { backgroundColor: '#FDFAF4', scale: 2, useCORS: true, allowTaint: true, logging: false });
      const link = document.createElement('a');
      link.download = `${savedDoc.titre}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) { console.error('PNG export:', e); }
  }

  /* ══ VUE CERTIFICAT ══ */
  if (view === 'letter' && savedDoc && savedPat) return (
    <div style={{ fontFamily: BODY }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
        @font-face { font-family: 'Libre Baskerville'; src: url('/SpecialElite-Regular.ttf') format('truetype'); font-weight: normal; font-style: normal; }
        @media print { .no-print { display: none !important; } .print-area { background: white !important; color: black !important; padding: 40px !important; } }
      `}</style>
      <div className="no-print" style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button onClick={() => router.push('/redm/cabinet/documentation')} style={{ fontFamily: MONO, fontSize: 14, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '9px 20px', cursor: 'pointer', letterSpacing: '0.1em' }}>← RETOUR</button>
        <button onClick={() => router.push(`/redm/cabinet/patients/${savedPat.id}`)} style={{ fontFamily: MONO, fontSize: 14, background: `${COL}22`, border: `1px solid ${COL}55`, color: COL, padding: '9px 22px', cursor: 'pointer', letterSpacing: '0.1em' }}>📋 VOIR DOSSIER</button>
        <button onClick={() => window.print()} style={{ fontFamily: MONO, fontSize: 14, background: 'rgba(107,122,187,0.22)', border: '1px solid rgba(107,122,187,0.55)', color: '#8899CC', padding: '9px 22px', cursor: 'pointer', letterSpacing: '0.1em' }}>🖨 IMPRIMER</button>
        <button onClick={saveAsPng} style={{ fontFamily: MONO, fontSize: 14, background: 'rgba(122,154,106,0.18)', border: '1px solid rgba(122,154,106,0.5)', color: '#526C45', padding: '9px 22px', cursor: 'pointer', letterSpacing: '0.1em' }}>💾 ENREGISTRER PNG</button>
      </div>
      <div ref={printRef} className="print-area" style={{ background: '#FDFAF4', border: '2px solid #6A6D50', padding: '52px 60px', width: 794, maxWidth: 794, margin: '0 auto', color: '#EADCB9', fontFamily: "'Libre Baskerville', 'Courier New', monospace" }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 20, letterSpacing: '0.12em', fontWeight: 'bold', marginBottom: 4 }}>CABINET THÉRAPEUTIQUE PSYCHIQUE</div>
          <div style={{ fontSize: 15, color: '#4A3018', marginBottom: 4 }}>Little Creek — Blackwater</div>
          <div style={{ fontSize: 13, color: '#6A5030', lineHeight: 1.7 }}>Sous la direction du Docteur François De Millet<br />Médecin – Thérapeute, formé aux doctrines modernes de la médecine mentale et des sciences morales</div>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 17, letterSpacing: '0.1em', textDecoration: 'underline', textUnderlineOffset: 6, fontWeight: 'bold' }}>{savedDoc.titre.toUpperCase()}</div>
          <div style={{ fontSize: 13, color: '#6A5030', marginTop: 6 }}>Prescription médicale</div>
        </div>
        <div style={{ fontSize: 15, lineHeight: 2 }}>
          <p style={{ margin: '0 0 16px' }}>Je soussigné, <strong>Docteur François De Millet</strong>, médecin – thérapeute exerçant au sein du L'ORDRES DES MÉDECINS - Hôpital de Little Creek - Dispensaire de Valentine, prescris en date du <strong>{rpDisplay(savedDoc.date)}</strong>, à l'attention de :</p>
          <p style={{ paddingLeft: 28, margin: '0 0 24px', lineHeight: 2.2 }}>
            <strong>Nom et Prénom :</strong> {savedPat.patientPrenom} {savedPat.patientNom}<br />
            {savedPat.patientAge ? <><strong>Âge :</strong> {savedPat.patientAge} ans<br /></> : null}
          </p>
          <div style={{ margin: '0 0 40px', whiteSpace: 'pre-wrap', lineHeight: 2.1 }}>{savedDoc.contenu}</div>
          <div style={{ marginTop: 52, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 14, color: '#6A5030', lineHeight: 2 }}>Fait à <strong>Little Creek</strong>, le <strong>{rpDisplay(savedDoc.date)}</strong></div>
            <div style={{ textAlign: 'right' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/signature.png" alt="Signature" style={{ width: 520, display: 'block', marginLeft: 'auto' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ══ VUE FORMULAIRE ══ */
  return (
    <div style={{ fontFamily: BODY, maxWidth: 860, margin: '0 auto' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');`}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
        <button onClick={() => router.push('/redm/cabinet/documentation')}
          style={{ fontFamily: MONO, fontSize: 14, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '9px 20px', cursor: 'pointer', letterSpacing: '0.1em' }}>
          ← RETOUR
        </button>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 12, color: T.dim, letterSpacing: '0.18em', marginBottom: 4 }}>CABINET · DOCUMENTATION</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 32, color: COL, lineHeight: 1 }}>💊 Prescription médicale</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Bloc Patient ── */}
        <section style={{ background: T.card, border: `1px solid ${T.border}`, borderTop: `3px solid ${COL}`, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${T.border}`, background: COL + '10' }}>
            <span style={{ fontFamily: MONO, fontSize: 13, color: COL, letterSpacing: '0.16em' }}>PATIENT CONCERNÉ</span>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'inline-flex', border: `1px solid ${T.border}`, marginBottom: 20, overflow: 'hidden' }}>
              {([true, false] as const).map(isEx => (
                <button key={String(isEx)} onClick={() => setUseExisting(isEx)}
                  style={{ fontFamily: MONO, fontSize: 13, padding: '9px 22px', cursor: 'pointer', border: 'none', letterSpacing: '0.08em', background: useExisting === isEx ? COL + '25' : 'transparent', color: useExisting === isEx ? COL : T.dim, borderRight: isEx ? `1px solid ${T.border}` : 'none', transition: 'all 0.15s' }}>
                  {isEx ? '👤 Patient existant' : '✚ Nouveau patient'}
                </button>
              ))}
            </div>

            {useExisting ? (
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ width: 280, flexShrink: 0 }}>
                  <input
                    style={{ fontFamily: MONO, fontSize: 14, background: 'rgba(0,0,0,0.3)', border: `1px solid ${T.border}`, color: T.text, padding: '9px 14px', outline: 'none', width: '100%', boxSizing: 'border-box', marginBottom: 8 }}
                    placeholder="🔍 Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
                  <div style={{ border: `1px solid ${T.border}`, maxHeight: 200, overflowY: 'auto' }}>
                    {!hydrated
                      ? <div style={{ padding: 16, fontFamily: MONO, fontSize: 13, color: T.dim, textAlign: 'center' }}>Chargement…</div>
                      : filtered.length === 0
                        ? <div style={{ padding: 16, fontFamily: MONO, fontSize: 13, color: T.dim, textAlign: 'center' }}>Aucun patient</div>
                        : filtered.map(p => (
                            <div key={p.id} onClick={() => setSelectedPat(p)}
                              style={{ padding: '10px 14px', cursor: 'pointer', background: selectedPat?.id === p.id ? COL + '20' : 'transparent', borderLeft: `3px solid ${selectedPat?.id === p.id ? COL : 'transparent'}`, borderBottom: `1px solid ${T.border}`, transition: 'all 0.12s' }}
                              onMouseEnter={e => { if (selectedPat?.id !== p.id) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                              onMouseLeave={e => { if (selectedPat?.id !== p.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                              <div style={{ fontFamily: DISPLAY, fontSize: 16, color: T.text }}>{p.patientPrenom} {p.patientNom}</div>
                              <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, marginTop: 2 }}>{p.patientAge ? `${p.patientAge} ans · ` : ''}{p.type}</div>
                            </div>
                          ))}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  {selectedPat
                    ? <div style={{ background: COL + '08', border: `1px solid ${COL}30`, padding: '18px 22px', height: '100%', boxSizing: 'border-box' }}>
                        <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.text, marginBottom: 10 }}>{selectedPat.patientPrenom} {selectedPat.patientNom}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {selectedPat.patientAge && <span style={{ fontFamily: MONO, fontSize: 12, color: T.muted, background: 'rgba(255,255,255,0.06)', padding: '3px 10px', border: `1px solid ${T.border}` }}>{selectedPat.patientAge} ans</span>}
                          <span style={{ fontFamily: MONO, fontSize: 12, color: COL, background: COL + '15', padding: '3px 10px', border: `1px solid ${COL}40` }}>{selectedPat.type}</span>
                          <span style={{ fontFamily: MONO, fontSize: 12, color: T.dim, background: 'rgba(255,255,255,0.04)', padding: '3px 10px', border: `1px solid ${T.border}` }}>Dossier ouvert le {selectedPat.dateConsult}</span>
                        </div>
                        {selectedPat.plainte && <div style={{ fontFamily: BODY, fontSize: 15, color: T.muted, marginTop: 12, fontStyle: 'italic', lineHeight: 1.6 }}>"{selectedPat.plainte}"</div>}
                      </div>
                    : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, border: `1px dashed ${T.border}`, fontFamily: MONO, fontSize: 13, color: T.dim }}>Sélectionner un patient</div>}
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: '1/3' }}>
                  <label style={{ fontFamily: MONO, fontSize: 12, color: T.dim, letterSpacing: '0.12em', marginBottom: 6, display: 'block' }}>NOM *</label>
                  <input style={{ fontFamily: MONO, fontSize: 15, background: 'rgba(0,0,0,0.28)', border: `1px solid ${T.border}`, color: T.text, padding: '10px 14px', outline: 'none', width: '100%', boxSizing: 'border-box' }} value={newNom} onChange={e => setNewNom(e.target.value)} placeholder="Dupont" />
                </div>
                <div>
                  <label style={{ fontFamily: MONO, fontSize: 12, color: T.dim, letterSpacing: '0.12em', marginBottom: 6, display: 'block' }}>ÂGE</label>
                  <input style={{ fontFamily: MONO, fontSize: 15, background: 'rgba(0,0,0,0.28)', border: `1px solid ${T.border}`, color: T.text, padding: '10px 14px', outline: 'none', width: '100%', boxSizing: 'border-box' }} value={newAge} onChange={e => setNewAge(e.target.value)} placeholder="32 ans" />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontFamily: MONO, fontSize: 12, color: T.dim, letterSpacing: '0.12em', marginBottom: 6, display: 'block' }}>PRÉNOM</label>
                  <input style={{ fontFamily: MONO, fontSize: 15, background: 'rgba(0,0,0,0.28)', border: `1px solid ${T.border}`, color: T.text, padding: '10px 14px', outline: 'none', width: '100%', boxSizing: 'border-box' }} value={newPrenom} onChange={e => setNewPrenom(e.target.value)} placeholder="Jean" />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Bloc Titre & Date ── */}
        <section style={{ background: T.card, border: `1px solid ${T.border}`, borderTop: `3px solid ${T.gold}`, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${T.border}`, background: T.gold + '10' }}>
            <span style={{ fontFamily: MONO, fontSize: 13, color: T.gold, letterSpacing: '0.16em' }}>DOCUMENT</span>
          </div>
          <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 200px', gap: 16 }}>
            <div>
              <label style={{ fontFamily: MONO, fontSize: 12, color: T.dim, letterSpacing: '0.12em', marginBottom: 6, display: 'block' }}>TITRE</label>
              <input style={{ fontFamily: MONO, fontSize: 16, background: 'rgba(0,0,0,0.28)', border: `1px solid ${T.border}`, color: T.text, padding: '11px 16px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                value={titre} onChange={e => setTitre(e.target.value)} placeholder="Prescription médicale" />
            </div>
            <div>
              <label style={{ fontFamily: MONO, fontSize: 12, color: T.dim, letterSpacing: '0.12em', marginBottom: 6, display: 'block' }}>DATE</label>
              <input style={{ fontFamily: MONO, fontSize: 15, background: 'rgba(0,0,0,0.28)', border: `1px solid ${T.border}`, color: T.text, padding: '11px 14px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                value={date} onChange={e => setDate(e.target.value)} placeholder="JJ/MM/AAAA" />
            </div>
          </div>
        </section>

        {/* ── Bloc Contenu ── */}
        <section style={{ background: T.card, border: `1px solid ${T.border}`, borderTop: `3px solid ${T.muted}`, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${T.border}`, background: 'rgba(139,115,85,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: MONO, fontSize: 13, color: T.muted, letterSpacing: '0.16em' }}>CONTENU DE LA PRESCRIPTION</span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: T.dim }}>Remplacer les [ ] par les informations du patient</span>
          </div>
          <textarea
            style={{ fontFamily: MONO, fontSize: 14, background: 'rgba(0,0,0,0.18)', border: 'none', borderBottom: `1px solid ${T.border}`, color: T.text, padding: '20px 24px', outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'vertical', minHeight: 520, lineHeight: 1.85, display: 'block' }}
            value={contenu} onChange={e => setContenu(e.target.value)} />
        </section>

        {/* ── Erreur ── */}
        {saveError && (
          <div style={{ padding: '12px 16px', background: 'rgba(200,80,80,0.10)', border: '1px solid rgba(200,80,80,0.35)', color: '#963F36', fontFamily: MONO, fontSize: 13 }}>
            ⚠ {saveError}
          </div>
        )}

        {/* ── Bouton ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingBottom: 40 }}>
          <button onClick={() => router.push('/redm/cabinet/documentation')}
            style={{ fontFamily: MONO, fontSize: 14, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '12px 28px', cursor: 'pointer', letterSpacing: '0.1em' }}>
            ANNULER
          </button>
          <button onClick={submit} disabled={!canSubmit}
            style={{ fontFamily: MONO, fontSize: 15, letterSpacing: '0.14em', padding: '13px 36px', cursor: canSubmit ? 'pointer' : 'not-allowed', background: canSubmit ? COL + '28' : 'rgba(255,255,255,0.04)', color: canSubmit ? COL : T.dim, border: `2px solid ${canSubmit ? COL + '70' : 'rgba(255,255,255,0.08)'}`, transition: 'all 0.15s' }}>
            {saving ? '⟳ ENREGISTREMENT...' : '✔ ENREGISTRER & VOIR LE DOCUMENT'}
          </button>
        </div>

      </div>
    </div>
  );
}
