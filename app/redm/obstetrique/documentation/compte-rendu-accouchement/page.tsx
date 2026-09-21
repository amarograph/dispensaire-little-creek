'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FormSection, MultiToggle } from '../_components/FormControls';
import {
  DISPLAY, MONO, BODY, T, inp, lbl,
  COL_ACC, rpDate, genAccouchement,
  ACC_SCENARIOS, ACC_EMPTY, type AccFields, type Patiente, type Scenario,
  LIEU_OPTIONS, TERME_OPTIONS, DEBUT_TRAVAIL_OPTIONS, CONTRACTIONS_TRAVAIL_OPTIONS, RUPTURE_EAUX_OPTIONS,
  PRESENTATION_OPTIONS, PROGRESSION_OPTIONS, TYPE_ACCOUCHEMENT_OPTIONS, GESTES_OPTIONS,
  COMPLICATIONS_ACC_OPTIONS, PERTES_SANGUINES_OPTIONS, DELIVRANCE_OPTIONS, SEXE_OPTIONS,
  ETAT_NAISSANCE_OPTIONS, RESPIRATION_NE_OPTIONS, CRIS_OPTIONS, COLORATION_OPTIONS, MOUVEMENTS_NE_OPTIONS,
  SOINS_IMMEDIATS_OPTIONS, ETAT_GENERAL_MERE_OPTIONS, CONSCIENCE_OPTIONS, SAIGNEMENTS_MERE_OPTIONS, LESIONS_OPTIONS,
  SURVEILLANCE_MERE_OPTIONS, SURVEILLANCE_ENFANT_OPTIONS,
} from '../_lib/shared';

export default function CompteRenduAccouchementPage() {
  const router = useRouter();

  const [patientes, setPatientes] = useState<Patiente[]>([]);
  const [patSearch, setPatSearch] = useState('');
  const [useExisting, setUseExisting] = useState(true);
  const [selectedPat, setSelectedPat] = useState('');
  const [newNom, setNewNom] = useState('');
  const [newPrenom, setNewPrenom] = useState('');
  const [newAge, setNewAge] = useState('');

  const [createTitre, setCreateTitre] = useState("Compte-rendu d'accouchement");
  const [createDate, setCreateDate] = useState(() => rpDate());

  const [scenarioId, setScenarioId] = useState('');
  const [f, setF] = useState<AccFields>({ ...ACC_EMPTY });

  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [contenu, setContenu] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/obstetrique/dossiers')
      .then(r => r.ok ? r.json() : { dossiers: [] })
      .then(data => { const list: Patiente[] = data.dossiers ?? []; setPatientes(list); if (list[0]) setSelectedPat(list[0].id); })
      .catch(() => {});
  }, []);

  const filteredPats = patientes.filter(p => `${p.patientPrenom} ${p.patientNom}`.toLowerCase().includes(patSearch.toLowerCase()));
  const scenario: Scenario | undefined = ACC_SCENARIOS.find(s => s.id === scenarioId);
  const canGenerate = (useExisting ? !!selectedPat : !!newNom.trim()) && !!scenarioId;

  function generate() {
    if (!scenario) return;
    const nom = useExisting
      ? (() => { const p = patientes.find(x => x.id === selectedPat); return p ? `${p.patientPrenom} ${p.patientNom}`.trim() : ''; })()
      : `${newPrenom} ${newNom}`.trim();
    const age = useExisting ? (patientes.find(x => x.id === selectedPat)?.patientAge ?? '') : newAge;
    setContenu(genAccouchement(nom, age, createDate, f, scenario));
    setStep('preview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      let patientId = '';
      if (useExisting) {
        if (!selectedPat) return;
        patientId = selectedPat;
      } else {
        if (!newNom.trim()) return;
        const r = await fetch('/api/obstetrique/dossiers', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patientNom: newNom.trim(), patientPrenom: newPrenom.trim(), patientAge: newAge, dateConsult: createDate, type: 'Première consultation', statut: 'EN COURS' }),
        });
        if (!r.ok) return;
        const d = await r.json();
        patientId = d.dossier.id;
      }
      const r = await fetch('/api/obstetrique/documents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patientId, type: "Compte-rendu d'accouchement", titre: createTitre.trim() || "Compte-rendu d'accouchement", contenu, date: createDate }),
      });
      if (!r.ok) return;
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (saved) return (
    <div style={{ fontFamily: BODY, maxWidth: 640, margin: '80px auto', textAlign: 'center' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');`}</style>
      <div style={{ background: T.card, border: `2px solid ${COL_ACC}90`, padding: '56px 44px' }}>
        <div style={{ fontSize: 57, marginBottom: 18 }}>✔</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 33, color: T.gold, marginBottom: 10 }}>Document enregistré</div>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 30 }}>
          <button onClick={() => router.push('/redm/obstetrique/documentation')}
            style={{ fontFamily: MONO, fontSize: 15, letterSpacing: '0.12em', padding: '13px 28px', cursor: 'pointer', background: `${COL_ACC}25`, color: '#8899CC', border: `1px solid ${COL_ACC}70` }}>
            ← RETOUR À LA DOCUMENTATION
          </button>
          <button onClick={() => window.location.reload()}
            style={{ fontFamily: MONO, fontSize: 15, letterSpacing: '0.12em', padding: '13px 28px', cursor: 'pointer', background: 'rgba(209,183,124,0.15)', color: T.gold, border: '1px solid rgba(209,183,124,0.4)' }}>
            ✚ NOUVEAU COMPTE-RENDU
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: BODY, maxWidth: 1100, margin: '0 auto' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');`}</style>

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <button onClick={() => step === 'preview' ? setStep('form') : router.push('/redm/obstetrique/documentation')}
            style={{ fontFamily: MONO, fontSize: 15, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '9px 20px', cursor: 'pointer', letterSpacing: '0.1em' }}>
            {step === 'preview' ? '← MODIFIER LES CHAMPS' : '← RETOUR'}
          </button>
          <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold, letterSpacing: '0.18em' }}>OBSTÉTRIQUE · DOCUMENTATION · COMPTE-RENDU D&apos;ACCOUCHEMENT</span>
        </div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 38, color: T.gold, margin: 0 }}>👶 Compte-rendu d&apos;accouchement</h1>
        <p style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.1em', marginTop: 10 }}>
          {step === 'form' ? 'CHOISIR UN SCÉNARIO PUIS COMPLÉTER LES INFORMATIONS' : 'RELECTURE AVANT ENREGISTREMENT'}
        </p>
      </div>

      {step === 'form' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* SCÉNARIO — tout en haut */}
          <div style={{ background: T.card, border: `2px solid ${COL_ACC}70`, padding: '16px 18px' }}>
            <div style={{ fontFamily: MONO, fontSize: 14, color: COL_ACC, letterSpacing: '0.12em', marginBottom: 10 }}>🗂 SCÉNARIO *</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ACC_SCENARIOS.map(s => {
                const on = scenarioId === s.id;
                return (
                  <button key={s.id} type="button" onClick={() => setScenarioId(s.id)}
                    style={{ fontFamily: MONO, fontSize: 14, padding: '9px 12px', cursor: 'pointer', textAlign: 'left', letterSpacing: '0.02em', background: on ? COL_ACC + '22' : 'transparent', color: on ? '#8899CC' : T.dim, border: `1px solid ${on ? COL_ACC + '90' : T.border}` }}>
                    {s.label}
                  </button>
                );
              })}
            </div>
            {scenario && (
              <div style={{ marginTop: 10, padding: '12px 14px', background: `${COL_ACC}18`, border: `1px solid ${COL_ACC}60`, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontFamily: MONO, fontSize: 12, color: '#8899CC', letterSpacing: '0.12em' }}>APERÇU — ISSUE QUI SERA INSCRITE DANS LE DOCUMENT</div>
                <div style={{ fontFamily: BODY, fontSize: 16, color: T.text, lineHeight: 1.5 }}>{scenario.texte}</div>
                <div style={{ fontFamily: MONO, fontSize: 12, color: T.dim, marginTop: 2 }}>↳ tous les champs ci-dessous sont pré-remplis selon ce scénario — modifiez ce qui doit l&apos;être.</div>
              </div>
            )}
            {scenario?.prioritaires && (
              <div style={{ marginTop: 8, padding: '10px 12px', background: 'rgba(139,64,64,0.10)', border: '1px solid rgba(139,64,64,0.4)', fontFamily: MONO, fontSize: 13, color: '#DF9A88', letterSpacing: '0.02em' }}>
                ⚠ Issue grave — vérifier en particulier l&apos;état général de la mère, les saignements/pertes sanguines et l&apos;état du nouveau-né avant d&apos;enregistrer.
              </div>
            )}
          </div>

          {/* PATIENTE */}
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
                <select style={{ ...inp, cursor: 'pointer' }} size={Math.min(5, filteredPats.length + 1)} value={selectedPat} onChange={e => setSelectedPat(e.target.value)}>
                  {filteredPats.length === 0
                    ? <option disabled>Aucune patiente trouvée</option>
                    : filteredPats.map(p => <option key={p.id} value={p.id}>{p.patientPrenom} {p.patientNom}{p.patientAge ? ` — ${p.patientAge} ans` : ''}</option>)}
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

          {/* DOCUMENT */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
            <div><label style={lbl}>TITRE DU DOCUMENT</label><input style={inp} value={createTitre} onChange={e => setCreateTitre(e.target.value)} /></div>
            <div><label style={lbl}>DATE</label><input style={{ ...inp, width: 150 }} value={createDate} onChange={e => setCreateDate(e.target.value)} placeholder="JJ/MM/AAAA" /></div>
          </div>

          <FormSection icon="🕐" title="NAISSANCE — REPÈRES" color={COL_ACC}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div><label style={lbl}>HEURE DE LA NAISSANCE</label><input style={inp} value={f.heureNaissance} onChange={e => setF(x => ({ ...x, heureNaissance: e.target.value }))} placeholder="ex : 14h30" /></div>
              <div><label style={lbl}>LIEU</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.lieu} onChange={e => setF(x => ({ ...x, lieu: e.target.value }))}>
                  {LIEU_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
              </div>
              <div><label style={lbl}>DÉBUT DU TRAVAIL (HEURE)</label><input style={inp} value={f.debutTravailHeure} onChange={e => setF(x => ({ ...x, debutTravailHeure: e.target.value }))} placeholder="ex : 09h00" /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div><label style={lbl}>TERME</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.terme} onChange={e => setF(x => ({ ...x, terme: e.target.value }))}>
                  {TERME_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
              </div>
              {f.terme === 'Prématuré' && (
                <div><label style={lbl}>SEMAINES</label><input style={inp} value={f.termeSemaines} onChange={e => setF(x => ({ ...x, termeSemaines: e.target.value }))} placeholder="ex : 34" /></div>
              )}
              <div><label style={lbl}>DURÉE APPROXIMATIVE DU TRAVAIL</label><input style={inp} value={f.dureeTravail} onChange={e => setF(x => ({ ...x, dureeTravail: e.target.value }))} placeholder="ex : 6 heures" /></div>
            </div>
          </FormSection>

          <FormSection icon="🌀" title="DÉROULEMENT DU TRAVAIL" color={COL_ACC}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={lbl}>DÉBUT DU TRAVAIL</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.debutTravail || scenario?.accDebutTravail || ''} onChange={e => setF(x => ({ ...x, debutTravail: e.target.value }))}>
                  {DEBUT_TRAVAIL_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
                {!f.debutTravail && scenario?.accDebutTravail && <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, marginTop: 4 }}>↳ valeur par défaut du scénario, modifiable</div>}
                {(f.debutTravail || scenario?.accDebutTravail) === 'Autre' && (
                  <input style={{ ...inp, marginTop: 8 }} value={f.debutTravailAutre} onChange={e => setF(x => ({ ...x, debutTravailAutre: e.target.value }))} placeholder="Précision" />
                )}
              </div>
              <div><label style={lbl}>CONTRACTIONS</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.contractions || scenario?.accContractions || ''} onChange={e => setF(x => ({ ...x, contractions: e.target.value }))}>
                  {CONTRACTIONS_TRAVAIL_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
              </div>
              <div><label style={lbl}>RUPTURE DES EAUX</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.ruptureEaux || scenario?.accRuptureEaux || ''} onChange={e => setF(x => ({ ...x, ruptureEaux: e.target.value }))}>
                  {RUPTURE_EAUX_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
              </div>
              <div><label style={lbl}>PRÉSENTATION DE L&apos;ENFANT</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.presentation || scenario?.accPresentation || ''} onChange={e => setF(x => ({ ...x, presentation: e.target.value }))}>
                  {PRESENTATION_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
              </div>
              <div><label style={lbl}>PROGRESSION</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.progression || scenario?.accProgression || ''} onChange={e => setF(x => ({ ...x, progression: e.target.value }))}>
                  {PROGRESSION_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
              </div>
            </div>
            <div><label style={lbl}>OBSERVATIONS</label>
              <textarea style={{ ...inp, resize: 'vertical', minHeight: 70 }} value={f.observationsTravail || scenario?.accObservationsTravail || ''} onChange={e => setF(x => ({ ...x, observationsTravail: e.target.value }))} />
            </div>
          </FormSection>

          <FormSection icon="👶" title="ACCOUCHEMENT" color={COL_ACC}>
            <div>
              <label style={lbl}>TYPE D&apos;ACCOUCHEMENT</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={f.typeAccouchement || scenario?.accType || ''} onChange={e => setF(x => ({ ...x, typeAccouchement: e.target.value }))}>
                {TYPE_ACCOUCHEMENT_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>GESTES RÉALISÉS</label>
              <MultiToggle options={GESTES_OPTIONS} color={COL_ACC}
                value={f.gestesRealises.length ? f.gestesRealises : (scenario?.accGestes ?? [])}
                onChange={v => setF(x => ({ ...x, gestesRealises: v }))} />
              {f.gestesRealises.includes('Autre') && (
                <input style={{ ...inp, marginTop: 8 }} value={f.gestesAutre} onChange={e => setF(x => ({ ...x, gestesAutre: e.target.value }))} placeholder="Préciser le geste" />
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={lbl}>COMPLICATIONS</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.complications || scenario?.accComplications || ''} onChange={e => setF(x => ({ ...x, complications: e.target.value }))}>
                  {COMPLICATIONS_ACC_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
                {(f.complications || scenario?.accComplications) === 'À préciser' && (
                  <input style={{ ...inp, marginTop: 8 }} value={f.complicationsDetail || scenario?.accComplicationsDetail || ''} onChange={e => setF(x => ({ ...x, complicationsDetail: e.target.value }))} placeholder="Préciser la complication" />
                )}
              </div>
              <div><label style={lbl}>PERTES SANGUINES</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.pertesSanguines || scenario?.accPertesSanguines || ''} onChange={e => setF(x => ({ ...x, pertesSanguines: e.target.value }))}>
                  {PERTES_SANGUINES_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
              </div>
            </div>
            <div><label style={lbl}>DÉLIVRANCE DU PLACENTA</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={f.delivrance || scenario?.accDelivrance || ''} onChange={e => setF(x => ({ ...x, delivrance: e.target.value }))}>
                {DELIVRANCE_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
              </select>
              {(f.delivrance || scenario?.accDelivrance) === 'À préciser' && (
                <input style={{ ...inp, marginTop: 8 }} value={f.delivranceDetail} onChange={e => setF(x => ({ ...x, delivranceDetail: e.target.value }))} placeholder="Préciser" />
              )}
            </div>
          </FormSection>

          <FormSection icon="🍼" title="NOUVEAU-NÉ" color={COL_ACC} alerte={scenario?.prioritaires?.includes('etatNaissance')}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div><label style={lbl}>SEXE</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.sexe} onChange={e => setF(x => ({ ...x, sexe: e.target.value }))}>
                  {SEXE_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
              </div>
              <div><label style={lbl}>ÉTAT À LA NAISSANCE</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.etatNaissance || scenario?.accEtatNaissance || ''} onChange={e => setF(x => ({ ...x, etatNaissance: e.target.value }))}>
                  {ETAT_NAISSANCE_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
              </div>
              <div><label style={lbl}>RESPIRATION</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.respiration || scenario?.accRespiration || ''} onChange={e => setF(x => ({ ...x, respiration: e.target.value }))}>
                  {RESPIRATION_NE_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
              </div>
              <div><label style={lbl}>CRIS</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.cris || scenario?.accCris || ''} onChange={e => setF(x => ({ ...x, cris: e.target.value }))}>
                  {CRIS_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
              </div>
              <div><label style={lbl}>COLORATION</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.coloration || scenario?.accColoration || ''} onChange={e => setF(x => ({ ...x, coloration: e.target.value }))}>
                  {COLORATION_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
              </div>
              <div><label style={lbl}>MOUVEMENTS</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.mouvementsNe || scenario?.accMouvements || ''} onChange={e => setF(x => ({ ...x, mouvementsNe: e.target.value }))}>
                  {MOUVEMENTS_NE_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={lbl}>SOINS IMMÉDIATS</label>
              <MultiToggle options={SOINS_IMMEDIATS_OPTIONS} color={COL_ACC}
                value={f.soinsImmediats.length ? f.soinsImmediats : (scenario?.accSoinsImmediats ?? [])}
                onChange={v => setF(x => ({ ...x, soinsImmediats: v }))} />
              {f.soinsImmediats.includes('Autre') && (
                <input style={{ ...inp, marginTop: 8 }} value={f.soinsAutre} onChange={e => setF(x => ({ ...x, soinsAutre: e.target.value }))} placeholder="Préciser le soin" />
              )}
            </div>
          </FormSection>

          <FormSection icon="🩺" title="ÉTAT DE LA MÈRE APRÈS L'ACCOUCHEMENT" color={COL_ACC} alerte={scenario?.prioritaires?.includes('etatGeneralMere') || scenario?.prioritaires?.includes('saignementsMere') || scenario?.prioritaires?.includes('pertesSanguines')}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={lbl}>ÉTAT GÉNÉRAL</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.etatGeneralMere || scenario?.accEtatGeneralMere || ''} onChange={e => setF(x => ({ ...x, etatGeneralMere: e.target.value }))}>
                  {ETAT_GENERAL_MERE_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
              </div>
              <div><label style={lbl}>CONSCIENCE</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.conscience || scenario?.accConscience || ''} onChange={e => setF(x => ({ ...x, conscience: e.target.value }))}>
                  {CONSCIENCE_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
              </div>
              <div><label style={lbl}>SAIGNEMENTS</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.saignementsMere || scenario?.accSaignementsMere || ''} onChange={e => setF(x => ({ ...x, saignementsMere: e.target.value }))}>
                  {SAIGNEMENTS_MERE_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
              </div>
              <div><label style={lbl}>LÉSIONS LIÉES À L&apos;ACCOUCHEMENT</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.lesions} onChange={e => setF(x => ({ ...x, lesions: e.target.value }))}>
                  {LESIONS_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
                {f.lesions === 'Autre' && (
                  <input style={{ ...inp, marginTop: 8 }} value={f.lesionsAutre} onChange={e => setF(x => ({ ...x, lesionsAutre: e.target.value }))} placeholder="Préciser" />
                )}
              </div>
            </div>
            <div><label style={lbl}>SOINS EFFECTUÉS</label>
              <textarea style={{ ...inp, resize: 'vertical', minHeight: 70 }} value={f.soinsEffectues || scenario?.accSoinsEffectues || ''} onChange={e => setF(x => ({ ...x, soinsEffectues: e.target.value }))} />
            </div>
          </FormSection>

          <FormSection icon="🗒" title="SURVEILLANCE POST-ACCOUCHEMENT" color={COL_ACC}>
            <div>
              <label style={lbl}>MÈRE</label>
              <MultiToggle options={SURVEILLANCE_MERE_OPTIONS} color={COL_ACC}
                value={f.surveillanceMere.length ? f.surveillanceMere : (scenario?.accSurveillanceMere ?? [])}
                onChange={v => setF(x => ({ ...x, surveillanceMere: v }))} />
              {f.surveillanceMere.includes('Autre') && (
                <input style={{ ...inp, marginTop: 8 }} value={f.surveillanceMereAutre} onChange={e => setF(x => ({ ...x, surveillanceMereAutre: e.target.value }))} placeholder="Préciser" />
              )}
            </div>
            <div>
              <label style={lbl}>ENFANT</label>
              <MultiToggle options={SURVEILLANCE_ENFANT_OPTIONS} color={COL_ACC}
                value={f.surveillanceEnfant.length ? f.surveillanceEnfant : (scenario?.accSurveillanceEnfant ?? [])}
                onChange={v => setF(x => ({ ...x, surveillanceEnfant: v }))} />
              {f.surveillanceEnfant.includes('Autre') && (
                <input style={{ ...inp, marginTop: 8 }} value={f.surveillanceEnfantAutre} onChange={e => setF(x => ({ ...x, surveillanceEnfantAutre: e.target.value }))} placeholder="Préciser" />
              )}
            </div>
          </FormSection>

          {scenario?.id === 'perte_mere' && (
            <FormSection icon="✝" title="DÉCÈS CONSTATÉ" color={COL_ACC} alerte>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={lbl}>DATE</label><input style={inp} value={f.dateDeces} onChange={e => setF(x => ({ ...x, dateDeces: e.target.value }))} placeholder="JJ/MM/1890" /></div>
                <div><label style={lbl}>HEURE</label><input style={inp} value={f.heureDeces} onChange={e => setF(x => ({ ...x, heureDeces: e.target.value }))} placeholder="HHhMM" /></div>
              </div>
              <div><label style={lbl}>CAUSE APPARENTE</label>
                <textarea style={{ ...inp, resize: 'vertical', minHeight: 60 }} value={f.causeDeces} onChange={e => setF(x => ({ ...x, causeDeces: e.target.value }))} placeholder="À préciser selon les constatations médicales" />
              </div>
            </FormSection>
          )}

          <FormSection icon="📝" title="CONCLUSION" color={COL_ACC}>
            <textarea style={{ ...inp, resize: 'vertical', minHeight: 100 }} value={f.conclusion || scenario?.accConclusion || ''} onChange={e => setF(x => ({ ...x, conclusion: e.target.value }))} />
          </FormSection>

          <button onClick={generate} disabled={!canGenerate}
            style={{ width: '100%', fontFamily: MONO, fontSize: 16, letterSpacing: '0.14em', padding: '15px', cursor: canGenerate ? 'pointer' : 'not-allowed', opacity: canGenerate ? 1 : 0.5, background: `${COL_ACC}30`, color: '#8899CC', border: `2px solid ${COL_ACC}90`, marginTop: 6, marginBottom: 60 }}>
            GÉNÉRER LE DOCUMENT →
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 60 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
            <div><label style={lbl}>TITRE DU DOCUMENT</label><input style={inp} value={createTitre} onChange={e => setCreateTitre(e.target.value)} /></div>
            <div><label style={lbl}>DATE</label><input style={{ ...inp, width: 150 }} value={createDate} onChange={e => setCreateDate(e.target.value)} placeholder="JJ/MM/AAAA" /></div>
          </div>
          <div>
            <label style={lbl}>DOCUMENT GÉNÉRÉ — MODIFIEZ CE QUI EST NÉCESSAIRE AVANT D&apos;ENREGISTRER</label>
            <textarea style={{ ...inp, resize: 'vertical', minHeight: 400, lineHeight: 1.8, fontSize: 14, padding: '16px' }} value={contenu} onChange={e => setContenu(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStep('form')} style={{ fontFamily: MONO, fontSize: 14, letterSpacing: '0.08em', padding: '14px 18px', cursor: 'pointer', background: 'transparent', color: T.muted, border: `1px solid ${T.border}` }}>
              ← MODIFIER LES CHAMPS
            </button>
            <button onClick={save} disabled={saving}
              style={{ flex: 1, fontFamily: MONO, fontSize: 16, letterSpacing: '0.14em', padding: '14px', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1, background: `${COL_ACC}30`, color: '#8899CC', border: `2px solid ${COL_ACC}90` }}>
              {saving ? '⟳ ENREGISTREMENT…' : '✔ ENREGISTRER LE DOCUMENT'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
