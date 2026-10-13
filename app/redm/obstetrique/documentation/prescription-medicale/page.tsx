'use client';

import { useState } from 'react';
import { ObsDocEditor } from '../_components/ObsDocEditor';
import {
  DISPLAY, MONO, BODY, T, inp, lbl,
  COL_RX, rpDate, genRx,
  RX_SCENARIOS, RX_EMPTY, type RxFields, type Patiente, type Scenario,
} from '../_lib/shared';

/* Modèle du mode « rédaction libre » */
const LIBRE_TEMPLATE = "PRESCRIPTION MÉDICALE\nDispensaire de Little Creek — Obstétrique\nAnnée 1890\n\nPatiente\nNom et prénom : [Nom de la patiente]\n\n──────────────────────────────────────\n\nRemède : [Nom du remède]\n\nÀ consommer en cas de :\n[Indication / symptômes]\n\nPréparation :\n[Infusion, décoction…]\n\nPosologie :\n• [Consigne de prise]\n• [Consigne de prise]\n\nDurée du traitement :\n[Durée]\n\n──────────────────────────────────────\n\nConsignes complémentaires\n\nRepos et calme recommandés durant :\n[Durée]\n\nÉviter toute consommation de :\n[Alcool / tabac / autre]\n\nÉviter :\n[Efforts, situations à risque]\n\nNoter tout épisode d'aggravation :\n• [Symptôme]\n• [Symptôme]\n\n──────────────────────────────────────\n\nSuivi\n\nUn nouvel examen est requis dans [durée],\nou immédiatement en cas de :\n[Aggravation / symptôme critique]";

export default function PrescriptionMedicalePage() {
  const [scenarioId, setScenarioId] = useState('');
  const [f, setF] = useState<RxFields>({ ...RX_EMPTY });
  const scenario: Scenario | undefined = RX_SCENARIOS.find(s => s.id === scenarioId);
  const canGenerate = !!scenarioId;

  return (
    <ObsDocEditor
      type="Prescription médicale" icon="💊" color={COL_RX} colorText="#D8A870"
      nouveauLabel="✚ NOUVELLE PRESCRIPTION"
      libreTemplate={LIBRE_TEMPLATE}
      canGenerate={canGenerate}
      generate={(nom, age, date) => scenario ? genRx(nom, age, date, f, scenario) : ''}
      guidedTop={<>
          {/* SCÉNARIO — tout en haut */}
          <div style={{ background: T.card, border: `2px solid ${COL_RX}70`, padding: '16px 18px' }}>
            <div style={{ fontFamily: MONO, fontSize: 14, color: COL_RX, letterSpacing: '0.12em', marginBottom: 10 }}>🗂 SCÉNARIO *</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {RX_SCENARIOS.map(s => {
                const on = scenarioId === s.id;
                return (
                  <button key={s.id} type="button" onClick={() => setScenarioId(s.id)}
                    style={{ fontFamily: MONO, fontSize: 14, padding: '9px 12px', cursor: 'pointer', textAlign: 'left', letterSpacing: '0.02em', background: on ? COL_RX + '22' : 'transparent', color: on ? '#D8A870' : T.dim, border: `1px solid ${on ? COL_RX + '90' : T.border}` }}>
                    {s.label}
                  </button>
                );
              })}
            </div>
            {scenario && scenario.id !== 'autre' && (
              <div style={{ marginTop: 10, padding: '12px 14px', background: `${COL_RX}18`, border: `1px solid ${COL_RX}60`, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontFamily: MONO, fontSize: 12, color: '#D8A870', letterSpacing: '0.12em' }}>APERÇU — CE QUI SERA PRÉ-REMPLI DANS LE DOCUMENT</div>
                <div style={{ fontFamily: BODY, fontSize: 16, color: T.text, lineHeight: 1.5 }}>{scenario.texte}</div>
                {scenario.remedeNom && (
                  <div style={{ fontFamily: MONO, fontSize: 12, color: T.dim, marginTop: 4 }}>
                    Remède : <b style={{ color: '#D8A870' }}>{scenario.remedeNom}</b>{scenario.remedeDuree ? ` — ${scenario.remedeDuree}` : ''}
                  </div>
                )}
              </div>
            )}
          </div>
      </>}
      guidedFields={<>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontFamily: MONO, fontSize: 14, color: COL_RX, letterSpacing: '0.1em', marginBottom: 2 }}>PRESCRIPTION</div>
            <div><label style={lbl}>INDICATION / PRÉCISIONS</label><input style={inp} value={f.indication} onChange={e => setF(x => ({ ...x, indication: e.target.value }))} placeholder="Précision optionnelle en plus du scénario" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={lbl}>REMÈDE</label><input style={inp} value={f.remedeNom || scenario?.remedeNom || ''} onChange={e => setF(x => ({ ...x, remedeNom: e.target.value }))} placeholder="ex : Décoction de framboisier" />
                {!f.remedeNom && scenario?.remedeNom && <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, marginTop: 4 }}>↳ valeur par défaut du scénario, modifiable</div>}
              </div>
              <div><label style={lbl}>PRÉPARATION</label><input style={inp} value={f.preparation || scenario?.remedePreparation || ''} onChange={e => setF(x => ({ ...x, preparation: e.target.value }))} placeholder="ex : Infusion légère" /></div>
            </div>
            <div><label style={lbl}>POSOLOGIE</label>
              <textarea style={{ ...inp, resize: 'vertical', minHeight: 70 }} value={f.posologie || (scenario?.remedePosologie?.join('\n') ?? '')} onChange={e => setF(x => ({ ...x, posologie: e.target.value }))} placeholder="Une ligne par consigne" />
            </div>
            <div><label style={lbl}>DURÉE</label><input style={inp} value={f.duree || scenario?.remedeDuree || ''} onChange={e => setF(x => ({ ...x, duree: e.target.value }))} placeholder="ex : Trois jours" /></div>
          </div>
      </>}
    />
  );
}
