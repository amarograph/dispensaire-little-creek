'use client';

import { useState } from 'react';
import { ObsDocEditor } from '../_components/ObsDocEditor';
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

/* Modèle du mode « rédaction libre » */
const LIBRE_TEMPLATE = "COMPTE-RENDU D'ACCOUCHEMENT\nDispensaire de Little Creek — Obstétrique\nAnnée 1890\n\nPATIENTE\nNom et prénom : [Nom de la patiente]\nÂge : [Âge]\n\nACCOUCHEMENT\nLieu : [Dispensaire de Little Creek / Domicile / Autre]\nDate et heure de naissance : [Date — heure]\nTerme : [À terme / Prématuré — semaines]\n\nDÉROULEMENT DU TRAVAIL\n• Début du travail : [Spontané / autre]\n• Contractions : [Régulières / irrégulières / faibles / fortes]\n• Rupture des eaux : [Spontanée / durant le travail]\n• Présentation de l'enfant : [Tête / siège / transversale]\n• Progression : [Normale / lente / difficile]\n\nACCOUCHEMENT\n• Type : [Naturel / assisté / intervention nécessaire]\n• Gestes réalisés : [Soutien, positionnement, aide à la délivrance…]\n• Complications : [Aucune / à préciser]\n• Pertes sanguines : [Faibles / modérées / importantes]\n• Délivrance : [Complète / difficile / incomplète]\n\nLE NOUVEAU-NÉ\n• Sexe : [Fille / garçon]\n• État à la naissance : [Vigoureux / faible]\n• Respiration : [Régulière / faible / difficile]\n• Cris : [Immédiats / retardés / faibles]\n• Coloration : [Satisfaisante / pâle / bleutée]\n• Soins immédiats : [Séchage, maintien au chaud, soin du cordon…]\n\nÉTAT DE LA MÈRE\n• État général : [Bon / satisfaisant / fatiguée / affaiblie]\n• Conscience : [Claire / fatiguée / confuse]\n• Saignements : [Normaux / à surveiller / importants]\n• Lésions : [Aucune / déchirure légère / importante]\n\nSURVEILLANCE ET SOINS POST-NATALS\n[Surveillance de la mère et de l'enfant, repos, hydratation, alimentation]\n\nCONCLUSION DU PRATICIEN\n[Issue de l'accouchement et recommandations]";

export default function CompteRenduAccouchementPage() {
  const [scenarioId, setScenarioId] = useState('');
  const [f, setF] = useState<AccFields>({ ...ACC_EMPTY });
  const scenario: Scenario | undefined = ACC_SCENARIOS.find(s => s.id === scenarioId);
  const canGenerate = !!scenarioId;

  return (
    <ObsDocEditor
      type="Compte-rendu d'accouchement" icon="👶" color={COL_ACC} colorText="#8899CC"
      nouveauLabel="✚ NOUVEAU COMPTE-RENDU"
      libreTemplate={LIBRE_TEMPLATE}
      canGenerate={canGenerate}
      generate={(nom, age, date) => scenario ? genAccouchement(nom, age, date, f, scenario) : ''}
      guidedTop={<>
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
      </>}
      guidedFields={<>
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
      </>}
    />
  );
}
