'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// ─── THÈME FIVEM ─────────────────────────────────────────────────────────────
const MONO    = "'Share Tech Mono', 'Courier New', monospace";
const DISPLAY = "'Rajdhani', 'Arial', sans-serif";

const T = {
  bg:        '#070D1C',
  card:      '#060C1A',
  cardHov:   '#0C1628',
  border:    'rgba(249,115,22,0.20)',
  borderSub: 'rgba(255,255,255,0.07)',
  orange:    '#F97316',
  orangeDim: 'rgba(249,115,22,0.12)',
  text:      '#E2E8F0',
  muted:     '#94A3B8',
  dim:       '#475569',
  dimmer:    '#334155',
};

// ─── COULEURS GRAVITÉ ─────────────────────────────────────────────────────────
const GC = {
  CRITIQUE: { dot: '#A855F7', text: '#C084FC', border: 'rgba(168,85,247,0.40)', bg: 'rgba(168,85,247,0.10)', label: '● CRITIQUE' },
  ELEVEE:   { dot: '#EF4444', text: '#F87171', border: 'rgba(239,68,68,0.40)',  bg: 'rgba(239,68,68,0.10)',  label: '● ÉLEVÉE'  },
  MOYENNE:  { dot: '#EAB308', text: '#FDE047', border: 'rgba(234,179,8,0.40)',  bg: 'rgba(234,179,8,0.10)',  label: '● MOYENNE' },
  FAIBLE:   { dot: '#4ADE80', text: '#4ADE80', border: 'rgba(74,222,128,0.40)', bg: 'rgba(74,222,128,0.10)', label: '● FAIBLE'  },
} as const;
type Gravite = keyof typeof GC;
function gs(g: string) { return GC[(g as Gravite)] ?? GC.FAIBLE; }

// ─── COULEUR CONSTANTE VITALE ─────────────────────────────────────────────────
function ccv(key: string, val: string) {
  const n = parseFloat(val);
  if (!val || isNaN(n) || n === 0) return { border: T.borderSub, bg: T.card, color: T.dim };
  const bad = (key === 'fc' && (n < 60 || n > 100))
           || (key === 'spo2' && n < 95)
           || (key === 'temperature' && (n < 36.1 || n > 37.8));
  return bad
    ? { border: 'rgba(239,68,68,0.50)', bg: 'rgba(239,68,68,0.08)', color: '#F87171' }
    : { border: 'rgba(74,222,128,0.45)', bg: 'rgba(74,222,128,0.06)', color: '#4ADE80' };
}
function taColor(val: string) {
  const sys = parseFloat((val || '').split('/')[0]);
  if (!sys || sys === 0) return { border: T.borderSub, bg: T.card, color: T.dim };
  return (sys < 90 || sys > 140)
    ? { border: 'rgba(239,68,68,0.50)', bg: 'rgba(239,68,68,0.08)', color: '#F87171' }
    : { border: 'rgba(74,222,128,0.45)', bg: 'rgba(74,222,128,0.06)', color: '#4ADE80' };
}

// ─── COULEURS SECTIONS ────────────────────────────────────────────────────────
const SECTION_COLORS: Record<string, { accent: string; glow: string }> = {
  orange: { accent: '#F97316', glow: 'rgba(249,115,22,0.18)' },
  red:    { accent: '#F87171', glow: 'rgba(248,113,113,0.15)' },
  purple: { accent: '#C084FC', glow: 'rgba(192,132,252,0.15)' },
  cyan:   { accent: '#38BDF8', glow: 'rgba(56,189,248,0.15)'  },
  green:  { accent: '#4ADE80', glow: 'rgba(74,222,128,0.15)'  },
  yellow: { accent: '#FDE047', glow: 'rgba(253,224,71,0.15)'  },
};

function Section({ icon, title, color = 'orange', children }: {
  icon: string; title: string; color?: string; children: React.ReactNode;
}) {
  const c = SECTION_COLORS[color] ?? SECTION_COLORS.orange;
  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderLeft: `3px solid ${c.accent}`,
      marginBottom: 18,
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 28px',
        borderBottom: `1px solid ${T.border}`,
        background: c.glow,
      }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{
          fontFamily: MONO, fontSize: 18, fontWeight: 700,
          color: c.accent, letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>{title}</span>
      </div>
      <div style={{ padding: '22px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {children}
      </div>
    </div>
  );
}

function L({ t, req }: { t: string; req?: boolean }) {
  return (
    <label style={{
      display: 'block', fontFamily: MONO, fontSize: 16, fontWeight: 700,
      letterSpacing: '0.13em', textTransform: 'uppercase', color: T.dim, marginBottom: 6,
    }}>
      {t}{req && <span style={{ color: '#F87171', marginLeft: 4 }}>*</span>}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(0,0,0,0.35)',
  border: `1px solid ${T.borderSub}`,
  padding: '12px 18px',
  color: T.text,
  fontFamily: DISPLAY, fontSize: 18,
  outline: 'none',
  transition: 'border-color 0.15s',
};

function FI({ k, v, s, type = 'text', ph = '' }: {
  k: string; v: Record<string, string>; s: (k: string, val: string) => void; type?: string; ph?: string;
}) {
  return (
    <input
      type={type} value={v[k] || ''} onChange={e => s(k, e.target.value)}
      placeholder={ph} style={inputStyle}
      onFocus={e => (e.target.style.borderColor = T.orange)}
      onBlur={e => (e.target.style.borderColor = T.borderSub.toString())}
    />
  );
}

function FT({ k, v, s, ph = '', rows = 3 }: {
  k: string; v: Record<string, string>; s: (k: string, val: string) => void; ph?: string; rows?: number;
}) {
  return (
    <textarea
      value={v[k] || ''} onChange={e => s(k, e.target.value)}
      rows={rows} placeholder={ph}
      style={{ ...inputStyle, resize: 'vertical' }}
      onFocus={e => (e.target.style.borderColor = T.orange)}
      onBlur={e => (e.target.style.borderColor = T.borderSub.toString())}
    />
  );
}

function Chip({ label, active, onClick, ac }: {
  label: string; active?: boolean; onClick: () => void;
  ac?: { border: string; bg: string; color: string };
}) {
  const activeStyle = ac
    ? { border: `1px solid ${ac.border}`, background: ac.bg, color: ac.color }
    : { border: `1px solid ${T.orange}`, background: T.orangeDim, color: T.orange };
  const inactiveStyle = { border: `1px solid ${T.borderSub}`, background: 'transparent', color: T.dim };
  return (
    <button onClick={onClick} style={{
      fontFamily: MONO, fontSize: 16, letterSpacing: '0.07em',
      padding: '9px 18px', cursor: 'pointer', transition: 'all 0.15s',
      ...(active ? activeStyle : inactiveStyle),
    }}>
      {label}
    </button>
  );
}

// ─── RACCOURCIS CHIRURGIE ─────────────────────────────────────────────────────
const raccourcisChirurgie = [
  {
    label: 'Extraction balle (torse)',
    categorie: 'Balistique',
    gravite: 'ELEVEE',
    motif: 'Blessure par arme à feu non traversante',
    localisation_blessure: 'Torse, flanc droit — région pectorale',
    etat_admission: 'Patient conscient, orienté. Douleur intense. Plaie balistique non traversante. Saignement contrôlé à l\'arrivée. Pas de détresse respiratoire immédiate.',
    fc_pre: '98', ta_pre: '118/75', spo2_pre: '97', temperature_pre: '36.9',
    pre_op: 'Mise sous monitorage standard. Voie veineuse périphérique. MEOPA pour analgésie immédiate. Mèche hémostatique. Pansement compressif.',
    type_examen: 'IRM thoracique',
    resultats_examen: 'Projectile dans les tissus mous pectoraux droits. Absence d\'atteinte pulmonaire. Pas de lésion vasculaire. Pas d\'atteinte costale significative.',
    anesthesie: 'Anesthésie générale selon protocole standard. Surveillance continue des paramètres vitaux.',
    protocole_op: '1. Désinfection large du champ opératoire.\n2. Mise en place de champs stériles.\n3. Incision élargie contrôlée au niveau de l\'orifice balistique.\n4. Exploration minutieuse du trajet balistique.\n5. Extraction du projectile sous contrôle visuel direct.\n6. Vérification d\'absence de fragment résiduel.\n7. Lavage abondant au sérum physiologique stérile.\n8. Contrôle rigoureux de l\'hémostase.\n9. Fermeture plan par plan des tissus.\n10. Suture cutanée par fils résorbables.\n11. Pansement stérile compressif.',
    complications_per_op: 'Aucune complication per-opératoire constatée.',
    suites_op: 'Douleur contrôlée. Constantes stables. Pas de saignement secondaire. Pas de signe de pneumothorax secondaire.',
    antalgique: 'Paracétamol 1g jusqu\'à 3 fois/jour (max 3g/24h)',
    anti_inflammatoire: 'Si besoin selon tolérance',
    antibiotique: 'Prophylaxie selon protocole',
    soins_post_op: 'Surveillance de la plaie (rougeur, chaleur, écoulement). Points résorbables, pas de retrait nécessaire.',
    ata: '24 heures minimum',
    restrictions: 'Repos relatif. Éviter les efforts du membre supérieur droit.',
    surveillance: '• Douleur thoracique\n• Fièvre\n• Difficulté respiratoire',
    conclusion: 'Blessure par balle non traversante, projectile extrait avec succès. Évolution immédiate favorable. Pronostic fonctionnel bon sous surveillance.',
  },
  {
    label: 'Extraction balle (membre)',
    categorie: 'Balistique',
    gravite: 'MOYENNE',
    motif: 'Blessure par arme à feu — membre',
    localisation_blessure: 'Membre supérieur / inférieur',
    etat_admission: 'Patient conscient, douleur modérée à intense. Plaie balistique non traversante. Hémostase provisoire à l\'arrivée.',
    fc_pre: '92', ta_pre: '120/78', spo2_pre: '98', temperature_pre: '36.7',
    pre_op: 'Monitorage. Voie veineuse périphérique. Antalgiques IV. Pansement compressif. Garrot si nécessaire.',
    type_examen: 'Radiographie',
    resultats_examen: 'Projectile localisé dans les tissus mous. Pas d\'atteinte osseuse majeure. Pas de lésion vasculaire.',
    anesthesie: 'Anesthésie locorégionale ou générale selon localisation.',
    protocole_op: '1. Désinfection et mise en place du champ stérile.\n2. Incision contrôlée sur le trajet balistique.\n3. Exploration et extraction du projectile.\n4. Vérification de l\'intégrité vasculo-nerveuse.\n5. Ablation de tout fragment résiduel.\n6. Lavage au sérum physiologique.\n7. Hémostase soigneuse.\n8. Fermeture plan par plan.\n9. Pansement stérile.',
    complications_per_op: 'Aucune.',
    suites_op: 'Douleur contrôlée. Pas de saignement actif. Constantes stables.',
    antalgique: 'Paracétamol 1g x3/jour',
    anti_inflammatoire: 'Ibuprofène 400mg si toléré',
    antibiotique: 'Prophylaxie courte durée',
    soins_post_op: 'Pansement stérile quotidien. Surveillance plaie opératoire.',
    ata: '24 à 48 heures',
    restrictions: 'Pas d\'effort avec le membre opéré.',
    surveillance: '• Saignement\n• Infection locale\n• Trouble sensitif ou moteur',
    conclusion: 'Extraction réussie. Aucune atteinte vasculo-nerveuse. Pronostic favorable.',
  },
  {
    label: 'Suture plaie profonde',
    categorie: 'Lacération',
    gravite: 'MOYENNE',
    motif: 'Plaie lacérante profonde par arme blanche',
    localisation_blessure: 'Abdomen / flac',
    etat_admission: 'Patient conscient, douloureux. Plaie profonde avec risque d\'effraction pariétale. Pas d\'éviscération.',
    fc_pre: '88', ta_pre: '115/72', spo2_pre: '99', temperature_pre: '36.8',
    pre_op: 'Nettoyage et protection de la plaie. Voie veineuse. Antalgiques. Évaluation profondeur.',
    type_examen: 'Échographie abdominale',
    resultats_examen: 'Pas d\'atteinte des organes internes. Lésion limitée aux plans musculaires.',
    anesthesie: 'Anesthésie locale ou locorégionale.',
    protocole_op: '1. Désinfection large du champ opératoire.\n2. Parage soigneux des berges de la plaie.\n3. Exploration du trajet pour vérifier l\'absence d\'atteinte profonde.\n4. Lavage abondant au sérum physiologique.\n5. Hémostase complète.\n6. Fermeture musculaire si nécessaire.\n7. Suture plan par plan.\n8. Suture cutanée par points séparés ou surjet.\n9. Pansement stérile.',
    complications_per_op: 'Aucune.',
    suites_op: 'Plaie fermée proprement. Douleur contrôlée. Hémostase stable.',
    antalgique: 'Paracétamol 1g x3/jour + antalgique palier 2 si EVA > 6',
    anti_inflammatoire: 'Selon tolérance',
    antibiotique: 'Amoxicilline-clavulanate 7 jours',
    soins_post_op: 'Pansement stérile quotidien. Retrait sutures dans 10-12 jours.',
    ata: '24 à 48 heures',
    restrictions: 'Pas d\'effort abdominal. Hygiène stricte de la plaie.',
    surveillance: '• Rougeur, chaleur, écoulement\n• Fièvre\n• Douleur croissante',
    conclusion: 'Suture chirurgicale réussie. Pas d\'atteinte viscérale. Pronostic favorable sous surveillance.',
  },
  {
    label: 'Réparation fracture ouverte',
    categorie: 'Orthopédie',
    gravite: 'ELEVEE',
    motif: 'Fracture ouverte avec exposition osseuse',
    localisation_blessure: 'Membre inférieur',
    etat_admission: 'Patient conscient, douleur majeure. Fracture ouverte avec exposition osseuse. Risque infectieux élevé.',
    fc_pre: '105', ta_pre: '130/85', spo2_pre: '96', temperature_pre: '37.1',
    pre_op: 'Immobilisation provisoire. Voie veineuse. Antalgiques IV. Protection stérile de la plaie. Tétanos si non à jour.',
    type_examen: 'Radiographie',
    resultats_examen: 'Fracture complète avec déplacement. Exposition osseuse confirmée. Pas de lésion vasculaire majeure.',
    anesthesie: 'Anesthésie générale.',
    protocole_op: '1. Désinfection et champ stérile.\n2. Débridement agressif des tissus nécrotiques.\n3. Lavage abondant au sérum physiologique (minimum 3L).\n4. Réduction de la fracture sous contrôle radiologique.\n5. Ostéosynthèse selon type de fracture (broche, plaque, clou).\n6. Vérification de la stabilité mécanique.\n7. Fermeture si possible ou cicatrisation dirigée.\n8. Attelle ou plâtre de contention.',
    complications_per_op: 'Aucune complication majeure. Réduction satisfaisante.',
    suites_op: 'Douleur contrôlée sous antalgiques. Constantes stables. Bonne perfusion distale.',
    antalgique: 'Morphine selon EVA + Paracétamol 1g x4/jour',
    anti_inflammatoire: 'Contre-indiqué à la phase initiale',
    antibiotique: 'Céfazoline 2g IV puis relais oral 5-7 jours',
    soins_post_op: 'Surveillance plaie, Doppler si doute vasculaire. Rééducation précoce.',
    ata: '48 à 72 heures',
    restrictions: 'Appui interdit. Immobilisation stricte.',
    surveillance: '• Signe d\'infection\n• Ischémie distale\n• Douleur croissante\n• Fièvre',
    conclusion: 'Fracture ouverte traitée chirurgicalement avec succès. Ostéosynthèse stable. Surveillance infectieuse impérative.',
  },
  {
    label: 'Thoracotomie d\'urgence',
    categorie: 'Urgence vitale',
    gravite: 'CRITIQUE',
    motif: 'Hémothorax massif / pneumothorax suffocant',
    localisation_blessure: 'Thorax',
    etat_admission: 'Patient en détresse respiratoire sévère. Hémodynamique instable. Saturation effondrée. Douleur thoracique intense.',
    fc_pre: '130', ta_pre: '85/55', spo2_pre: '82', temperature_pre: '36.2',
    pre_op: 'Oxygénothérapie haute concentration. Voie veineuse x2 gros calibre. Remplissage vasculaire. Préparation urgente au bloc.',
    type_examen: 'Scanner thoracique en urgence',
    resultats_examen: 'Hémothorax massif droit. Compression médiastinale. Pas d\'atteinte cardiaque directe.',
    anesthesie: 'Anesthésie générale en urgence absolue. Intubation oro-trachéale.',
    protocole_op: '1. Thoracotomie postérolatérale d\'urgence.\n2. Évacuation de l\'hémothorax.\n3. Contrôle du saignement actif.\n4. Exploration des structures thoraciques.\n5. Réparation des lésions identifiées.\n6. Drainage thoracique en aspiration.\n7. Fermeture par plans anatomiques.\n8. Drainage de sécurité.',
    complications_per_op: 'Instabilité hémodynamique peropératoire corrigée. Transfusion intraopératoire.',
    suites_op: 'Stabilisation hémodynamique en fin d\'intervention. Patient transféré en soins intensifs.',
    antalgique: 'Morphine IV titration stricte en USI',
    anti_inflammatoire: 'Non indiqué',
    antibiotique: 'Large spectre IV 7 jours',
    soins_post_op: 'Surveillance continue USI. Drainage thoracique en place. Bilans biologiques rapprochés.',
    ata: 'Indéterminée — selon évolution clinique',
    restrictions: 'Repos strict. Pas de mobilisation sans accord médical.',
    surveillance: '• Saturation\n• TA\n• Débit du drain\n• Signes de choc',
    conclusion: 'Thoracotomie d\'urgence réalisée avec succès. Hémostase obtenue. Pronostic réservé, surveillance intensive requise.',
  },
  {
    label: 'Laparotomie exploratrice',
    categorie: 'Urgence vitale',
    gravite: 'CRITIQUE',
    motif: 'Traumatisme abdominal fermé / plaie pénétrante',
    localisation_blessure: 'Abdomen',
    etat_admission: 'Patient algique, abdomen défensif. Suspicion de lésion viscérale. Instabilité hémodynamique progressive.',
    fc_pre: '118', ta_pre: '92/60', spo2_pre: '94', temperature_pre: '36.5',
    pre_op: 'Voie veineuse x2. Sondage vésical. Remplissage vasculaire. Prémédication urgente.',
    type_examen: 'Scanner abdomino-pelvien',
    resultats_examen: 'Épanchement péritonéal. Suspicion lésion splénique/hépatique. Pas de pneumopéritoine évident.',
    anesthesie: 'Anesthésie générale avec intubation.',
    protocole_op: '1. Laparotomie médiane sous-ombilicale.\n2. Exploration systématique des organes abdominaux.\n3. Contrôle des saignements actifs.\n4. Traitement des lésions identifiées.\n5. Lavage péritonéal abondant.\n6. Drainage si nécessaire.\n7. Fermeture par plans.',
    complications_per_op: 'Lésion splénique traitée. Hémostase obtenue après packing.',
    suites_op: 'Stabilisation obtenue en fin d\'intervention. Transfert en soins intensifs.',
    antalgique: 'Morphine IV en USI',
    anti_inflammatoire: 'Contre-indiqué',
    antibiotique: 'Large spectre 7-10 jours',
    soins_post_op: 'USI, monitorage continu, reprise du transit.',
    ata: 'Selon évolution',
    restrictions: 'Repos absolu.',
    surveillance: '• Douleur abdominale\n• Fièvre\n• Signes de choc\n• Reprise du transit',
    conclusion: 'Laparotomie réalisée. Lésions traitées. Pronostic dépendant de l\'évolution post-opératoire.',
  },
];

const categories = [...new Set(raccourcisChirurgie.map(r => r.categorie))];

// ─── TEMPLATE RAPPORT ─────────────────────────────────────────────────────────
const TEMPLATE = `COMPTE RENDU OPÉRATOIRE — SAMS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Informations générales

Date : {{date}}
Heure de prise en charge : {{heure}}
Patient : {{civilite}} {{prenom}} {{nom}}
Motif : {{motif}}
Localisation : {{localisation_blessure}}
Lieu d'intervention : {{lieu}}

---

🏥 État initial à l'admission

{{etat_admission}}

---

📊 Constantes à l'admission

FC : {{fc_pre}} bpm
TA : {{ta_pre}} mmHg
SpO₂ : {{spo2_pre}} %
Température : {{temperature_pre}} °C
État général : {{etat_general_pre}}

---

⚕️ Prise en charge pré-opératoire

{{pre_op}}

---

🔬 Examens complémentaires

Type d'examen : {{type_examen}}
{{resultats_examen}}

---

🔪 Intervention chirurgicale (Bloc opératoire)

Anesthésie
{{anesthesie}}

Protocole opératoire
{{protocole_op}}

Complications per-opératoires : {{complications_per_op}}

---

📈 Suites opératoires immédiates

{{suites_op}}

Constantes post-opératoires
FC : {{fc_post}} bpm
TA : {{ta_post}} mmHg
SpO₂ : {{spo2_post}} %
Température : {{temperature_post}} °C

---

💊 Traitement post-opératoire

Antalgique : {{antalgique}}
Anti-inflammatoire : {{anti_inflammatoire}}
Antibiothérapie : {{antibiotique}}
Soins locaux : {{soins_post_op}}

---

📌 Recommandations

Durée d'ATA : {{ata}}
Restrictions physiques : {{restrictions}}
Surveillance des symptômes :
{{surveillance}}
Retour en consultation : {{suivi_date}}

---

🔬 Conclusion

{{conclusion}}
Gravité : {{gravite}}

---

✍️ Rapport rédigé par {{redacteur}} — {{date}}`;

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function ChirurgiePage() {
  const router = useRouter();

  const [vals, setVals]     = useState<Record<string, string>>({ civilite: 'Monsieur', gravite: 'FAIBLE' });
  const [report, setReport] = useState('');
  const [step, setStep]     = useState<'form' | 'preview'>('form');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState('');
  const [showR, setShowR]     = useState(false);
  const [cat, setCat]         = useState(categories[0]);

  const set = (k: string, v: string) => setVals(p => ({ ...p, [k]: v }));

  function applyRaccourci(r: typeof raccourcisChirurgie[0]) {
    setVals(p => ({
      ...p,
      gravite:              r.gravite,
      motif:                r.motif,
      localisation_blessure: r.localisation_blessure,
      etat_admission:       r.etat_admission,
      fc_pre:               r.fc_pre,
      ta_pre:               r.ta_pre,
      spo2_pre:             r.spo2_pre,
      temperature_pre:      r.temperature_pre,
      pre_op:               r.pre_op,
      type_examen:          r.type_examen,
      resultats_examen:     r.resultats_examen,
      anesthesie:           r.anesthesie,
      protocole_op:         r.protocole_op,
      complications_per_op: r.complications_per_op,
      suites_op:            r.suites_op,
      antalgique:           r.antalgique,
      anti_inflammatoire:   r.anti_inflammatoire,
      antibiotique:         r.antibiotique,
      soins_post_op:        r.soins_post_op,
      ata:                  r.ata,
      restrictions:         r.restrictions,
      surveillance:         r.surveillance,
      conclusion:           r.conclusion,
    }));
    setShowR(false);
  }

  async function generate() {
    setLoading(true); setErr('');
    const g = vals.gravite;
    const gt = g === 'CRITIQUE' ? '🟣 CRITIQUE' : g === 'ELEVEE' ? '🔴 ÉLEVÉE' : g === 'MOYENNE' ? '🟡 MOYENNE' : '🟢 FAIBLE';
    const allVals = { ...vals, gravite: gt };

    function cleanTemplate(tpl: string): string {
      let result = tpl.replace(/\{\{(\w+)\}\}/g, (_: string, key: string) => {
        const v = allVals[key];
        return (v !== undefined && v !== null && String(v).trim() !== '') ? String(v).trim() : '__EMPTY__';
      });
      result = result.split('\n').filter(l => !l.trim().includes('__EMPTY__')).join('\n');
      result = result.replace(/---\s*\n(\s*\n)*---/g, '---');
      result = result.replace(/\n{3,}/g, '\n\n');
      return result;
    }

    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: cleanTemplate(TEMPLATE), values: allVals }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReport(data.report); setStep('preview');
    } catch { setErr('Erreur lors de la génération.'); }
    setLoading(false);
  }

  async function save() {
    setSaving(true); setErr('');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr('Non authentifié'); setSaving(false); return; }
    const name = `${vals.prenom || ''} ${vals.nom || ''}`.trim() || 'Inconnu';
    const filename = `chirurgie_${name.replace(/\s/g, '_')}_${Date.now()}.txt`;
    const { error: e } = await supabase.from('archives').insert({
      owner_id: user.id, universe: 'fivem', template_name: 'Chirurgie',
      patient_name: name, storage_path: `${user.id}/${filename}`,
      filename, field_values: vals, rendered_body: report,
    });
    if (e) { setErr('Erreur : ' + e.message); setSaving(false); return; }
    router.push('/fivem/archives');
  }

  const g = gs(vals.gravite || 'FAIBLE');

  const btnBase: React.CSSProperties = {
    fontFamily: MONO, fontWeight: 700, letterSpacing: '0.12em',
    textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.18s',
    border: 'none', outline: 'none',
  };
  const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 };

  // Constante vitale inline
  function VitalBox({ label, fkey, unit, ph, note }: {
    label: string; fkey: string; unit: string; ph: string; note?: string;
  }) {
    const c = fkey === 'ta_pre' ? taColor(vals[fkey] || '') : ccv(fkey, vals[fkey] || '');
    return (
      <div style={{ border: `1px solid ${c.border}`, background: c.bg }}>
        <div style={{
          padding: '6px 14px', borderBottom: `1px solid ${c.border}`,
          fontFamily: MONO, fontSize: 14, color: c.color, letterSpacing: '0.12em', opacity: 0.75,
        }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="text" value={vals[fkey] || ''} onChange={e => set(fkey, e.target.value)}
            placeholder={ph}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              padding: '10px 14px', fontFamily: MONO, fontSize: 22, color: c.color,
              fontWeight: 700,
            }}
          />
          <span style={{ padding: '0 14px', fontFamily: MONO, fontSize: 16, color: c.color, opacity: 0.6 }}>{unit}</span>
        </div>
        {note && <p style={{ fontFamily: MONO, fontSize: 13, color: T.muted, marginTop: 4, padding: '0 14px 8px' }}>{note}</p>}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: DISPLAY, maxWidth: 1100, margin: '0 auto', paddingBottom: 80 }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 18 }}>
        <button
          onClick={() => step === 'preview' ? setStep('form') : router.back()}
          style={{
            ...btnBase, fontSize: 17,
            background: 'transparent',
            border: `1px solid ${T.border}`,
            color: T.muted, padding: '11px 26px',
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.color = T.orange; (e.target as HTMLElement).style.borderColor = T.orange; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.color = T.muted; (e.target as HTMLElement).style.borderColor = T.border; }}
        >← RETOUR</button>

        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: MONO, fontSize: 16, color: T.orange, letterSpacing: '0.15em', marginBottom: 6 }}>
            ■ MDT › RAPPORTS › CHIRURGIE
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: 40, fontWeight: 700, color: T.text, letterSpacing: '0.03em', lineHeight: 1 }}>
            🔪 Chirurgie
          </div>
        </div>

        <div style={{
          fontFamily: MONO, fontSize: 17, padding: '6px 16px',
          border: `1px solid ${T.border}`, color: T.orange, background: T.orangeDim, letterSpacing: '0.12em',
        }}>
          {step === 'form' ? 'FORMULAIRE' : 'RAPPORT GÉNÉRÉ'}
        </div>
      </div>

      {step === 'form' && (<>

        {/* ── RACCOURCIS ───────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 18 }}>
          <button onClick={() => setShowR(!showR)} style={{
            ...btnBase, width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '13px 20px', fontSize: 17,
            background: 'rgba(192,132,252,0.04)',
            border: '1px solid rgba(192,132,252,0.25)',
            color: '#C084FC',
          }}>
            <span>🔪 RACCOURCIS CHIRURGIE — REMPLISSAGE AUTOMATIQUE</span>
            <span style={{ color: T.dim, fontWeight: 400 }}>{showR ? '▲' : '▼'}</span>
          </button>

          {showR && (
            <div style={{
              marginTop: 2, padding: 18,
              background: 'rgba(0,0,0,0.45)',
              border: `1px solid ${T.borderSub}`,
              borderTop: 'none',
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {categories.map(c => (
                  <button key={c} onClick={() => setCat(c)} style={{
                    ...btnBase, fontSize: 16, padding: '5px 14px',
                    background: cat === c ? 'rgba(192,132,252,0.15)' : 'transparent',
                    border: `1px solid ${cat === c ? '#C084FC' : T.borderSub}`,
                    color: cat === c ? '#C084FC' : T.dim,
                    fontWeight: cat === c ? 700 : 400,
                  }}>{c}</button>
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {raccourcisChirurgie.filter(r => r.categorie === cat).map(r => {
                  const gc = gs(r.gravite);
                  return (
                    <button key={r.label} onClick={() => applyRaccourci(r)} style={{
                      ...btnBase, fontSize: 16, padding: '9px 18px',
                      background: gc.bg, border: `1px solid ${gc.border}`,
                      color: gc.text, fontWeight: 400,
                    }}>{r.label}</button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 20, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.borderSub}` }}>
                {Object.entries(GC).reverse().map(([k, c]) => (
                  <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: MONO, fontSize: 16, color: c.text }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── S1 : INFOS GÉNÉRALES ─────────────────────────────────────────── */}
        <Section icon="📋" title="Informations générales" color="orange">
          <div style={grid2}>
            <div>
              <L t="Date" req />
              <FI k="date" v={vals} s={set} type="date" />
            </div>
            <div>
              <L t="Heure de prise en charge" />
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="time" value={vals.heure || ''} onChange={e => set('heure', e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                  onFocus={e => (e.target.style.borderColor = T.orange)}
                  onBlur={e => (e.target.style.borderColor = T.borderSub.toString())}
                />
                <button onClick={() => set('heure', new Date().toTimeString().slice(0, 5))} style={{
                  ...btnBase, fontSize: 16, padding: '0 18px',
                  background: T.orangeDim, border: `1px solid ${T.border}`,
                  color: T.orange, whiteSpace: 'nowrap',
                }}>MAINTENANT</button>
              </div>
            </div>
          </div>

          <div>
            <L t="Civilité" />
            <div style={{ display: 'flex', gap: 8 }}>
              {['Monsieur', 'Madame'].map(c => (
                <button key={c} onClick={() => set('civilite', c)} style={{
                  ...btnBase, fontSize: 18, padding: '8px 22px',
                  background: vals.civilite === c ? T.orange : 'transparent',
                  border: `1px solid ${vals.civilite === c ? T.orange : T.borderSub}`,
                  color: vals.civilite === c ? '#fff' : T.dim,
                }}>{c}</button>
              ))}
            </div>
          </div>

          <div style={grid2}>
            <div><L t="Nom du patient" req /><FI k="nom" v={vals} s={set} ph="Nom de famille" /></div>
            <div><L t="Prénom" /><FI k="prenom" v={vals} s={set} ph="Ex: Sofiane" /></div>
          </div>

          <div>
            <L t="Motif opératoire" req />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {['Blessure par balle', 'Arme blanche', 'Traumatisme fermé', 'AVP', 'Chute', 'Fracture ouverte', 'Lésion interne', 'Autre'].map(m => (
                <Chip key={m} label={m}
                  active={vals.motif === m}
                  onClick={() => set('motif', vals.motif === m ? '' : m)} />
              ))}
            </div>
            <input value={vals.motif || ''} onChange={e => set('motif', e.target.value)}
              placeholder="Précisez ou complétez le motif..." style={inputStyle} />
          </div>

          <div style={grid2}>
            <div><L t="Localisation de la blessure" req /><FI k="localisation_blessure" v={vals} s={set} ph="Ex: Torse, flanc droit — région pectorale" /></div>
            <div><L t="Lieu d'intervention" /><FI k="lieu" v={vals} s={set} ph="Ex: Bloc opératoire SAMS" /></div>
          </div>
        </Section>

        {/* ── S2 : ÉTAT À L'ADMISSION ───────────────────────────────────────── */}
        <Section icon="🏥" title="État initial à l'admission" color="red">
          <div>
            <L t="Description de l'état" req />
            <FT k="etat_admission" v={vals} s={set}
              ph="Ex: Patient conscient, orienté. Douleur intense évaluée à 10/10. Plaie balistique non traversante..."
              rows={4} />
          </div>

          <div>
            <L t="Constantes à l'admission" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <VitalBox label="FC" fkey="fc_pre" unit="bpm" ph="98" note="Normal : 60–100" />
              <VitalBox label="TA" fkey="ta_pre" unit="mmHg" ph="118/75" note="Normal : 120/80" />
              <VitalBox label="SpO₂" fkey="spo2_pre" unit="%" ph="97" note="Normal : ≥ 95" />
              <VitalBox label="Température" fkey="temperature_pre" unit="°C" ph="36.9" note="Normal : 36.1–37.8" />
            </div>
          </div>

          <div>
            <L t="État général pré-opératoire" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {['Stable', 'Précaire', 'Critique', 'Conscient orienté', 'Inconscient', 'Douloureux', 'Agité'].map(e => (
                <Chip key={e} label={e}
                  active={vals.etat_general_pre === e}
                  onClick={() => set('etat_general_pre', vals.etat_general_pre === e ? '' : e)}
                  ac={{ border: '#F87171', bg: 'rgba(248,113,113,0.12)', color: '#F87171' }} />
              ))}
            </div>
          </div>
        </Section>

        {/* ── S3 : PRÉ-OPÉRATOIRE ───────────────────────────────────────────── */}
        <Section icon="⚕️" title="Prise en charge pré-opératoire" color="cyan">
          <div>
            <L t="Protocole pré-opératoire" />
            <FT k="pre_op" v={vals} s={set}
              ph={'• Mise sous monitorage standard\n• Voie veineuse périphérique\n• Administration de MEOPA\n• Pansement compressif...'}
              rows={5} />
          </div>
        </Section>

        {/* ── S4 : EXAMENS ──────────────────────────────────────────────────── */}
        <Section icon="🔬" title="Examens complémentaires" color="yellow">
          <div>
            <L t="Type d'examen" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {['Radiographie', 'Scanner', 'IRM', 'Échographie', 'Biologie', 'Aucun'].map(e => (
                <Chip key={e} label={e}
                  active={vals.type_examen === e}
                  onClick={() => set('type_examen', vals.type_examen === e ? '' : e)}
                  ac={{ border: '#FDE047', bg: 'rgba(253,224,71,0.12)', color: '#FDE047' }} />
              ))}
            </div>
            <input value={vals.type_examen || ''} onChange={e => set('type_examen', e.target.value)}
              placeholder="Précisez..." style={inputStyle} />
          </div>
          <div>
            <L t="Résultats et interprétation" />
            <FT k="resultats_examen" v={vals} s={set}
              ph="Ex: Projectile localisé dans les tissus mous. Absence d'atteinte pulmonaire..."
              rows={4} />
          </div>
        </Section>

        {/* ── S5 : INTERVENTION ─────────────────────────────────────────────── */}
        <Section icon="🔪" title="Intervention chirurgicale" color="purple">
          <div>
            <L t="Anesthésie" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {['Anesthésie générale', 'Anesthésie locale', 'Anesthésie locorégionale', 'ALR', 'Rachianesthésie'].map(a => (
                <Chip key={a} label={a}
                  active={vals.anesthesie === a}
                  onClick={() => set('anesthesie', vals.anesthesie === a ? '' : a)}
                  ac={{ border: '#C084FC', bg: 'rgba(192,132,252,0.12)', color: '#C084FC' }} />
              ))}
            </div>
            <input value={vals.anesthesie || ''} onChange={e => set('anesthesie', e.target.value)}
              placeholder="Précisez le protocole anesthésique..." style={inputStyle} />
          </div>

          <div>
            <L t="Protocole opératoire" req />
            <FT k="protocole_op" v={vals} s={set}
              ph={'1. Désinfection large du champ opératoire.\n2. Mise en place de champs stériles.\n3. Incision contrôlée...\n...'}
              rows={8} />
          </div>

          <div>
            <L t="Complications per-opératoires" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {['Aucune', 'Saignement', 'Instabilité hémodynamique', 'Lésion adjacente', 'Allergie anesthésique'].map(c => (
                <Chip key={c} label={c}
                  active={vals.complications_per_op === c}
                  onClick={() => set('complications_per_op', vals.complications_per_op === c ? '' : c)}
                  ac={{ border: '#F87171', bg: 'rgba(248,113,113,0.12)', color: '#F87171' }} />
              ))}
            </div>
            <input value={vals.complications_per_op || ''} onChange={e => set('complications_per_op', e.target.value)}
              placeholder="Précisez..." style={inputStyle} />
          </div>
        </Section>

        {/* ── S6 : SUITES OPÉRATOIRES ───────────────────────────────────────── */}
        <Section icon="📈" title="Suites opératoires" color="green">
          <div>
            <L t="Suites immédiates" req />
            <FT k="suites_op" v={vals} s={set}
              ph="Ex: Douleur contrôlée. Constantes stables. Pas de saignement secondaire..."
              rows={3} />
          </div>

          <div>
            <L t="Constantes post-opératoires" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <VitalBox label="FC post-op" fkey="fc_post" unit="bpm" ph="82" />
              <VitalBox label="TA post-op" fkey="ta_post" unit="mmHg" ph="120/75" />
              <VitalBox label="SpO₂ post-op" fkey="spo2_post" unit="%" ph="99" />
              <VitalBox label="Temp. post-op" fkey="temperature_post" unit="°C" ph="36.8" />
            </div>
          </div>
        </Section>

        {/* ── S7 : TRAITEMENT POST-OP ───────────────────────────────────────── */}
        <Section icon="💊" title="Traitement post-opératoire" color="cyan">
          <div style={grid2}>
            <div><L t="Antalgique" /><FI k="antalgique" v={vals} s={set} ph="Ex: Paracétamol 1g x3/jour" /></div>
            <div><L t="Anti-inflammatoire" /><FI k="anti_inflammatoire" v={vals} s={set} ph="Ex: Ibuprofène 400mg" /></div>
            <div><L t="Antibiothérapie" /><FI k="antibiotique" v={vals} s={set} ph="Ex: Prophylaxie selon protocole" /></div>
            <div><L t="Soins locaux" /><FT k="soins_post_op" v={vals} s={set} ph="Ex: Surveillance plaie, pansement..." rows={2} /></div>
          </div>
        </Section>

        {/* ── S8 : GRAVITÉ ─────────────────────────────────────────────────── */}
        <Section icon="⚠️" title="Gravité & Pronostic" color="yellow">
          <div>
            <L t="Gravité" />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['FAIBLE', 'MOYENNE', 'ELEVEE', 'CRITIQUE'] as const).map(gv => {
                const gc = GC[gv];
                const active = vals.gravite === gv;
                return (
                  <button key={gv} onClick={() => set('gravite', gv)} style={{
                    ...btnBase, fontSize: 17, padding: '8px 18px',
                    display: 'flex', alignItems: 'center', gap: 7,
                    background: active ? gc.bg : 'transparent',
                    border: `1px solid ${active ? gc.border : T.borderSub}`,
                    color: active ? gc.text : T.dim,
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: gc.dot, display: 'inline-block' }} />
                    {gv}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <L t="Conclusion / Pronostic" req />
            <FT k="conclusion" v={vals} s={set}
              ph="Ex: Blessure par balle non traversante, projectile extrait avec succès. Évolution immédiate favorable. Pronostic fonctionnel bon..."
              rows={4} />
          </div>
        </Section>

        {/* ── S9 : RECOMMANDATIONS ─────────────────────────────────────────── */}
        <Section icon="📌" title="Recommandations post-opératoires" color="green">
          <div style={grid2}>
            <div><L t="Durée d'ATA" /><FI k="ata" v={vals} s={set} ph="Ex: 24 heures minimum" /></div>
            <div><L t="Retour en consultation" /><FI k="suivi_date" v={vals} s={set} ph="Ex: Dans les 24h" /></div>
          </div>
          <div><L t="Restrictions physiques" /><FT k="restrictions" v={vals} s={set} ph="Ex: Repos relatif. Éviter les efforts du membre opéré." rows={2} /></div>
          <div><L t="Surveillance des symptômes" /><FT k="surveillance" v={vals} s={set}
            ph={'• Douleur thoracique\n• Fièvre\n• Difficulté respiratoire\n• Saignement...'} rows={4} /></div>
        </Section>

        {/* ── S10 : RÉDACTEUR ──────────────────────────────────────────────── */}
        <Section icon="✍️" title="Rapport rédigé par" color="orange">
          <div><L t="Nom & Grade" req /><FI k="redacteur" v={vals} s={set} ph="Ex: Chirurgien Ethan Skoll" /></div>
        </Section>

        {err && <p style={{ fontFamily: MONO, fontSize: 16, color: '#F87171', marginTop: 8 }}>{err}</p>}

        <button onClick={generate} disabled={loading} style={{
          ...btnBase, width: '100%', marginTop: 8,
          padding: '20px 36px', fontSize: 19,
          background: loading ? T.orangeDim : 'linear-gradient(135deg, #F97316, #C2410C)',
          border: `1px solid ${T.orange}`, color: '#fff',
          opacity: loading ? 0.6 : 1,
          boxShadow: loading ? 'none' : '0 0 24px rgba(249,115,22,0.30)',
        }}>
          {loading ? '⏳ GÉNÉRATION EN COURS...' : '📄 GÉNÉRER LE COMPTE RENDU OPÉRATOIRE'}
        </button>
      </>)}

      {/* ══ PRÉVISUALISATION ════════════════════════════════════════════════ */}
      {step === 'preview' && (<>
        <div style={{
          padding: '12px 20px', marginBottom: 18,
          display: 'flex', alignItems: 'center', gap: 14,
          background: g.bg, border: `1px solid ${g.border}`,
          borderLeft: `3px solid ${g.dot}`,
        }}>
          <span style={{ fontFamily: MONO, fontSize: 17, fontWeight: 700, color: g.text, letterSpacing: '0.12em' }}>{g.label}</span>
          <span style={{ color: T.borderSub }}>—</span>
          <span style={{ fontFamily: DISPLAY, fontSize: 19, color: T.muted }}>{vals.civilite} {vals.prenom} {vals.nom}</span>
          <span style={{ color: T.borderSub }}>—</span>
          <span style={{ fontFamily: MONO, fontSize: 16, color: T.dim }}>COMPTE RENDU OPÉRATOIRE</span>
        </div>

        <div style={{
          background: T.card, border: `1px solid ${T.border}`,
          borderLeft: `3px solid ${T.orange}`,
          padding: '20px 24px',
        }}>
          <textarea
            value={report} onChange={e => setReport(e.target.value)} rows={55}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'transparent', border: 'none', outline: 'none',
              color: T.text, fontFamily: MONO, fontSize: 17,
              lineHeight: 1.7, resize: 'vertical',
            }}
          />
        </div>

        {err && <p style={{ fontFamily: MONO, fontSize: 16, color: '#F87171', marginTop: 8 }}>{err}</p>}

        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button onClick={save} disabled={saving} style={{
            ...btnBase, flex: 1, padding: '18px 36px', fontSize: 18,
            background: saving ? T.orangeDim : 'linear-gradient(135deg, #F97316, #C2410C)',
            border: `1px solid ${T.orange}`, color: '#fff',
            opacity: saving ? 0.6 : 1,
            boxShadow: saving ? 'none' : '0 0 20px rgba(249,115,22,0.25)',
          }}>
            {saving ? '💾 SAUVEGARDE...' : '💾 SAUVEGARDER DANS LES ARCHIVES'}
          </button>
          <button onClick={() => setStep('form')} style={{
            ...btnBase, padding: '18px 28px', fontSize: 18,
            background: 'transparent',
            border: `1px solid ${T.borderSub}`,
            color: T.muted,
          }}>✏️ MODIFIER</button>
        </div>
      </>)}
    </div>
  );
}
