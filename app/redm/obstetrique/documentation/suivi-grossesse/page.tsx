'use client';

import { useState } from 'react';
import { ObsDocEditor } from '../_components/ObsDocEditor';
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

/* Modèle du mode « rédaction libre » */
const LIBRE_TEMPLATE = "SUIVI DE GROSSESSE\nDispensaire de Little Creek — Obstétrique\nAnnée 1890\n\nPATIENTE\nNom et prénom : [Nom de la patiente]\nÂge : [Âge]\nTerme estimé : [Semaines / mois de grossesse]\n\nANTÉCÉDENTS\nGrossesses précédentes : [Nombre]\nAccouchements précédents : [Nombre]\nFausses couches : [Nombre]\n\nMOTIF DE LA CONSULTATION\n[Raison de la consultation prénatale]\n\nÉTAT GÉNÉRAL\n• État général : [Très bon / Bon / Fatiguée / Affaiblie]\n• Appétit : [État]\n• Nausées et vomissements : [État]\n• Vertiges et gonflements : [État]\n\nSYMPTÔMES SIGNALÉS\n• Douleurs : [Localisation / intensité]\n• Saignements : [Aucun / traces légères / importants]\n• Pertes : [Aucune / légères / à examiner]\n\nEXAMEN\n• Mouvements de l'enfant : [Perçus, réguliers / diminués]\n• Battements : [Perçus, réguliers / irréguliers]\n• Croissance : [Conforme au terme estimé / à surveiller]\n• Palpation abdominale : [Souple et indolore / sensible]\n• Contractions : [Aucune / occasionnelles / régulières]\n• Position de l'enfant : [Tête vers le bas / siège / autre]\n\nCOMPLICATIONS ÉVENTUELLES\n[Aucune / À préciser]\n\nCONDUITE À TENIR\n• Repos : [Habituel / modéré / strict]\n• Recommandations : [Alimentation, hydratation, activité]\n• Surveiller : [Symptômes d'alerte]\n\nPROCHAIN CONTRÔLE\nDans [délai], ou immédiatement en cas de :\n[Aggravation / symptôme inquiétant]\n\nCONCLUSION DU PRATICIEN\n[Appréciation générale de la grossesse]";

export default function SuiviGrossessePage() {
  const [scenarioId, setScenarioId] = useState('');
  const [f, setF] = useState<SuiviFields>({ ...SUIVI_EMPTY });
  const scenario: Scenario | undefined = SUIVI_SCENARIOS.find(s => s.id === scenarioId);
  const canGenerate = !!scenarioId;

  return (
    <ObsDocEditor
      type="Suivi de grossesse" icon="🤰" color={COL_SUIVI} colorText="#A8B991"
      nouveauLabel="✚ NOUVEAU SUIVI"
      libreTemplate={LIBRE_TEMPLATE}
      canGenerate={canGenerate}
      generate={(nom, age, date) => scenario ? genSuivi(nom, age, date, f, scenario) : ''}
      guidedTop={<>
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
      </>}
      guidedFields={<>
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
      </>}
    />
  );
}
