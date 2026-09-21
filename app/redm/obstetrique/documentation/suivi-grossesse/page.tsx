'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FormSection, MultiToggle } from '../_components/FormControls';
import {
  DISPLAY, MONO, BODY, T, inp, lbl,
  COL_SUIVI, rpDate, genSuivi, estAlerte,
  SUIVI_SCENARIOS, SUIVI_EMPTY, type SuiviFields, type Patiente, type Scenario,
  SEMAINES_OPTIONS, EVOLUTION_POIDS_OPTIONS, GROSSESSES_ANT_OPTIONS, ACCOUCHEMENTS_ANT_OPTIONS, FC_ANT_OPTIONS,
  ETAT_GENERAL_OPTIONS, APPETIT_OPTIONS, NAUSEES_OPTIONS, VOMISSEMENTS_OPTIONS, VERTIGES_OPTIONS, GONFLEMENT_OPTIONS,
  DOULEURS_OPTIONS, DOULEURS_LOCALISATION_OPTIONS, SAIGNEMENTS_OPTIONS, OUI_NON_OPTIONS, PERTES_OPTIONS,
  MOUVEMENTS_OPTIONS, BATTEMENTS_OPTIONS, CROISSANCE_OPTIONS, PALPATION_OPTIONS, CONTRACTIONS_OPTIONS, POSITION_OPTIONS,
  COMPLICATIONS_OPTIONS, REPOS_OPTIONS, CONTROLE_OPTIONS,
} from '../_lib/shared';

export default function SuiviGrossessePage() {
  const router = useRouter();

  const [patientes, setPatientes] = useState<Patiente[]>([]);
  const [patSearch, setPatSearch] = useState('');
  const [useExisting, setUseExisting] = useState(true);
  const [selectedPat, setSelectedPat] = useState('');
  const [newNom, setNewNom] = useState('');
  const [newPrenom, setNewPrenom] = useState('');
  const [newAge, setNewAge] = useState('');

  const [createTitre, setCreateTitre] = useState('Suivi de grossesse');
  const [createDate, setCreateDate] = useState(() => rpDate());

  const [scenarioId, setScenarioId] = useState('');
  const [f, setF] = useState<SuiviFields>({ ...SUIVI_EMPTY });

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
  const scenario: Scenario | undefined = SUIVI_SCENARIOS.find(s => s.id === scenarioId);
  const canGenerate = (useExisting ? !!selectedPat : !!newNom.trim()) && !!scenarioId;

  function generate() {
    if (!scenario) return;
    const nom = useExisting
      ? (() => { const p = patientes.find(x => x.id === selectedPat); return p ? `${p.patientPrenom} ${p.patientNom}`.trim() : ''; })()
      : `${newPrenom} ${newNom}`.trim();
    const age = useExisting ? (patientes.find(x => x.id === selectedPat)?.patientAge ?? '') : newAge;
    setContenu(genSuivi(nom, age, createDate, f, scenario));
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
        body: JSON.stringify({ patient_id: patientId, type: 'Suivi de grossesse', titre: createTitre.trim() || 'Suivi de grossesse', contenu, date: createDate }),
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
      <div style={{ background: T.card, border: `2px solid ${COL_SUIVI}90`, padding: '56px 44px' }}>
        <div style={{ fontSize: 57, marginBottom: 18 }}>✔</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 33, color: T.gold, marginBottom: 10 }}>Document enregistré</div>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 30 }}>
          <button onClick={() => router.push('/redm/obstetrique/documentation')}
            style={{ fontFamily: MONO, fontSize: 15, letterSpacing: '0.12em', padding: '13px 28px', cursor: 'pointer', background: `${COL_SUIVI}25`, color: '#A8B991', border: `1px solid ${COL_SUIVI}70` }}>
            ← RETOUR À LA DOCUMENTATION
          </button>
          <button onClick={() => window.location.reload()}
            style={{ fontFamily: MONO, fontSize: 15, letterSpacing: '0.12em', padding: '13px 28px', cursor: 'pointer', background: 'rgba(209,183,124,0.15)', color: T.gold, border: '1px solid rgba(209,183,124,0.4)' }}>
            ✚ NOUVEAU SUIVI
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
          <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold, letterSpacing: '0.18em' }}>OBSTÉTRIQUE · DOCUMENTATION · SUIVI DE GROSSESSE</span>
        </div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 38, color: T.gold, margin: 0 }}>🤰 Suivi de grossesse</h1>
        <p style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.1em', marginTop: 10 }}>
          {step === 'form' ? 'CHOISIR UN SCÉNARIO PUIS COMPLÉTER LES INFORMATIONS' : 'RELECTURE AVANT ENREGISTREMENT'}
        </p>
      </div>

      {step === 'form' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* SCÉNARIO — tout en haut */}
          <div style={{ background: T.card, border: `2px solid ${COL_SUIVI}70`, padding: '16px 18px' }}>
            <div style={{ fontFamily: MONO, fontSize: 14, color: COL_SUIVI, letterSpacing: '0.12em', marginBottom: 10 }}>🗂 SCÉNARIO *</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {SUIVI_SCENARIOS.map(s => {
                const on = scenarioId === s.id;
                return (
                  <button key={s.id} type="button" onClick={() => setScenarioId(s.id)}
                    style={{ fontFamily: MONO, fontSize: 14, padding: '9px 12px', cursor: 'pointer', textAlign: 'left', letterSpacing: '0.02em', background: on ? COL_SUIVI + '22' : 'transparent', color: on ? '#A8B991' : T.dim, border: `1px solid ${on ? COL_SUIVI + '90' : T.border}` }}>
                    {s.label}
                  </button>
                );
              })}
            </div>
            {scenario && (
              <div style={{ marginTop: 10, padding: '12px 14px', background: `${COL_SUIVI}18`, border: `1px solid ${COL_SUIVI}60`, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontFamily: MONO, fontSize: 12, color: '#A8B991', letterSpacing: '0.12em' }}>APERÇU — CE QUI SERA PRÉ-REMPLI DANS LE DOCUMENT</div>
                <div style={{ fontFamily: BODY, fontSize: 16, color: T.text, lineHeight: 1.5 }}>{scenario.texte}</div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 4, fontFamily: MONO, fontSize: 12, color: T.dim }}>
                  {scenario.niveauSurveillance && <span>Niveau de surveillance : <b style={{ color: '#A8B991' }}>{scenario.niveauSurveillance}</b></span>}
                  {scenario.reposParDefaut && <span>Repos conseillé ↓ : <b style={{ color: '#A8B991' }}>{scenario.reposParDefaut}</b></span>}
                  {scenario.controleParDefaut && <span>Prochain contrôle ↓ : <b style={{ color: '#A8B991' }}>{scenario.controleParDefaut}</b></span>}
                </div>
              </div>
            )}
            {scenario?.prioritaires && (
              <div style={{ marginTop: 8, padding: '10px 12px', background: 'rgba(139,64,64,0.10)', border: '1px solid rgba(139,64,64,0.4)', fontFamily: MONO, fontSize: 13, color: '#DF9A88', letterSpacing: '0.02em' }}>
                ⚠ Priorité : vérifier en particulier l&apos;état général, les saignements, les douleurs, les contractions, les mouvements de l&apos;enfant et les battements du cœur.
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

          <FormSection icon="🤰" title="GROSSESSE" color={COL_SUIVI} defaultOpen>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={lbl}>SEMAINES DE GROSSESSE</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.semaines} onChange={e => setF(x => ({ ...x, semaines: e.target.value }))}>
                  {SEMAINES_OPTIONS.map(o => <option key={o} value={o}>{o ? `${o} semaines` : '— Sélectionner —'}</option>)}
                </select>
              </div>
              <div><label style={lbl}>HEURE</label><input style={inp} value={f.heure} onChange={e => setF(x => ({ ...x, heure: e.target.value }))} placeholder="ex : 14h30" /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={lbl}>POIDS CONSTATÉ</label><input style={inp} value={f.poids} onChange={e => setF(x => ({ ...x, poids: e.target.value }))} placeholder="ex : 58 kg" /></div>
              <div><label style={lbl}>ÉVOLUTION DU POIDS</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.evolutionPoids} onChange={e => setF(x => ({ ...x, evolutionPoids: e.target.value }))}>
                  {EVOLUTION_POIDS_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
              </div>
            </div>
          </FormSection>

          <FormSection icon="📜" title="ANTÉCÉDENTS" color={COL_SUIVI}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div><label style={lbl}>GROSSESSES ANTÉRIEURES</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.grossessesAnt} onChange={e => setF(x => ({ ...x, grossessesAnt: e.target.value }))}>
                  {GROSSESSES_ANT_OPTIONS.map(o => <option key={o} value={o}>{o || '—'}</option>)}
                </select>
              </div>
              <div><label style={lbl}>ACCOUCHEMENTS ANTÉRIEURS</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.accouchementsAnt} onChange={e => setF(x => ({ ...x, accouchementsAnt: e.target.value }))}>
                  {ACCOUCHEMENTS_ANT_OPTIONS.map(o => <option key={o} value={o}>{o || '—'}</option>)}
                </select>
              </div>
              <div><label style={lbl}>FAUSSES COUCHES ANTÉRIEURES</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.fcAnt} onChange={e => setF(x => ({ ...x, fcAnt: e.target.value }))}>
                  {FC_ANT_OPTIONS.map(o => <option key={o} value={o}>{o || '—'}</option>)}
                </select>
              </div>
            </div>
          </FormSection>

          <FormSection icon="🩺" title="ÉTAT DE LA MÈRE" color={COL_SUIVI} alerte={scenario?.prioritaires?.includes('etatGeneral') || scenario?.prioritaires?.includes('vertiges')}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={lbl}>ÉTAT GÉNÉRAL</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.etatGeneral} onChange={e => setF(x => ({ ...x, etatGeneral: e.target.value }))}>
                  {ETAT_GENERAL_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
              </div>
              <div><label style={lbl}>APPÉTIT</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.appetit} onChange={e => setF(x => ({ ...x, appetit: e.target.value }))}>
                  {APPETIT_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
              </div>
              <div><label style={lbl}>NAUSÉES</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.nausees} onChange={e => setF(x => ({ ...x, nausees: e.target.value }))}>
                  {NAUSEES_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
              </div>
              <div><label style={lbl}>VOMISSEMENTS</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.vomissements} onChange={e => setF(x => ({ ...x, vomissements: e.target.value }))}>
                  {VOMISSEMENTS_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
              </div>
              <div><label style={lbl}>VERTIGES / MALAISES</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.vertiges} onChange={e => setF(x => ({ ...x, vertiges: e.target.value }))}>
                  {VERTIGES_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
              </div>
              <div><label style={lbl}>GONFLEMENT</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.gonflement} onChange={e => setF(x => ({ ...x, gonflement: e.target.value }))}>
                  {GONFLEMENT_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
              </div>
            </div>
          </FormSection>

          <FormSection icon="⚠" title="DOULEURS & SYMPTÔMES" color={COL_SUIVI} alerte={scenario?.prioritaires?.includes('douleurs') || scenario?.prioritaires?.includes('saignements')}>
            <div>
              <label style={lbl}>DOULEURS</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={f.douleurs} onChange={e => setF(x => ({ ...x, douleurs: e.target.value, douleursLocalisation: [], douleursAutre: '' }))}>
                {DOULEURS_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
              </select>
            </div>
            {f.douleurs && f.douleurs !== 'Aucune' && (
              <div>
                <label style={lbl}>LOCALISATION DES DOULEURS</label>
                <MultiToggle options={DOULEURS_LOCALISATION_OPTIONS} value={f.douleursLocalisation} color={COL_SUIVI}
                  onChange={v => setF(x => ({ ...x, douleursLocalisation: v }))} />
                {f.douleursLocalisation.includes('Autre') && (
                  <input style={{ ...inp, marginTop: 8 }} value={f.douleursAutre} onChange={e => setF(x => ({ ...x, douleursAutre: e.target.value }))} placeholder="Précision de la localisation" />
                )}
              </div>
            )}
            <div>
              <label style={lbl}>SAIGNEMENTS</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={f.saignements} onChange={e => setF(x => ({ ...x, saignements: e.target.value, saignementsDepuis: '', saignementsFrequence: '', saignementsDouleurs: '' }))}>
                {SAIGNEMENTS_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
              </select>
            </div>
            {f.saignements && f.saignements !== 'Aucun' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div><label style={lbl}>DEPUIS QUAND ?</label><input style={inp} value={f.saignementsDepuis} onChange={e => setF(x => ({ ...x, saignementsDepuis: e.target.value }))} placeholder="ex : ce matin" /></div>
                <div><label style={lbl}>FRÉQUENCE</label><input style={inp} value={f.saignementsFrequence} onChange={e => setF(x => ({ ...x, saignementsFrequence: e.target.value }))} placeholder="ex : continue" /></div>
                <div><label style={lbl}>DOULEURS ASSOCIÉES</label>
                  <select style={{ ...inp, cursor: 'pointer' }} value={f.saignementsDouleurs} onChange={e => setF(x => ({ ...x, saignementsDouleurs: e.target.value }))}>
                    {OUI_NON_OPTIONS.map(o => <option key={o} value={o}>{o || '—'}</option>)}
                  </select>
                </div>
              </div>
            )}
            <div><label style={lbl}>PERTES INHABITUELLES</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={f.pertesInhabituelles} onChange={e => setF(x => ({ ...x, pertesInhabituelles: e.target.value }))}>
                {PERTES_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
              </select>
            </div>
          </FormSection>

          <FormSection icon="👶" title="EXAMEN DE L'ENFANT" color={COL_SUIVI} alerte={scenario?.prioritaires?.includes('mouvements') || scenario?.prioritaires?.includes('battements') || estAlerte('mouvements', f.mouvements) || estAlerte('contractions', f.contractions)}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={lbl}>MOUVEMENTS DE L&apos;ENFANT</label>
                <select style={{ ...inp, cursor: 'pointer', ...(estAlerte('mouvements', f.mouvements) ? { borderColor: 'rgba(180,70,70,0.6)', color: '#DF9A88' } : {}) }} value={f.mouvements} onChange={e => setF(x => ({ ...x, mouvements: e.target.value }))}>
                  {MOUVEMENTS_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
              </div>
              <div><label style={lbl}>BATTEMENTS DU CŒUR</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.battements} onChange={e => setF(x => ({ ...x, battements: e.target.value }))}>
                  {BATTEMENTS_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
              </div>
              <div><label style={lbl}>CROISSANCE ABDOMINALE</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.croissance} onChange={e => setF(x => ({ ...x, croissance: e.target.value }))}>
                  {CROISSANCE_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
              </div>
              <div><label style={lbl}>PALPATION ABDOMINALE</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.palpation} onChange={e => setF(x => ({ ...x, palpation: e.target.value }))}>
                  {PALPATION_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
              </div>
              <div><label style={lbl}>CONTRACTIONS</label>
                <select style={{ ...inp, cursor: 'pointer', ...(estAlerte('contractions', f.contractions) ? { borderColor: 'rgba(180,70,70,0.6)', color: '#DF9A88' } : {}) }} value={f.contractions} onChange={e => setF(x => ({ ...x, contractions: e.target.value }))}>
                  {CONTRACTIONS_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
              </div>
              <div><label style={lbl}>POSITION ESTIMÉE (PAR PALPATION)</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.position} onChange={e => setF(x => ({ ...x, position: e.target.value }))}>
                  {POSITION_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
              </div>
            </div>
          </FormSection>

          <FormSection icon="🗒" title="COMPLICATIONS" color={COL_SUIVI}>
            <MultiToggle options={COMPLICATIONS_OPTIONS} value={f.complications} color={COL_SUIVI}
              onChange={v => setF(x => ({ ...x, complications: v }))} />
            {f.complications.includes('Autre') && (
              <input style={{ ...inp, marginTop: 8 }} value={f.complicationsAutre} onChange={e => setF(x => ({ ...x, complicationsAutre: e.target.value }))} placeholder="Préciser la complication" />
            )}
          </FormSection>

          <FormSection icon="💊" title="RECOMMANDATIONS" color={COL_SUIVI}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={lbl}>REPOS CONSEILLÉ</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.reposConseille || scenario?.reposParDefaut || ''} onChange={e => setF(x => ({ ...x, reposConseille: e.target.value }))}>
                  {REPOS_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
                {!f.reposConseille && scenario?.reposParDefaut && <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, marginTop: 4 }}>↳ valeur par défaut du scénario, modifiable</div>}
              </div>
              <div><label style={lbl}>PROCHAIN CONTRÔLE</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.prochainControle || scenario?.controleParDefaut || ''} onChange={e => setF(x => ({ ...x, prochainControle: e.target.value }))}>
                  {CONTROLE_OPTIONS.map(o => <option key={o} value={o}>{o || '— Sélectionner —'}</option>)}
                </select>
                {!f.prochainControle && scenario?.controleParDefaut && <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, marginTop: 4 }}>↳ valeur par défaut du scénario, modifiable</div>}
              </div>
            </div>
          </FormSection>

          <button onClick={generate} disabled={!canGenerate}
            style={{ width: '100%', fontFamily: MONO, fontSize: 16, letterSpacing: '0.14em', padding: '15px', cursor: canGenerate ? 'pointer' : 'not-allowed', opacity: canGenerate ? 1 : 0.5, background: `${COL_SUIVI}30`, color: '#A8B991', border: `2px solid ${COL_SUIVI}90`, marginTop: 6, marginBottom: 60 }}>
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
            <textarea style={{ ...inp, resize: 'vertical', minHeight: 520, lineHeight: 1.8, fontSize: 14, padding: '16px' }} value={contenu} onChange={e => setContenu(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStep('form')} style={{ fontFamily: MONO, fontSize: 14, letterSpacing: '0.08em', padding: '14px 18px', cursor: 'pointer', background: 'transparent', color: T.muted, border: `1px solid ${T.border}` }}>
              ← MODIFIER LES CHAMPS
            </button>
            <button onClick={save} disabled={saving}
              style={{ flex: 1, fontFamily: MONO, fontSize: 16, letterSpacing: '0.14em', padding: '14px', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1, background: `${COL_SUIVI}30`, color: '#A8B991', border: `2px solid ${COL_SUIVI}90` }}>
              {saving ? '⟳ ENREGISTREMENT…' : '✔ ENREGISTRER LE DOCUMENT'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
