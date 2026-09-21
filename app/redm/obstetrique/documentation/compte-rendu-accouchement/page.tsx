'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  DISPLAY, MONO, BODY, T, inp, lbl,
  COL_ACC, rpDate, genAccouchement,
  ACC_SCENARIOS, ACC_EMPTY, type AccFields, type Patiente, type Scenario,
  LIEU_OPTIONS, PRESENTATION_OPTIONS, SEXE_OPTIONS,
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
    <div style={{ fontFamily: BODY, maxWidth: 820, margin: '0 auto' }}>
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

          <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontFamily: MONO, fontSize: 14, color: COL_ACC, letterSpacing: '0.1em', marginBottom: 2 }}>ACCOUCHEMENT</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={lbl}>HEURE</label><input style={inp} value={f.heure} onChange={e => setF(x => ({ ...x, heure: e.target.value }))} placeholder="ex : 14h30" /></div>
              <div><label style={lbl}>DURÉE DU TRAVAIL</label><input style={inp} value={f.duree} onChange={e => setF(x => ({ ...x, duree: e.target.value }))} placeholder="ex : 6 heures" /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div><label style={lbl}>LIEU</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.lieu} onChange={e => setF(x => ({ ...x, lieu: e.target.value }))}>
                  {LIEU_OPTIONS.map(o => <option key={o} value={o}>{o || '—'}</option>)}
                </select>
              </div>
              <div><label style={lbl}>PRÉSENTATION</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.presentation} onChange={e => setF(x => ({ ...x, presentation: e.target.value }))}>
                  {PRESENTATION_OPTIONS.map(o => <option key={o} value={o}>{o || '—'}</option>)}
                </select>
              </div>
              <div><label style={lbl}>SEXE DE L&apos;ENFANT</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={f.sexe} onChange={e => setF(x => ({ ...x, sexe: e.target.value }))}>
                  {SEXE_OPTIONS.map(o => <option key={o} value={o}>{o || '—'}</option>)}
                </select>
              </div>
            </div>
          </div>

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
