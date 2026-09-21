export const DISPLAY = "'Central Station', 'Georgia', serif";
export const MONO    = "'Libre Baskerville', 'Courier New', monospace";
export const BODY    = "'Cormorant Garamond', 'Georgia', serif";
export const T = { bg: '#102B3B', card: '#183746', border: 'rgba(139,90,43,0.30)', gold: '#D1B77C', text: '#EADCB9', muted: '#C8BEA5', dim: '#C8BEA5' };
export const inp: React.CSSProperties = { fontFamily: MONO, fontSize: 15, background: 'rgba(0,0,0,0.28)', border: `1px solid ${T.border}`, color: T.text, padding: '10px 14px', outline: 'none', boxSizing: 'border-box', width: '100%' };
export const lbl: React.CSSProperties = { fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.12em', marginBottom: 6, display: 'block' };

export type DocCreationType = 'Suivi de grossesse' | 'Prescription médicale' | "Compte-rendu d'accouchement";
export const COL_SUIVI = '#526C45';
export const COL_RX    = '#A0784A';
export const COL_ACC   = '#6B7ABB';

export function rpDate(d = new Date()) {
  const s = d.toLocaleDateString('fr-FR').split('/'); s[2] = String(Number(s[2]) - 136); return s.join('/');
}
export function rpDisplay(date: string): string {
  const p = date.split('/');
  if (p.length !== 3) return date;
  const y = Number(p[2]);
  if (isNaN(y)) return date;
  p[2] = String(y >= 1900 ? y - 136 : y);
  return p.join('/');
}

export interface Patiente {
  id: string; patientNom: string; patientPrenom: string; patientAge: string;
  type: string; statut: string;
}
export interface DocResult {
  id: string; patientId: string; type: DocCreationType | string;
  titre: string; contenu: string; date: string; createdAt: string;
}

/* ── Scénarios proposés par type de document ── */
export interface Scenario {
  id: string; label: string; texte: string;
  etatGeneral?: string; niveauSurveillance?: string;
  examensLabel?: string; examens?: string[];
  evolution?: string;
  recommandationsLabel?: string; recommandations?: string[];
  reposParDefaut?: string; controleParDefaut?: string;
  prioritaires?: string[];
}

export const SUIVI_SCENARIOS: Scenario[] = [
  {
    id: 'normal', label: 'Grossesse normale — suivi de routine',
    texte: "Consultation régulière dans le cadre du suivi de grossesse. Aucun trouble particulier signalé avant l'examen.",
    etatGeneral: 'Bon', niveauSurveillance: 'Suivi ordinaire',
    examensLabel: 'EXAMENS À RÉALISER',
    examens: [
      "Observation de l'état général de la mère.",
      'Recherche de douleurs, saignements ou malaises.',
      "Palpation prudente de l'abdomen.",
      'Évaluation de la croissance abdominale.',
      "Recherche des mouvements de l'enfant si le terme le permet.",
      "Écoute des battements du cœur de l'enfant si le terme le permet.",
      "Recherche d'un gonflement inhabituel des jambes ou des pieds.",
    ],
    evolution: "Grossesse faisant l'objet d'un suivi ordinaire. Aucun facteur de risque particulier connu avant l'examen.",
    recommandationsLabel: 'RECOMMANDATIONS PAR DÉFAUT',
    recommandations: [
      'Alimentation régulière et suffisamment nourrissante.',
      'Hydratation régulière.',
      "Repos adapté à l'état de fatigue.",
      'Éviter les efforts physiques excessifs et le port de charges lourdes.',
      'Poursuite du suivi régulier de la grossesse.',
    ],
    reposParDefaut: 'Habituel', controleParDefaut: '1 mois',
  },
  {
    id: 'surveiller', label: 'À surveiller — facteurs de risque modérés',
    texte: "Consultation de suivi nécessitant une attention particulière en raison d'un ou plusieurs facteurs susceptibles de compliquer la grossesse.",
    etatGeneral: "À déterminer lors de l'examen", niveauSurveillance: 'Renforcé',
    examensLabel: 'EXAMENS À RÉALISER',
    examens: [
      'Examen général approfondi de la mère.',
      'Recherche de douleurs abdominales ou lombaires.',
      'Recherche de saignements ou pertes inhabituelles.',
      'Recherche de malaises, vertiges ou faiblesse importante.',
      "Palpation prudente de l'abdomen.",
      'Surveillance de la croissance abdominale.',
      "Observation des mouvements de l'enfant si perceptibles.",
      "Écoute des battements du cœur de l'enfant si possible.",
      'Recherche de gonflements inhabituels.',
    ],
    evolution: "Grossesse nécessitant une surveillance plus attentive. La nature et l'importance des facteurs de risque devront être précisées au cours de la consultation.",
    recommandationsLabel: 'RECOMMANDATIONS PAR DÉFAUT',
    recommandations: [
      'Repos accru.',
      'Limitation des efforts physiques importants.',
      'Éviter les longues chevauchées et déplacements éprouvants.',
      'Surveillance de tout nouveau symptôme.',
      'Consultations de contrôle plus rapprochées.',
    ],
    reposParDefaut: 'Modéré', controleParDefaut: '2 semaines',
  },
  {
    id: 'risque', label: 'Risque élevé — surveillance rapprochée',
    texte: "Suivi d'une grossesse considérée comme présentant un risque important pour la mère, l'enfant ou les deux. Surveillance médicale rapprochée nécessaire.",
    etatGeneral: 'À surveiller étroitement', niveauSurveillance: 'Élevé',
    examensLabel: 'EXAMENS À RÉALISER',
    examens: [
      "Examen complet de l'état général de la mère.",
      'Recherche systématique de douleurs, saignements et malaises.',
      "Surveillance de l'apparition de fièvre ou d'une faiblesse inhabituelle.",
      "Palpation prudente de l'abdomen.",
      'Surveillance attentive de la croissance abdominale.',
      "Contrôle des mouvements de l'enfant lorsqu'ils sont perceptibles.",
      "Écoute des battements du cœur de l'enfant lorsque cela est possible.",
      'Recherche de contractions prématurées.',
      "Recherche d'un gonflement important des membres.",
    ],
    evolution: "Grossesse nécessitant une surveillance médicale rapprochée. Toute modification de l'état de la mère ou de l'enfant devra faire l'objet d'un nouvel examen.",
    recommandationsLabel: 'RECOMMANDATIONS PAR DÉFAUT',
    recommandations: [
      'Repos important.',
      'Efforts physiques fortement limités.',
      'Éviter les déplacements non indispensables.',
      'Contrôles médicaux rapprochés.',
      "Prévoir à l'avance les dispositions nécessaires à l'accouchement.",
      "Consultation immédiate en cas d'apparition ou d'aggravation d'un symptôme.",
    ],
    reposParDefaut: 'Important', controleParDefaut: '1 semaine',
  },
  {
    id: 'urgence', label: "Consultation d'urgence",
    texte: "Patiente reçue en urgence au cours de sa grossesse en raison de symptômes ou d'un événement nécessitant un examen médical immédiat.",
    etatGeneral: 'À déterminer immédiatement', niveauSurveillance: 'Urgence',
    examensLabel: 'EXAMENS À RÉALISER EN PRIORITÉ',
    examens: [
      "Évaluation immédiate de l'état de conscience et de l'état général de la mère.",
      "Recherche d'une hémorragie.",
      'Recherche et localisation des douleurs.',
      'Recherche de contractions.',
      "Palpation prudente de l'abdomen lorsque l'état le permet.",
      "Recherche des mouvements de l'enfant si le terme le permet.",
      "Écoute des battements du cœur de l'enfant lorsque cela est possible.",
      "Recherche d'un traumatisme récent, d'une chute ou d'un choc.",
      'Recherche de fièvre, malaise ou faiblesse importante.',
    ],
    evolution: "État de la grossesse à déterminer après examen. Aucun pronostic ne doit être automatiquement établi avant les constatations médicales.",
    recommandationsLabel: 'CONDUITE À TENIR PAR DÉFAUT',
    recommandations: [
      'Mise au repos immédiate de la patiente.',
      'Surveillance rapprochée.',
      'Limitation des déplacements.',
      "Traitement adapté aux constatations de l'examen.",
      "Maintien au dispensaire si l'état de la patiente nécessite une observation prolongée.",
    ],
    reposParDefaut: 'Strict', controleParDefaut: 'Consultation immédiate si aggravation',
    prioritaires: ['etatGeneral', 'saignements', 'douleurs', 'contractions', 'mouvements', 'battements', 'vertiges'],
  },
];

export const RX_SCENARIOS: Scenario[] = [
  { id: 'nausees',  label: 'Nausées et malaises de grossesse', texte: 'Nausées, vertiges et malaises rapportés par la patiente, sans caractère de gravité.' },
  { id: 'douleurs', label: 'Douleurs et tensions',             texte: 'Douleurs et tensions rapportées par la patiente, nécessitant un soulagement.' },
  { id: 'sommeil',  label: 'Troubles du sommeil',              texte: 'Difficultés d’endormissement et sommeil agité rapportés par la patiente.' },
  { id: 'anemie',   label: 'Fortifiant / anémie',              texte: 'Signes de fatigue et de pâleur évoquant une anémie légère.' },
  { id: 'autre',    label: 'Autre indication',                 texte: '' },
];

export const ACC_SCENARIOS: Scenario[] = [
  { id: 'normal',     label: 'Accouchement normal, sans complication',
    texte: "L'accouchement s'est déroulé normalement, sans complication notable. La mère et l'enfant se portent bien." },
  { id: 'complique',  label: 'Accouchement avec complications maîtrisées',
    texte: "L'accouchement a présenté des complications, maîtrisées grâce aux soins prodigués. La mère et l'enfant se portent bien à l'issue." },
  { id: 'difficile',  label: 'Accouchement difficile — mère et enfant sauvés',
    texte: "L'accouchement s'est révélé difficile et a mis en péril la mère et l'enfant. Les soins prodigués ont permis de les sauver l'un et l'autre." },
  { id: 'mortne',     label: "Issue tragique — enfant mort-né",
    texte: "Malgré tous les soins prodigués, l'enfant n'a pu être sauvé. La mère a survécu à l'accouchement." },
  { id: 'perte_mere', label: 'Issue tragique — perte de la mère',
    texte: "Malgré tous les soins prodigués, la mère n'a pu survivre à l'accouchement." },
];

export function scenariosFor(type: DocCreationType): Scenario[] {
  if (type === 'Suivi de grossesse') return SUIVI_SCENARIOS;
  if (type === 'Prescription médicale') return RX_SCENARIOS;
  return ACC_SCENARIOS;
}

/* ── Champs structurés par type ── */
export interface SuiviFields {
  heure: string; semaines: string;
  poids: string; evolutionPoids: string;
  grossessesAnt: string; accouchementsAnt: string; fcAnt: string;
  etatGeneral: string; appetit: string; nausees: string; vomissements: string; vertiges: string; gonflement: string;
  douleurs: string; douleursLocalisation: string[]; douleursAutre: string;
  saignements: string; saignementsDepuis: string; saignementsFrequence: string; saignementsDouleurs: string;
  pertesInhabituelles: string;
  mouvements: string; battements: string; croissance: string; palpation: string; contractions: string; position: string;
  complications: string[]; complicationsAutre: string;
  reposConseille: string; prochainControle: string;
}
export const SUIVI_EMPTY: SuiviFields = {
  heure: '', semaines: '',
  poids: '', evolutionPoids: '',
  grossessesAnt: '', accouchementsAnt: '', fcAnt: '',
  etatGeneral: '', appetit: '', nausees: '', vomissements: '', vertiges: '', gonflement: '',
  douleurs: '', douleursLocalisation: [], douleursAutre: '',
  saignements: '', saignementsDepuis: '', saignementsFrequence: '', saignementsDouleurs: '',
  pertesInhabituelles: '',
  mouvements: '', battements: '', croissance: '', palpation: '', contractions: '', position: '',
  complications: [], complicationsAutre: '',
  reposConseille: '', prochainControle: '',
};

export const SEMAINES_OPTIONS = ['', ...Array.from({ length: 19 }, (_, i) => String(4 + i * 2))]; // 4 à 40 semaines, par pas de 2
export function moisDeGrossesse(semaines: string): string {
  const n = Number(semaines);
  if (!n) return '';
  const mois = Math.min(9, Math.max(1, Math.ceil(n / 4)));
  const suffixe = mois === 1 ? 'er' : 'e';
  return `${mois}${suffixe} mois`;
}

export const EVOLUTION_POIDS_OPTIONS = ['', 'Non connue', 'Stable', 'Légère prise', 'Prise importante', 'Légère perte', 'Perte importante'];
export const GROSSESSES_ANT_OPTIONS = ['', 'Première grossesse', '1', '2', '3', '4', '5 ou plus', 'Inconnu'];
export const ACCOUCHEMENTS_ANT_OPTIONS = ['', 'Aucun', '1', '2', '3', '4 ou plus', 'Inconnu'];
export const FC_ANT_OPTIONS = ['', 'Aucune', '1', '2', '3 ou plus', 'Inconnu'];

export const ETAT_GENERAL_OPTIONS = ['', 'Très bon', 'Bon', 'Satisfaisant', 'Fatiguée', 'Affaiblie', 'Préoccupant'];
export const APPETIT_OPTIONS = ['', 'Normal', 'Augmenté', 'Diminué', 'Très faible'];
export const NAUSEES_OPTIONS = ['', 'Aucune', 'Légères', 'Modérées', 'Importantes'];
export const VOMISSEMENTS_OPTIONS = ['', 'Aucun', 'Occasionnels', 'Fréquents', 'Importants'];
export const VERTIGES_OPTIONS = ['', 'Aucun', 'Occasionnels', 'Fréquents', 'Malaise avec perte de connaissance'];
export const GONFLEMENT_OPTIONS = ['', 'Aucun', 'Pieds', 'Chevilles', 'Jambes', 'Mains', 'Généralisé'];

export const DOULEURS_OPTIONS = ['', 'Aucune', 'Légères', 'Modérées', 'Fortes', 'Très fortes'];
export const DOULEURS_LOCALISATION_OPTIONS = ['Bas-ventre', 'Abdomen', 'Dos', 'Bassin', 'Jambes', 'Tête', 'Autre'];
export const SAIGNEMENTS_OPTIONS = ['', 'Aucun', 'Traces légères', 'Modérés', 'Importants'];
export const OUI_NON_OPTIONS = ['', 'Oui', 'Non'];
export const PERTES_OPTIONS = ['', 'Aucune', 'Légères', 'Importantes', 'À examiner'];

export const MOUVEMENTS_OPTIONS = ['', 'Non encore perceptibles', 'Perçus, faibles', 'Perçus, réguliers', 'Très actifs', 'Diminution récente', "Absents alors qu'habituellement perçus"];
export const BATTEMENTS_OPTIONS = ['', 'Non recherchés', 'Non perceptibles', 'Perçus, réguliers', 'Perçus, irréguliers', 'Difficiles à percevoir'];
export const CROISSANCE_OPTIONS = ['', 'Conforme au terme estimé', 'Semble faible', 'Semble importante', 'À surveiller'];
export const PALPATION_OPTIONS = ['', 'Souple et indolore', 'Sensible', 'Douloureuse', 'Tension inhabituelle', 'Non réalisée'];
export const CONTRACTIONS_OPTIONS = ['', 'Aucune', 'Occasionnelles', 'Régulières', 'Fréquentes et douloureuses'];
export const POSITION_OPTIONS = ['', 'Non déterminable', 'Tête vers le bas', 'Siège', 'Transversale', 'Position incertaine'];

export const COMPLICATIONS_OPTIONS = [
  'Aucune connue', 'Saignements', 'Douleurs abdominales', 'Vomissements importants', 'Faiblesse importante',
  'Malaises / vertiges', 'Gonflement important', 'Contractions précoces', "Diminution des mouvements de l'enfant",
  'Chute ou traumatisme récent', 'Fièvre', 'Antécédent de fausse couche', 'Accouchement antérieur difficile', 'Autre',
];

export const REPOS_OPTIONS = ['', 'Habituel', 'Modéré', 'Important', 'Strict'];
export const CONTROLE_OPTIONS = ['', '24 heures', '48 heures', '1 semaine', '2 semaines', '1 mois', 'Selon évolution', 'Consultation immédiate si aggravation'];

/** Champs dont la valeur doit être mise en évidence visuellement (résultat préoccupant) */
export function estAlerte(champ: keyof SuiviFields, valeur: string): boolean {
  if (champ === 'contractions') return valeur === 'Régulières' || valeur === 'Fréquentes et douloureuses';
  if (champ === 'mouvements') return valeur === 'Diminution récente' || valeur === "Absents alors qu'habituellement perçus";
  return false;
}

export interface RxFields { indication: string; remede: string; posologie: string; }
export const RX_EMPTY: RxFields = { indication: '', remede: '', posologie: '' };

export interface AccFields { heure: string; lieu: string; duree: string; presentation: string; sexe: string; }
export const ACC_EMPTY: AccFields = { heure: '', lieu: '', duree: '', presentation: '', sexe: '' };
export const LIEU_OPTIONS = ['', 'Dispensaire', 'Domicile'];
export const PRESENTATION_OPTIONS = ['', 'Céphalique', 'Siège', 'Autre'];
export const SEXE_OPTIONS = ['', 'Garçon', 'Fille'];

/* ── Génération du document à partir des champs + scénario ── */
export function genSuivi(nom: string, age: string, date: string, f: SuiviFields, scenario: Scenario): string {
  const mois = moisDeGrossesse(f.semaines) || '[Xᵉ mois]';

  const antecedents = [
    `— Grossesses antérieures : ${f.grossessesAnt || '[—]'}`,
    `— Accouchements antérieurs : ${f.accouchementsAnt || '[—]'}`,
    `— Fausses couches antérieures : ${f.fcAnt || '[—]'}`,
  ].join('\n');

  const douleursLignes = [`— Douleurs : ${f.douleurs || '[—]'}`];
  if (f.douleurs && f.douleurs !== 'Aucune') {
    if (f.douleursLocalisation.length) douleursLignes.push(`— Localisation : ${f.douleursLocalisation.join(', ')}${f.douleursLocalisation.includes('Autre') && f.douleursAutre ? ` (${f.douleursAutre})` : ''}`);
  }
  const saignementsLignes = [`— Saignements : ${f.saignements || '[—]'}`];
  if (f.saignements && f.saignements !== 'Aucun') {
    if (f.saignementsDepuis) saignementsLignes.push(`— Depuis : ${f.saignementsDepuis}`);
    if (f.saignementsFrequence) saignementsLignes.push(`— Fréquence : ${f.saignementsFrequence}`);
    if (f.saignementsDouleurs) saignementsLignes.push(`— Douleurs associées : ${f.saignementsDouleurs}`);
  }

  const complicationsListe = f.complications.length
    ? f.complications.map(c => `— ${c}${c === 'Autre' && f.complicationsAutre ? ` (${f.complicationsAutre})` : ''}`).join('\n')
    : '— [Aucune sélectionnée]';

  return `# RAPPORT DE SUIVI DE GROSSESSE

DISPENSAIRE DE LITTLE CREEK — COMTÉ DE WEST ELIZABETH · 1890
FICHE DE SUIVI DE GROSSESSE

PATIENTE : ${nom}
ÂGE : ${age || '[Âge]'}
DATE DE CONSULTATION : ${date}
HEURE : ${f.heure || '[HHhMM]'}

MOIS DE GROSSESSE : ${mois}
POIDS CONSTATÉ : ${f.poids || '[—]'}
ÉVOLUTION DU POIDS : ${f.evolutionPoids || '[—]'}

══════════════════════════════════════════════

## MOTIF DE LA CONSULTATION

${scenario.texte}

══════════════════════════════════════════════

## ANTÉCÉDENTS DE GROSSESSE

${antecedents}

══════════════════════════════════════════════

## ÉTAT GÉNÉRAL DE LA MÈRE

— État général : ${f.etatGeneral || '[—]'}
— Niveau de surveillance : ${scenario.niveauSurveillance ?? '[—]'}
— Appétit : ${f.appetit || '[—]'}
— Nausées : ${f.nausees || '[—]'}
— Vomissements : ${f.vomissements || '[—]'}
— Vertiges / malaises : ${f.vertiges || '[—]'}
— Gonflement : ${f.gonflement || '[—]'}

══════════════════════════════════════════════

## DOULEURS ET SAIGNEMENTS

${douleursLignes.join('\n')}
${saignementsLignes.join('\n')}
— Pertes inhabituelles : ${f.pertesInhabituelles || '[—]'}

══════════════════════════════════════════════

## ${scenario.examensLabel ?? 'EXAMENS À RÉALISER'}

${(scenario.examens ?? []).map(e => `— ${e}`).join('\n')}

RÉSULTATS DE L'EXAMEN :

— Mouvements de l'enfant : ${f.mouvements || '[—]'}
— Battements du cœur de l'enfant : ${f.battements || '[—]'}
— Croissance abdominale : ${f.croissance || '[—]'}
— Palpation abdominale : ${f.palpation || '[—]'}
— Contractions : ${f.contractions || '[—]'}
— Position estimée de l'enfant (par palpation) : ${f.position || '[—]'}

══════════════════════════════════════════════

## ÉVOLUTION DE LA GROSSESSE

${scenario.evolution ?? '[Normale / Satisfaisante / Nécessitant une surveillance particulière.]'}

══════════════════════════════════════════════

## COMPLICATIONS

${complicationsListe}

══════════════════════════════════════════════

## ${scenario.recommandationsLabel ?? 'RECOMMANDATIONS PAR DÉFAUT'}

${(scenario.recommandations ?? []).map(r => `— ${r}`).join('\n')}

— Repos conseillé : ${f.reposConseille || scenario.reposParDefaut || '[—]'}
— Prochain contrôle : ${f.prochainControle || scenario.controleParDefaut || '[—]'}

══════════════════════════════════════════════

## PRÉPARATION À L'ACCOUCHEMENT

LIEU ENVISAGÉ POUR L'ACCOUCHEMENT :

— [Dispensaire de Little Creek / Domicile / Autre]

PERSONNE DEVANT ASSISTER L'ACCOUCHEMENT :

— [Médecin / Sage-femme / Infirmière / À déterminer]

DISPOSITIONS PARTICULIÈRES :

— [À préciser]

══════════════════════════════════════════════

## OBSERVATIONS COMPLÉMENTAIRES

[Informations supplémentaires concernant la grossesse, la mère ou la préparation de l'accouchement.]

══════════════════════════════════════════════

Médecin / infirmière / sage-femme ayant effectué le suivi :

[Nom et signature]`;
}

export function genRx(nom: string, date: string, f: RxFields, scenario: Scenario): string {
  return `Prescription Médicale
Obstétrique — Dispensaire de Little Creek

Patiente
Nom et prénom : ${nom}
Date : ${date}

Indication
${scenario.texte || f.indication || '—'}${scenario.texte && f.indication ? `\n${f.indication}` : ''}

──────────────────────────────────────

${f.remede || '[Nom du remède]'}

Posologie et conseils
${f.posologie || '[À préciser]'}

──────────────────────────────────────

Suivi

Une nouvelle consultation est requise en cas de persistance ou d'aggravation des symptômes.`;
}

export function genAccouchement(nom: string, age: string, date: string, f: AccFields, scenario: Scenario): string {
  return `COMPTE-RENDU D'ACCOUCHEMENT
DISPENSAIRE DE LITTLE CREEK — OBSTÉTRIQUE
Année 1890

IDENTITÉ DE LA PATIENTE
Nom et prénom : ${nom}
Âge : ${age || '—'}

DÉROULEMENT DE L'ACCOUCHEMENT
Date et heure : ${date}${f.heure ? ` à ${f.heure}` : ''}
Lieu : ${f.lieu || '—'}
Durée du travail : ${f.duree || '—'}
Présentation : ${f.presentation || '—'}
Sexe de l'enfant : ${f.sexe || '—'}

ISSUE
${scenario.texte}

RECOMMANDATIONS POST-NATALES
Repos, surveillance et prochaine visite à prévoir selon l'état de la patiente.`;
}
