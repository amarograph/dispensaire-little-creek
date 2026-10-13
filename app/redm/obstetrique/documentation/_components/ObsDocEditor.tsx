'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RichEditor, templateToRich, isRichEmpty } from '@/app/redm/_components/RichDoc';
import {
  DISPLAY, MONO, BODY, T, inp, lbl, rpDate,
  type DocCreationType, type DocResult, type Patiente,
} from '../_lib/shared';
import { DocCertificate } from './DocCertificate';

/* Création d'un document d'obstétrique — même présentation que les documents du cabinet thérapeutique,
   avec deux versions qui se basculent :
   • MODE GUIDÉ : scénarios et menus déroulants (le formulaire propre à chaque document) → texte généré, relisible
   • RÉDACTION LIBRE : le modèle du document dans un éditeur sur fond blanc, que l'on écrit entièrement soi-même */

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

export function ObsDocEditor({ type, icon, color, colorText, libreTemplate, canGenerate, generate, guidedTop, guidedFields, nouveauLabel }: {
  type: DocCreationType; icon: string; color: string; colorText: string;
  libreTemplate: string; canGenerate: boolean;
  generate: (nom: string, age: string, date: string) => string;
  guidedTop: React.ReactNode; guidedFields: React.ReactNode; nouveauLabel: string;
}) {
  const router = useRouter();

  const [patientes,   setPatientes]   = useState<Patiente[]>([]);
  const [hydrated,    setHydrated]    = useState(false);
  const [search,      setSearch]      = useState('');
  const [useExisting, setUseExisting] = useState(true);
  const [selectedPat, setSelectedPat] = useState('');
  const [newNom,      setNewNom]      = useState('');
  const [newPrenom,   setNewPrenom]   = useState('');
  const [newAge,      setNewAge]      = useState('');

  const [titre, setTitre] = useState<string>(type);
  const [date,  setDate]  = useState(() => rpDate());

  const [mode,         setMode]         = useState<'guide' | 'libre'>('guide');
  const [step,         setStep]         = useState<'form' | 'preview'>('form');
  const [contenuGuide, setContenuGuide] = useState('');
  const [contenuLibre, setContenuLibre] = useState(() => templateToRich(libreTemplate));

  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedDoc,  setSavedDoc]  = useState<DocResult | null>(null);
  const [savedPat,  setSavedPat]  = useState<Patiente | null>(null);

  useEffect(() => {
    fetch('/api/obstetrique/dossiers')
      .then(r => r.ok ? r.json() : { dossiers: [] })
      .then(data => { const list: Patiente[] = data.dossiers ?? []; setPatientes(list); if (list[0]) setSelectedPat(list[0].id); setHydrated(true); })
      .catch(() => setHydrated(true));
  }, []);

  const filtered   = patientes.filter(p => `${p.patientPrenom} ${p.patientNom}`.toLowerCase().includes(search.toLowerCase()));
  const patChoisie = patientes.find(p => p.id === selectedPat) ?? null;
  const patOk      = useExisting ? !!selectedPat : !!newNom.trim();

  const contenu    = mode === 'libre' ? contenuLibre : contenuGuide;
  const enEdition  = mode === 'libre' || step === 'preview';
  const canSave    = patOk && !saving && !isRichEmpty(contenu);

  function genere() {
    const nom = useExisting ? (patChoisie ? `${patChoisie.patientPrenom} ${patChoisie.patientNom}`.trim() : '') : `${newPrenom} ${newNom}`.trim();
    const age = useExisting ? (patChoisie?.patientAge ?? '') : newAge;
    setContenuGuide(templateToRich(generate(nom, age, date)));
    setStep('preview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function save() {
    if (!canSave) return;
    setSaving(true); setSaveError('');
    try {
      let pat: Patiente | null = null;
      if (useExisting) {
        pat = patChoisie;
        if (!pat) { setSaveError('Aucune patiente sélectionnée.'); return; }
      } else {
        const r = await fetch('/api/obstetrique/dossiers', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patientNom: newNom.trim(), patientPrenom: newPrenom.trim(), patientAge: newAge, dateConsult: date, type: 'Première consultation', statut: 'EN COURS' }),
        });
        if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error ?? `Erreur ${r.status}`); }
        const d = await r.json();
        pat = { id: String(d.dossier.id), patientNom: newNom.trim(), patientPrenom: newPrenom.trim(), patientAge: newAge, type: 'Première consultation', statut: 'EN COURS' };
      }
      const titreFinal = titre.trim() || type;
      const r = await fetch('/api/obstetrique/documents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: pat.id, type, titre: titreFinal, contenu, date }),
      });
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error ?? `Erreur ${r.status}`); }
      const saved = await r.json().catch(() => ({}));
      setSavedDoc({
        id: String(saved?.document?.id ?? uid()), patientId: pat.id, type, titre: titreFinal, contenu, date,
        createdAt: saved?.document?.createdAt ?? new Date().toISOString(),
      });
      setSavedPat(pat);
    } catch (err: any) {
      setSaveError(err.message ?? 'Impossible de sauvegarder.');
    } finally {
      setSaving(false);
    }
  }

  /* ══ Certificat après enregistrement ══ */
  if (savedDoc && savedPat) return (
    <DocCertificate
      doc={savedDoc} patiente={savedPat} color={color}
      onBack={() => router.push('/redm/obstetrique/documentation')}
      extraButtons={<>
        <button onClick={() => router.push(`/redm/obstetrique/patientes/${savedPat.id}`)} style={{ fontFamily: MONO, fontSize: 14, background: `${color}22`, border: `1px solid ${color}55`, color: colorText, padding: '9px 22px', cursor: 'pointer', letterSpacing: '0.1em' }}>📋 VOIR DOSSIER</button>
        <button onClick={() => window.location.reload()} style={{ fontFamily: MONO, fontSize: 14, background: 'rgba(209,183,124,0.15)', border: '1px solid rgba(209,183,124,0.4)', color: T.gold, padding: '9px 22px', cursor: 'pointer', letterSpacing: '0.1em' }}>{nouveauLabel}</button>
      </>}
    />
  );

  const section: React.CSSProperties = { background: T.card, border: `1px solid ${T.border}`, overflow: 'hidden' };
  const sectionHead = (col: string): React.CSSProperties => ({ padding: '16px 24px', borderBottom: `1px solid ${T.border}`, background: col + '10' });

  return (
    <div style={{ fontFamily: BODY, maxWidth: 1700, margin: '0 auto' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');`}</style>

      {/* ── En-tête ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <button onClick={() => (mode === 'guide' && step === 'preview') ? setStep('form') : router.push('/redm/obstetrique/documentation')}
          style={{ fontFamily: MONO, fontSize: 14, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '9px 20px', cursor: 'pointer', letterSpacing: '0.1em' }}>
          {(mode === 'guide' && step === 'preview') ? '← MODIFIER LES CHAMPS' : '← RETOUR'}
        </button>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.18em', marginBottom: 4 }}>OBSTÉTRIQUE · DOCUMENTATION</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 32, color, lineHeight: 1 }}>{icon} {type}</div>
        </div>
      </div>

      {/* ── Bascule des deux versions ── */}
      <div style={{ display: 'inline-flex', border: `1px solid ${T.border}`, marginBottom: 20, overflow: 'hidden' }}>
        {([['guide', '🗂 MODE GUIDÉ', 'Scénarios et menus déroulants'], ['libre', '✍ RÉDACTION LIBRE', 'Tout écrire soi-même']] as const).map(([id, label, sub], i) => {
          const on = mode === id;
          return (
            <button key={id} onClick={() => setMode(id)}
              style={{ fontFamily: MONO, fontSize: 14, padding: '10px 26px', cursor: 'pointer', border: 'none', letterSpacing: '0.08em', textAlign: 'left', background: on ? color + '28' : 'transparent', color: on ? colorText : T.dim, borderRight: i === 0 ? `1px solid ${T.border}` : 'none', borderBottom: `3px solid ${on ? color : 'transparent'}` }}>
              <div>{label}</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2, letterSpacing: '0.02em' }}>{sub}</div>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Mode guidé : formulaire de scénarios / menus (avant génération) ── */}
        {mode === 'guide' && step === 'form' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{guidedTop}</div>
        )}

        {/* ── Bloc Patiente ── */}
        <section style={{ ...section, borderTop: `3px solid ${color}` }}>
          <div style={sectionHead(color)}>
            <span style={{ fontFamily: MONO, fontSize: 14, color, letterSpacing: '0.16em' }}>PATIENTE CONCERNÉE</span>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'inline-flex', border: `1px solid ${T.border}`, marginBottom: 20, overflow: 'hidden' }}>
              {([true, false] as const).map(isEx => (
                <button key={String(isEx)} onClick={() => setUseExisting(isEx)}
                  style={{ fontFamily: MONO, fontSize: 14, padding: '9px 22px', cursor: 'pointer', border: 'none', letterSpacing: '0.08em', background: useExisting === isEx ? color + '25' : 'transparent', color: useExisting === isEx ? colorText : T.dim, borderRight: isEx ? `1px solid ${T.border}` : 'none' }}>
                  {isEx ? '👤 Patiente existante' : '✚ Nouvelle patiente'}
                </button>
              ))}
            </div>

            {useExisting ? (
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ width: 340, flexShrink: 0 }}>
                  <input style={{ ...inp, marginBottom: 8 }} placeholder="🔍 Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
                  <div style={{ border: `1px solid ${T.border}`, maxHeight: 240, overflowY: 'auto' }}>
                    {!hydrated
                      ? <div style={{ padding: 16, fontFamily: MONO, fontSize: 14, color: T.dim, textAlign: 'center' }}>Chargement…</div>
                      : filtered.length === 0
                        ? <div style={{ padding: 16, fontFamily: MONO, fontSize: 14, color: T.dim, textAlign: 'center' }}>Aucune patiente</div>
                        : filtered.map(p => (
                            <div key={p.id} onClick={() => setSelectedPat(p.id)}
                              style={{ padding: '10px 14px', cursor: 'pointer', background: selectedPat === p.id ? color + '20' : 'transparent', borderLeft: `3px solid ${selectedPat === p.id ? color : 'transparent'}`, borderBottom: `1px solid ${T.border}` }}>
                              <div style={{ fontFamily: DISPLAY, fontSize: 16, color: T.text }}>{p.patientPrenom} {p.patientNom}</div>
                              <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, marginTop: 2 }}>{p.patientAge ? `${p.patientAge} ans` : '—'}{p.type ? ` · ${p.type}` : ''}</div>
                            </div>
                          ))}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 260 }}>
                  {patChoisie
                    ? <div style={{ background: color + '08', border: `1px solid ${color}30`, padding: '18px 22px', height: '100%', boxSizing: 'border-box' }}>
                        <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.text, marginBottom: 10 }}>{patChoisie.patientPrenom} {patChoisie.patientNom}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {patChoisie.patientAge && <span style={{ fontFamily: MONO, fontSize: 14, color: T.muted, background: 'rgba(255,255,255,0.06)', padding: '3px 10px', border: `1px solid ${T.border}` }}>{patChoisie.patientAge} ans</span>}
                          {patChoisie.type && <span style={{ fontFamily: MONO, fontSize: 14, color: colorText, background: color + '15', padding: '3px 10px', border: `1px solid ${color}40` }}>{patChoisie.type}</span>}
                        </div>
                      </div>
                    : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, border: `1px dashed ${T.border}`, fontFamily: MONO, fontSize: 14, color: T.dim }}>Sélectionner une patiente</div>}
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,2fr) minmax(0,1fr)', gap: 14 }}>
                <div><label style={lbl}>NOM *</label><input style={inp} value={newNom} onChange={e => setNewNom(e.target.value)} placeholder="Dupont" /></div>
                <div><label style={lbl}>PRÉNOM</label><input style={inp} value={newPrenom} onChange={e => setNewPrenom(e.target.value)} placeholder="Jeanne" /></div>
                <div><label style={lbl}>ÂGE</label><input style={inp} value={newAge} onChange={e => setNewAge(e.target.value)} placeholder="28 ans" /></div>
              </div>
            )}
          </div>
        </section>

        {/* ── Bloc Titre & Date ── */}
        <section style={{ ...section, borderTop: `3px solid ${T.gold}` }}>
          <div style={sectionHead(T.gold)}>
            <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold, letterSpacing: '0.16em' }}>DOCUMENT</span>
          </div>
          <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 220px', gap: 16 }}>
            <div><label style={lbl}>TITRE</label><input style={{ ...inp, fontSize: 16, padding: '11px 16px' }} value={titre} onChange={e => setTitre(e.target.value)} placeholder={type} /></div>
            <div><label style={lbl}>DATE (RP)</label><input style={inp} value={date} onChange={e => setDate(e.target.value)} placeholder="JJ/MM/AAAA" /></div>
          </div>
        </section>

        {/* ── Mode guidé : champs du formulaire ── */}
        {mode === 'guide' && step === 'form' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{guidedFields}</div>
        )}

        {/* ── Mode guidé : bouton de génération ── */}
        {mode === 'guide' && step === 'form' && (
          <button onClick={genere} disabled={!canGenerate || !patOk}
            style={{ width: '100%', fontFamily: MONO, fontSize: 16, letterSpacing: '0.14em', padding: '15px', cursor: canGenerate && patOk ? 'pointer' : 'not-allowed', opacity: canGenerate && patOk ? 1 : 0.5, background: `${color}30`, color: colorText, border: `2px solid ${color}90`, marginBottom: 20 }}>
            {!canGenerate ? 'CHOISISSEZ D’ABORD UN SCÉNARIO' : !patOk ? 'SÉLECTIONNEZ UNE PATIENTE' : 'GÉNÉRER LE DOCUMENT →'}
          </button>
        )}

        {/* ── Contenu : éditeur sur fond blanc (relecture du mode guidé / rédaction libre) ── */}
        {enEdition && (
          <section style={{ ...section, borderTop: `3px solid ${T.muted}` }}>
            <div style={{ ...sectionHead(T.muted), display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontFamily: MONO, fontSize: 14, color: T.muted, letterSpacing: '0.16em' }}>
                {mode === 'libre' ? 'CONTENU — RÉDACTION LIBRE' : 'DOCUMENT GÉNÉRÉ — MODIFIEZ CE QUI EST NÉCESSAIRE'}
              </span>
              {mode === 'libre' && <span style={{ fontFamily: MONO, fontSize: 14, color: T.dim }}>Remplacer les [ ] par les informations de la patiente</span>}
            </div>
            <div style={{ padding: '18px 24px 24px', display: 'flex', flexDirection: 'column' }}>
              <RichEditor value={contenu} onChange={mode === 'libre' ? setContenuLibre : setContenuGuide} minHeight={640} />
            </div>
          </section>
        )}

        {saveError && (
          <div style={{ padding: '12px 16px', background: 'rgba(200,80,80,0.10)', border: '1px solid rgba(200,80,80,0.35)', color: '#DF9A88', fontFamily: MONO, fontSize: 14 }}>⚠ {saveError}</div>
        )}

        {enEdition && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingBottom: 40 }}>
            {mode === 'guide' && (
              <button onClick={() => setStep('form')} style={{ fontFamily: MONO, fontSize: 14, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '12px 28px', cursor: 'pointer', letterSpacing: '0.1em' }}>← MODIFIER LES CHAMPS</button>
            )}
            <button onClick={() => router.push('/redm/obstetrique/documentation')} style={{ fontFamily: MONO, fontSize: 14, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '12px 28px', cursor: 'pointer', letterSpacing: '0.1em' }}>ANNULER</button>
            <button onClick={save} disabled={!canSave}
              style={{ fontFamily: MONO, fontSize: 15, letterSpacing: '0.14em', padding: '13px 36px', cursor: canSave ? 'pointer' : 'not-allowed', background: canSave ? color + '28' : 'rgba(255,255,255,0.04)', color: canSave ? colorText : T.dim, border: `2px solid ${canSave ? color + '70' : 'rgba(255,255,255,0.08)'}` }}>
              {saving ? '⟳ ENREGISTREMENT...' : '✔ ENREGISTRER & VOIR LE DOCUMENT'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
