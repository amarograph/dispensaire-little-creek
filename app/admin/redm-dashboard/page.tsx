'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const MONO    = "'Share Tech Mono', 'Courier New', monospace";
const DISPLAY = "'Rajdhani', 'Arial', sans-serif";
const T = {
  bg: '#08090D', card: '#10121A', border: 'rgba(128,104,45,0.18)',
  gold: '#80682D', muted: '#5A6A80', red: '#C85050', green: '#50C878',
  sepia: '#D4C090',
};

const COLORS_DOT = [
  { label: 'Rouge foncé', val: '#405B4A' },
  { label: 'Vert',        val: '#4B6546' },
  { label: 'Rouge vif',   val: '#254B50' },
  { label: 'Bleu',        val: '#536784' },
];
const COLORS_PATIENT = [
  { label: 'Vert (stable)',    val: '#42663C' },
  { label: 'Rouge (critique)', val: '#963F36' },
  { label: 'Bleu (soigné)',    val: '#4888A8' },
  { label: 'Orange (attente)', val: '#80682D' },
];

interface RegistreItem { heure: string; msg: string; dot: string; }
interface PatientItem  { nom: string; etat: string; col: string; }
interface CitationData { text: string; author: string; }
interface StatItem     { label: string; val: string; unit: string; col: string; }
interface TitresData {
  surtitle: string; title: string; subtitle: string; modules: string;
  panelEtat: string; panelRegistre: string; panelPatients: string;
}
interface DispensaireInfo {
  labelMedecins: string;
  labelRisque: string;
  labelEpidemie: string;
  alertMessageEpidemie: string;
  alertMessageEpidemieCritique: string;
  alertMessageRisque: string;
  alertMessageRisqueCritique: string;
}
interface DashboardConfig {
  registre: RegistreItem[]; patients: PatientItem[];
  citation: CitationData; stats: StatItem[]; titres: TitresData;
  dispensaire: DispensaireInfo;
}

const DEFAULTS: DashboardConfig = {
  titres: {
    surtitle:      "Dispensaire Medical · Comté de West Elizabeth",
    title:         'Carnet du dispensaire',
    subtitle:      'Registre des soins, actes medicaux et comptabilite',
    modules:       'Modules du Dispensaire',
    panelEtat:     'Etat du Dispensaire',
    panelRegistre: 'Registre du Jour',
    panelPatients: 'Patients en Salle',
  },
  dispensaire: {
    labelMedecins: 'Médecins',
    labelRisque:   'Risque sanitaire',
    labelEpidemie: 'Épidémie en cours',
    alertMessageEpidemie: 'Risque épidémie en cours, veuillez vous protéger et respecter les protocoles à la lettre pour votre sécurité.',
    alertMessageEpidemieCritique: 'ALERTE CRITIQUE — Épidémie majeure en cours. Isolement immédiat et respect strict des protocoles exigés pour votre sécurité.',
    alertMessageRisque: 'Risque sanitaire élevé, veuillez vous protéger et respecter les protocoles à la lettre pour votre sécurité.',
    alertMessageRisqueCritique: 'ALERTE CRITIQUE — Risque sanitaire majeur en cours. Isolement immédiat et respect strict des protocoles exigés pour votre sécurité.',
  },
  registre: [
    { heure: '08h14', msg: 'Consultation — blessure par balle, M. Calloway', dot: '#405B4A' },
    { heure: '07h42', msg: "Délivrance d'un certificat de bonne santé",      dot: '#4B6546' },
    { heure: '06h55', msg: "Arrivée d'un convoi — 3 blessés du ranch Ford",  dot: '#254B50' },
    { heure: '06h10', msg: 'Renouvellement du stock de laudanum',             dot: '#536784' },
  ],
  patients: [
    { nom: 'Elijah Calloway',  etat: 'Stable',     col: '#42663C' },
    { nom: 'Mary Sue Henkel',  etat: 'Critique',   col: '#963F36' },
    { nom: 'Tom "Buck" Walsh', etat: 'Soigné',     col: '#4888A8' },
    { nom: 'Rev. John Marsh',  etat: 'En attente', col: '#80682D' },
  ],
  citation: {
    text:   'Primum non nocere. La médecine de 1890 exige autant de courage que de science.',
    author: 'Dr. James Herrington, 1889',
  },
  stats: [
    { label: 'PATIENTS / 24H', val: '7',   unit: '',  col: '#244958' },
    { label: 'ACTES RÉALISÉS', val: '14',  unit: '',  col: '#42663C' },
    { label: 'TAUX SURVIE',    val: '85',  unit: '%', col: '#254B50' },
    { label: 'JOURS EN POSTE', val: '312', unit: '',  col: '#4888A8' },
  ],
};

function inp(extra?: React.CSSProperties): React.CSSProperties {
  return {
    padding: '9px 13px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(128,104,45,0.30)',
    borderRadius: 7,
    color: '#E8D8B0',
    fontFamily: MONO,
    fontSize: 15,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
    cursor: 'text',
    ...extra,
  };
}

function ColorSelect({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; val: string }[];
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: value, flexShrink: 0 }} />
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ padding: '9px 10px', background: '#1A1C28', border: '1px solid rgba(128,104,45,0.30)', borderRadius: 7, color: '#E8D8B0', fontFamily: MONO, fontSize: 14, cursor: 'pointer', width: 160 }}>
        {options.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
      </select>
    </div>
  );
}

function SectionTitle({ title, icon }: { title: string; icon: string }) {
  return (
    <div style={{ fontFamily: DISPLAY, color: T.gold, fontSize: 22, fontWeight: 700, letterSpacing: 2, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
      {icon} {title}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ color: T.muted, fontSize: 12, letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' as const }}>{children}</div>;
}

export default function RedmDashboardAdmin() {
  const router = useRouter();

  /* cfg holds the SOURCE OF TRUTH for colors + array structure.
     Text inputs are UNCONTROLLED (defaultValue) — we read them on save. */
  const [cfg, setCfg]         = useState<DashboardConfig>(DEFAULTS);
  const [loaded, setLoaded]   = useState(false);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState('');
  const [dbError, setDbError] = useState('');
  /* formKey: incrementing this causes the uncontrolled inputs to remount
     with fresh defaultValues (after data loads, or after add/remove). */
  const [formKey, setFormKey] = useState(0);

  const hasFetched = useRef(false);
  const formRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetch('/api/admin/redm-dashboard', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (d?.__error) {
          setDbError(d.__error);
        } else if (d) {
          setCfg(c => ({
            ...c, ...d,
            titres:      { ...DEFAULTS.titres,      ...(d.titres ?? {}) },
            dispensaire: { ...DEFAULTS.dispensaire, ...(d.dispensaire ?? {}) },
          }));
          setFormKey(k => k + 1); // remount inputs with loaded defaultValues
        }
        setLoaded(true);
      })
      .catch(e => { setDbError(String(e)); setLoaded(true); });
  }, []);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  /* Read all text values from the uncontrolled inputs in the DOM */
  function readText(name: string): string {
    const el = formRef.current?.querySelector(`[data-field="${name}"]`) as HTMLInputElement | HTMLTextAreaElement | null;
    return el?.value ?? '';
  }

  function collectCfg(): DashboardConfig {
    const t = cfg.titres;
    return {
      titres: {
        surtitle:      readText('titres.surtitle')      || t.surtitle,
        title:         readText('titres.title')          || t.title,
        subtitle:      readText('titres.subtitle')       || t.subtitle,
        modules:       readText('titres.modules')        || t.modules,
        panelEtat:     readText('titres.panelEtat')      || t.panelEtat,
        panelRegistre: readText('titres.panelRegistre')  || t.panelRegistre,
        panelPatients: readText('titres.panelPatients')  || t.panelPatients,
      },
      dispensaire: {
        labelMedecins:                readText('dispensaire.labelMedecins')                || cfg.dispensaire.labelMedecins,
        labelRisque:                  readText('dispensaire.labelRisque')                  || cfg.dispensaire.labelRisque,
        labelEpidemie:                readText('dispensaire.labelEpidemie')                || cfg.dispensaire.labelEpidemie,
        alertMessageEpidemie:         readText('dispensaire.alertMessageEpidemie')         || cfg.dispensaire.alertMessageEpidemie,
        alertMessageEpidemieCritique: readText('dispensaire.alertMessageEpidemieCritique') || cfg.dispensaire.alertMessageEpidemieCritique,
        alertMessageRisque:           readText('dispensaire.alertMessageRisque')           || cfg.dispensaire.alertMessageRisque,
        alertMessageRisqueCritique:   readText('dispensaire.alertMessageRisqueCritique')   || cfg.dispensaire.alertMessageRisqueCritique,
      },
      registre: cfg.registre.map((r, i) => ({
        heure: readText(`registre.${i}.heure`) || r.heure,
        msg:   readText(`registre.${i}.msg`)   || r.msg,
        dot:   r.dot,
      })),
      patients: cfg.patients.map((p, i) => ({
        nom:  readText(`patients.${i}.nom`)  || p.nom,
        etat: readText(`patients.${i}.etat`) || p.etat,
        col:  p.col,
      })),
      stats: cfg.stats.map((s, i) => ({
        ...s,
        val: readText(`stats.${i}.val`) || s.val,
      })),
      citation: {
        text:   readText('citation.text')   || cfg.citation.text,
        author: readText('citation.author') || cfg.citation.author,
      },
    };
  }

  async function save() {
    const data = collectCfg();
    setSaving(true);
    const r = await fetch('/api/admin/redm-dashboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setSaving(false);
    if (r.ok) {
      setCfg(data);
      showToast('✓ Sauvegardé avec succès');
    } else {
      showToast('✗ Erreur lors de la sauvegarde');
    }
  }

  /* Structural mutations: collect text, apply change, bump formKey */
  function mutate(fn: (current: DashboardConfig) => DashboardConfig) {
    const collected = collectCfg();
    setCfg(fn(collected));
    setFormKey(k => k + 1);
  }

  function addRegistre()             { mutate(c => ({ ...c, registre: [...c.registre, { heure: '', msg: '', dot: '#405B4A' }] })); }
  function removeRegistre(i: number) { mutate(c => ({ ...c, registre: c.registre.filter((_, j) => j !== i) })); }
  function setRegistreDot(i: number, dot: string) {
    setCfg(c => { const a = [...c.registre]; a[i] = { ...a[i], dot }; return { ...c, registre: a }; });
  }

  function addPatient()             { mutate(c => ({ ...c, patients: [...c.patients, { nom: '', etat: '', col: '#42663C' }] })); }
  function removePatient(i: number) { mutate(c => ({ ...c, patients: c.patients.filter((_, j) => j !== i) })); }
  function setPatientCol(i: number, col: string) {
    setCfg(c => { const a = [...c.patients]; a[i] = { ...a[i], col }; return { ...c, patients: a }; });
  }

  if (!loaded) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.muted, fontFamily: MONO, fontSize: 18 }}>
        Chargement…
      </div>
    );
  }

  const btnAdd: React.CSSProperties = {
    marginTop: 8, padding: '9px 18px',
    background: 'rgba(128,104,45,0.07)', border: `1px solid ${T.border}`,
    borderRadius: 8, color: T.gold, cursor: 'pointer', fontSize: 15,
    alignSelf: 'flex-start', fontFamily: MONO,
  };
  const btnDel: React.CSSProperties = {
    padding: '9px 13px', background: 'rgba(200,80,80,0.10)',
    border: '1px solid rgba(200,80,80,0.30)', borderRadius: 7,
    color: T.red, cursor: 'pointer', fontSize: 16, flexShrink: 0, fontFamily: MONO,
  };
  const btnSave: React.CSSProperties = {
    padding: '14px 32px', background: 'rgba(80,200,120,0.15)',
    border: '1px solid rgba(80,200,120,0.45)', borderRadius: 10,
    color: T.green, fontFamily: MONO, fontSize: 17,
    cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1,
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: MONO, padding: '40px 56px' }} ref={formRef}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, padding: '14px 24px', background: toast.startsWith('✓') ? 'rgba(80,200,120,0.15)' : 'rgba(200,80,80,0.15)', border: `1px solid ${toast.startsWith('✓') ? T.green : T.red}88`, borderRadius: 10, color: toast.startsWith('✓') ? T.green : T.red, fontSize: 17 }}>
          {toast}
        </div>
      )}

      {/* Erreur DB */}
      {dbError && (
        <div style={{ marginBottom: 28, padding: '18px 24px', background: 'rgba(200,80,80,0.10)', border: '1px solid rgba(200,80,80,0.40)', borderRadius: 12, color: T.red, fontSize: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>⚠ Erreur base de données — la table <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 7px', borderRadius: 4 }}>site_config</code> n'existe pas encore.</div>
          <div style={{ color: '#A05050', fontSize: 14, marginBottom: 12 }}>Erreur : {dbError}</div>
          <div style={{ fontSize: 14, color: '#A05050' }}>Exécute ce SQL dans Supabase :</div>
          <pre style={{ background: 'rgba(0,0,0,0.4)', padding: '12px 16px', borderRadius: 8, marginTop: 8, fontSize: 13, color: '#E0C0C0', overflowX: 'auto' }}>
{`CREATE TABLE site_config (
  key   text PRIMARY KEY,
  value jsonb NOT NULL
);`}
          </pre>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
        <div>
          <div style={{ fontFamily: DISPLAY, color: T.gold, fontSize: 48, fontWeight: 700, letterSpacing: 4, lineHeight: 1 }}>🏥 TABLEAU DE BORD REDM</div>
          <div style={{ color: T.muted, fontSize: 16, letterSpacing: 3, marginTop: 8 }}>Édition du contenu de la page d'accueil RedM</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={save} disabled={saving} style={btnSave}>
            {saving ? '...' : '✓ Sauvegarder tout'}
          </button>
          <a href="/admin" style={{ padding: '14px 24px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 10, color: T.muted, fontFamily: MONO, fontSize: 17, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            ← Admin
          </a>
        </div>
      </div>

      {/* ── ALL FORM CONTENT — key=formKey forces remount on data load / structural changes ── */}
      <div key={formKey} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* TITRES */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '28px 32px' }}>
          <SectionTitle title="TITRES DE LA PAGE" icon="✏️" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {([
              ['titres.surtitle',      'Sous-titre au-dessus du titre principal',  cfg.titres.surtitle],
              ['titres.title',         'Titre principal',                           cfg.titres.title],
              ['titres.subtitle',      'Description sous le titre',                 cfg.titres.subtitle],
              ['titres.modules',       'Titre de la section modules',               cfg.titres.modules],
              ['titres.panelEtat',     'Titre panneau — État',                      cfg.titres.panelEtat],
              ['titres.panelRegistre', 'Titre panneau — Registre',                  cfg.titres.panelRegistre],
              ['titres.panelPatients', 'Titre panneau — Patients',                  cfg.titres.panelPatients],
            ] as [string, string, string][]).map(([field, label, def]) => (
              <div key={field}>
                <Label>{label}</Label>
                <input data-field={field} defaultValue={def} style={inp()} />
              </div>
            ))}
          </div>
        </div>

        {/* INFORMATION DISPENSAIRE */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '28px 32px' }}>
          <SectionTitle title="INFORMATION DISPENSAIRE" icon="🏚" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <Label>Libellé — Médecins</Label>
              <input data-field="dispensaire.labelMedecins" defaultValue={cfg.dispensaire.labelMedecins} style={inp({ maxWidth: 320 })} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <Label>Libellé — Risque sanitaire</Label>
                <input data-field="dispensaire.labelRisque" defaultValue={cfg.dispensaire.labelRisque} style={inp()} />
              </div>
              <div>
                <Label>Libellé — Épidémie en cours</Label>
                <input data-field="dispensaire.labelEpidemie" defaultValue={cfg.dispensaire.labelEpidemie} style={inp()} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <Label>Message — Épidémie (non critique)</Label>
                <textarea data-field="dispensaire.alertMessageEpidemie" defaultValue={cfg.dispensaire.alertMessageEpidemie} rows={3} style={{ ...inp(), resize: 'vertical' }} />
              </div>
              <div>
                <Label>Message — Épidémie CRITIQUE</Label>
                <textarea data-field="dispensaire.alertMessageEpidemieCritique" defaultValue={cfg.dispensaire.alertMessageEpidemieCritique} rows={3} style={{ ...inp(), resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <Label>Message — Risque sanitaire (non critique)</Label>
                <textarea data-field="dispensaire.alertMessageRisque" defaultValue={cfg.dispensaire.alertMessageRisque} rows={3} style={{ ...inp(), resize: 'vertical' }} />
              </div>
              <div>
                <Label>Message — Risque sanitaire CRITIQUE</Label>
                <textarea data-field="dispensaire.alertMessageRisqueCritique" defaultValue={cfg.dispensaire.alertMessageRisqueCritique} rows={3} style={{ ...inp(), resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
              ℹ Le nombre de médecins est calculé automatiquement depuis « Direction · Liste des médecins ».
              L'épidémie en cours et le risque sanitaire se sélectionnent depuis « Direction · Alerte Sanitaire »
              (liste déroulante + bouton CRITIQUE), réservé à la direction. Le message affiché à tous dépend du
              type (épidémie / risque sanitaire) et du niveau (normal / critique).
            </div>
          </div>
        </div>

        {/* REGISTRE DU JOUR */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '28px 32px' }}>
          <SectionTitle title="REGISTRE DU JOUR" icon="📋" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cfg.registre.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input data-field={`registre.${i}.heure`} defaultValue={r.heure} style={inp({ width: 110 })} placeholder="08h14" />
                <input data-field={`registre.${i}.msg`}   defaultValue={r.msg}   style={inp({ flex: 1 })}   placeholder="Description" />
                <ColorSelect value={r.dot} onChange={v => setRegistreDot(i, v)} options={COLORS_DOT} />
                <button onClick={() => removeRegistre(i)} style={btnDel}>✕</button>
              </div>
            ))}
            <button onClick={addRegistre} style={btnAdd}>+ Ajouter une entrée</button>
          </div>
        </div>

        {/* PATIENTS EN SALLE */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '28px 32px' }}>
          <SectionTitle title="PATIENTS EN SALLE" icon="🛏" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cfg.patients.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input data-field={`patients.${i}.nom`}  defaultValue={p.nom}  style={inp({ flex: 1 })}   placeholder="Nom du patient" />
                <input data-field={`patients.${i}.etat`} defaultValue={p.etat} style={inp({ width: 160 })} placeholder="État (Stable…)" />
                <ColorSelect value={p.col} onChange={v => setPatientCol(i, v)} options={COLORS_PATIENT} />
                <button onClick={() => removePatient(i)} style={btnDel}>✕</button>
              </div>
            ))}
            <button onClick={addPatient} style={btnAdd}>+ Ajouter un patient</button>
          </div>
        </div>

        {/* STATISTIQUES */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '28px 32px' }}>
          <SectionTitle title="STATISTIQUES (chiffres)" icon="📊" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {cfg.stats.map((s, i) => (
              <div key={i} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '16px 18px' }}>
                <div style={{ color: T.muted, fontSize: 13, letterSpacing: 2, marginBottom: 10 }}>{s.label}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input data-field={`stats.${i}.val`} defaultValue={s.val} style={inp({ width: 90 })} placeholder="Valeur" />
                  {s.unit && <span style={{ color: T.muted, fontSize: 14 }}>{s.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CITATION */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '28px 32px' }}>
          <SectionTitle title="CITATION" icon="💬" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <Label>Texte</Label>
              <textarea
                data-field="citation.text"
                defaultValue={cfg.citation.text}
                rows={3}
                style={{ ...inp(), resize: 'vertical' }}
                placeholder="Texte de la citation…"
              />
            </div>
            <div>
              <Label>Auteur</Label>
              <input
                data-field="citation.author"
                defaultValue={cfg.citation.author}
                style={inp()}
                placeholder="Ex: Dr. James Herrington, 1889"
              />
            </div>
          </div>
        </div>

        {/* Bouton bas de page */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 40 }}>
          <button onClick={save} disabled={saving} style={{ ...btnSave, fontSize: 18, padding: '16px 40px' }}>
            {saving ? 'Sauvegarde…' : '✓ Sauvegarder tout'}
          </button>
        </div>

      </div>
    </div>
  );
}
