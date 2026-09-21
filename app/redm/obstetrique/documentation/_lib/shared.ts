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
  remedeNom?: string; remedePreparation?: string; remedePosologie?: string[]; remedeDuree?: string;
  conseils?: string[]; suivi?: string[];
  accDebutTravail?: string; accContractions?: string; accRuptureEaux?: string; accPresentation?: string;
  accProgression?: string; accObservationsTravail?: string;
  accType?: string; accGestes?: string[]; accComplications?: string; accComplicationsDetail?: string;
  accPertesSanguines?: string; accDelivrance?: string;
  accEtatNaissance?: string; accRespiration?: string; accCris?: string; accColoration?: string; accMouvements?: string;
  accSoinsImmediats?: string[];
  accEtatGeneralMere?: string; accConscience?: string; accSaignementsMere?: string; accSoinsEffectues?: string;
  accSurveillanceMere?: string[]; accSurveillanceEnfant?: string[];
  accConclusion?: string;
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
  {
    id: 'nausees', label: 'Nausées et malaises de grossesse',
    texte: "Nausées et malaises légers associés à la grossesse, accompagnés d'une sensation de faiblesse passagère et d'un appétit parfois diminué.",
    remedeNom: 'Infusion de menthe',
    remedePreparation: 'Infusion légère.',
    remedePosologie: [
      'Une tasse, jusqu’à deux fois par jour.',
      'À boire lentement, de préférence après un repas léger.',
    ],
    remedeDuree: "Trois jours, puis réévaluation selon l'évolution des symptômes.",
    conseils: [
      'Prendre plusieurs petits repas dans la journée plutôt que des repas abondants.',
      "Boire régulièrement de l'eau.",
      'Se lever lentement après une période assise ou allongée.',
      'Repos conseillé en cas de malaise.',
      'Éviter les efforts importants tant que la sensation de faiblesse persiste.',
    ],
    suivi: [
      "Nouvelle consultation si les vomissements deviennent répétés, si la patiente ne parvient plus à s'alimenter ou à boire correctement, ou si les malaises deviennent fréquents.",
    ],
  },
  {
    id: 'douleurs', label: 'Douleurs et tensions',
    texte: 'Douleurs musculaires, courbatures et tensions légères à modérées ne présentant aucun signe de fracture ou de lésion grave.',
    remedeNom: "Pommade à l'Arnica",
    remedePreparation: 'Pommade médicinale destinée à l’application externe.',
    remedePosologie: [
      'Appliquer une petite quantité sur la région douloureuse.',
      'Faire pénétrer doucement sans exercer de pression excessive.',
      'Deux applications par jour, matin et soir.',
    ],
    remedeDuree: "Trois à cinq jours selon l'évolution des douleurs.",
    conseils: [
      'Repos de la région douloureuse.',
      'Éviter les efforts physiques importants durant le traitement.',
      'Ne pas appliquer la préparation sur une plaie ouverte ou une peau fortement lésée.',
      'Ne pas ingérer la préparation.',
    ],
    suivi: [
      "Nouvel examen recommandé si la douleur augmente, si un gonflement important apparaît ou si la mobilité devient difficile.",
    ],
  },
  {
    id: 'sommeil', label: 'Troubles du sommeil',
    texte: 'Difficultés d’endormissement, sommeil agité ou réveils nocturnes répétés sans autre affection nécessitant une prise en charge particulière.',
    remedeNom: 'Infusion de Camomille',
    remedePreparation: 'Infusion légère de fleurs de camomille.',
    remedePosologie: [
      'Une tasse le soir.',
      'À prendre environ une demi-heure avant le coucher.',
    ],
    remedeDuree: 'Cinq soirs consécutifs maximum avant réévaluation.',
    conseils: [
      'Favoriser le calme et le repos durant la soirée.',
      'Éviter les excitants et les repas trop importants avant le coucher.',
      'Conserver autant que possible des heures régulières de sommeil.',
      'Ne pas associer spontanément cette préparation à un autre sédatif.',
    ],
    suivi: [
      'En cas de persistance importante des troubles du sommeil, une nouvelle consultation est recommandée afin d’en rechercher la cause avant de prescrire un traitement plus puissant.',
    ],
  },
  {
    id: 'anemie', label: 'Fortifiant / anémie',
    texte: "État de faiblesse générale, fatigue persistante, convalescence ou signes compatibles avec un appauvrissement du sang tels que pâleur, vertiges et diminution de la résistance à l'effort.",
    remedeNom: 'Macération de Panax',
    remedePreparation: 'Préparation fortifiante à base de Panax.',
    remedePosologie: [
      'Une petite dose le matin.',
      'Une prise quotidienne.',
    ],
    remedeDuree: "Sept jours avant réévaluation de l'état général.",
    conseils: [
      'Maintenir une alimentation abondante et variée.',
      'Favoriser notamment les aliments nourrissants et riches en viande, légumes et bouillons.',
      'Boire suffisamment.',
      'Respecter plusieurs périodes de repos au cours de la journée.',
      "Éviter les efforts physiques importants en présence de vertiges ou d'une faiblesse prononcée.",
    ],
    suivi: [
      "Contrôle recommandé après une semaine afin d'évaluer l'évolution de la fatigue, de la pâleur et des éventuels vertiges.",
      "Une aggravation de la faiblesse, des pertes de connaissance ou un essoufflement important nécessitent un nouvel examen médical.",
    ],
  },
  { id: 'autre', label: 'Autre indication', texte: '' },
];

export const ACC_SCENARIOS: Scenario[] = [
  {
    id: 'normal', label: 'Accouchement normal, sans complication',
    texte: "L'accouchement s'est déroulé normalement, sans complication notable. La mère et l'enfant se portent bien.",
    accDebutTravail: 'Spontané', accContractions: 'Régulières', accRuptureEaux: 'Durant le travail',
    accPresentation: 'Tête', accProgression: 'Normale',
    accObservationsTravail: 'Aucune anomalie particulière constatée au cours du travail.',
    accType: 'Naturel',
    accGestes: ['Accompagnement de la mère durant le travail', "Assistance lors de l'expulsion", 'Réception et examen immédiat du nouveau-né', 'Ligature et section du cordon ombilical', 'Surveillance de la délivrance du placenta'],
    accComplications: 'Aucune', accPertesSanguines: 'Faibles', accDelivrance: 'Complète',
    accEtatNaissance: 'Vigoureux', accRespiration: 'Régulière', accCris: 'Immédiats', accColoration: 'Satisfaisante', accMouvements: 'Vigoureux',
    accSoinsImmediats: ["Nettoyage et séchage de l'enfant", 'Maintien au chaud', 'Examen général', 'Enfant confié à sa mère après vérification de son état'],
    accEtatGeneralMere: 'Satisfaisant', accConscience: 'Claire', accSaignementsMere: 'Normaux',
    accSurveillanceMere: ['Surveillance des saignements', "Surveillance de l'état général", 'Repos et hydratation'],
    accSurveillanceEnfant: ['Surveillance de la respiration', 'Maintien au chaud', "Surveillance de l'alimentation et de l'état général"],
    accConclusion: "Accouchement naturel arrivé à son terme sans complication notable.\n\nLa mère et l'enfant présentent tous deux un état satisfaisant après la naissance. Repos et surveillance habituelle recommandés durant les premières heures.",
  },
  {
    id: 'complique', label: 'Accouchement avec complications maîtrisées',
    texte: "L'accouchement a présenté des complications, maîtrisées grâce aux soins prodigués. La mère et l'enfant se portent bien à l'issue.",
    accObservationsTravail: "Travail présentant plusieurs difficultés ayant nécessité une surveillance renforcée et une assistance médicale. Les contractions sont demeurées présentes, mais la progression de l'enfant s'est révélée plus lente que prévu.",
    accProgression: 'Lente', accType: 'Assisté',
    accGestes: ['Surveillance rapprochée de la mère', "Assistance manuelle à la progression de l'enfant", "Aide à l'expulsion", 'Réception et examen immédiat du nouveau-né', 'Ligature et section du cordon ombilical', 'Surveillance de la délivrance du placenta'],
    accComplications: 'À préciser', accComplicationsDetail: 'Difficultés rencontrées au cours du travail, maîtrisées sans intervention chirurgicale majeure.',
    accPertesSanguines: 'Modérées', accDelivrance: 'Complète',
    accEtatNaissance: 'Faible', accRespiration: 'Faible', accCris: 'Retardés',
    accSoinsImmediats: ['Nettoyage des voies respiratoires accessibles', 'Séchage et stimulation', 'Maintien au chaud', 'Surveillance prolongée de la respiration'],
    accEtatGeneralMere: 'Fatigué', accSaignementsMere: 'À surveiller',
    accSoinsEffectues: "Repos strict recommandé durant les premières heures suivant l'accouchement.",
    accConclusion: "Accouchement marqué par plusieurs difficultés, toutes maîtrisées lors de la prise en charge.\n\nLa mère et l'enfant sont actuellement dans un état stable. Une surveillance prolongée est recommandée avant d'autoriser leur départ.",
  },
  {
    id: 'difficile', label: 'Accouchement difficile — mère et enfant sauvés',
    texte: "L'accouchement s'est révélé difficile et a mis en péril la mère et l'enfant. Les soins prodigués ont permis de les sauver l'un et l'autre.",
    accObservationsTravail: "Accouchement particulièrement difficile caractérisé par une progression insuffisante de l'enfant et un épuisement important de la mère. L'évolution du travail a nécessité une intervention active afin de permettre la naissance et de préserver la vie de la mère et de l'enfant.",
    accProgression: 'Difficile', accType: 'Intervention nécessaire',
    accGestes: ["Surveillance constante de l'état de la mère", "Assistance manuelle à la progression de l'enfant", "Aide à l'expulsion", 'Intervention immédiate lors de la naissance', "Contrôle de l'hémorragie maternelle", 'Prise en charge immédiate du nouveau-né', 'Ligature et section du cordon ombilical', 'Surveillance de la délivrance du placenta'],
    accPertesSanguines: 'Importantes',
    accEtatNaissance: 'Très faible', accRespiration: 'Faible', accCris: 'Retardés',
    accSoinsImmediats: ['Libération et nettoyage des voies respiratoires', 'Stimulation du nouveau-né', 'Frictions avec linge propre et chaud', 'Maintien au chaud', "Surveillance continue jusqu'à obtention d'une respiration satisfaisante"],
    accEtatGeneralMere: 'Affaibli', accSaignementsMere: 'Importants',
    accSoinsEffectues: 'La mère doit demeurer couchée et sous surveillance médicale.',
    accConclusion: "Accouchement ayant présenté un danger important pour la mère comme pour l'enfant.\n\nLes interventions réalisées ont permis d'obtenir une issue favorable. Les deux patients sont actuellement vivants et stabilisés, mais leur état nécessite une surveillance rapprochée au dispensaire.\n\nRepos strict imposé à la mère.",
    prioritaires: ['pertesSanguines', 'etatGeneralMere'],
  },
  {
    id: 'mortne', label: "Issue tragique — enfant mort-né",
    texte: "Malgré tous les soins prodigués, l'enfant n'a pu être sauvé. La mère a survécu à l'accouchement.",
    accObservationsTravail: "Travail ayant conduit à la naissance d'un enfant ne présentant aucun signe de vie au moment de l'expulsion. Les circonstances exactes et les éventuelles difficultés rencontrées durant le travail devront être consignées dans le dossier.",
    accGestes: ["Assistance à l'accouchement", "Réception immédiate de l'enfant", 'Ligature et section du cordon ombilical', "Vérification immédiate de l'état de l'enfant", "Surveillance de la délivrance et de l'état de la mère"],
    accEtatNaissance: 'Sans réaction', accRespiration: 'Absente à la naissance', accCris: 'Absents', accMouvements: 'Absents',
    accSoinsEffectues: "La surveillance médicale de la mère est poursuivie après l'accouchement.\n\nUne attention particulière est portée aux saignements, à l'épuisement physique et à son état général.",
    accConclusion: "Naissance d'un enfant sans signe de vie.\n\nMalgré les soins entrepris immédiatement après l'accouchement, aucune respiration, réaction ou manifestation vitale n'a pu être obtenue. Les manœuvres entreprises afin d'obtenir une respiration spontanée sont demeurées sans résultat. Après examen répété, aucun signe de vie n'a pu être constaté.\n\nL'état de la mère nécessite une surveillance et un repos prolongés après l'épreuve subie.",
    prioritaires: ['etatNaissance'],
  },
  {
    id: 'perte_mere', label: 'Issue tragique — perte de la mère',
    texte: "Malgré tous les soins prodigués, la mère n'a pu survivre à l'accouchement.",
    accObservationsTravail: "Accouchement ayant présenté des complications maternelles extrêmement graves. Malgré les soins et interventions pratiqués, l'état général de la mère s'est progressivement dégradé au cours ou immédiatement après l'accouchement.",
    accType: 'Intervention nécessaire',
    accGestes: ["Assistance immédiate à l'accouchement", 'Tentatives de maîtrise de l’hémorragie', 'Contrôle et surveillance des pertes sanguines', 'Maintien de la patiente couchée et au chaud', 'Surveillance continue de la conscience et de la respiration', 'Prise en charge simultanée du nouveau-né'],
    accPertesSanguines: 'Importantes',
    accEtatGeneralMere: 'Critique', accSaignementsMere: 'Importants',
    accSoinsEffectues: 'Les tentatives entreprises afin de maintenir les fonctions vitales sont demeurées sans résultat.',
    accConclusion: "Décès maternel survenu à la suite de complications graves apparues durant ou immédiatement après l'accouchement.\n\nMalgré les soins et les mesures entreprises, l'état de la patiente n'a pu être stabilisé.\n\nLa cause précise du décès est consignée selon les constatations effectuées par le praticien.\n\nUne surveillance particulière du nouveau-né est mise en place lorsque celui-ci a survécu.",
    prioritaires: ['etatGeneralMere', 'saignementsMere'],
  },
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

export interface RxFields { indication: string; remedeNom: string; preparation: string; posologie: string; duree: string; }
export const RX_EMPTY: RxFields = { indication: '', remedeNom: '', preparation: '', posologie: '', duree: '' };

export interface AccFields {
  heureNaissance: string; lieu: string; terme: string; termeSemaines: string;
  debutTravailHeure: string; dureeTravail: string;
  debutTravail: string; debutTravailAutre: string; contractions: string; ruptureEaux: string;
  presentation: string; progression: string; observationsTravail: string;
  typeAccouchement: string; gestesRealises: string[]; gestesAutre: string;
  complications: string; complicationsDetail: string;
  pertesSanguines: string; delivrance: string; delivranceDetail: string;
  sexe: string; etatNaissance: string; respiration: string; cris: string; coloration: string; mouvementsNe: string;
  soinsImmediats: string[]; soinsAutre: string;
  etatGeneralMere: string; conscience: string; saignementsMere: string; lesions: string; lesionsAutre: string; soinsEffectues: string;
  surveillanceMere: string[]; surveillanceMereAutre: string;
  surveillanceEnfant: string[]; surveillanceEnfantAutre: string;
  conclusion: string;
  dateDeces: string; heureDeces: string; causeDeces: string;
}
export const ACC_EMPTY: AccFields = {
  heureNaissance: '', lieu: '', terme: '', termeSemaines: '',
  debutTravailHeure: '', dureeTravail: '',
  debutTravail: '', debutTravailAutre: '', contractions: '', ruptureEaux: '',
  presentation: '', progression: '', observationsTravail: '',
  typeAccouchement: '', gestesRealises: [], gestesAutre: '',
  complications: '', complicationsDetail: '',
  pertesSanguines: '', delivrance: '', delivranceDetail: '',
  sexe: '', etatNaissance: '', respiration: '', cris: '', coloration: '', mouvementsNe: '',
  soinsImmediats: [], soinsAutre: '',
  etatGeneralMere: '', conscience: '', saignementsMere: '', lesions: '', lesionsAutre: '', soinsEffectues: '',
  surveillanceMere: [], surveillanceMereAutre: '',
  surveillanceEnfant: [], surveillanceEnfantAutre: '',
  conclusion: '',
  dateDeces: '', heureDeces: '', causeDeces: '',
};
export const LIEU_OPTIONS = ['', 'Dispensaire de Little Creek', 'Domicile', 'Autre'];
export const TERME_OPTIONS = ['', 'À terme', 'Prématuré'];
export const DEBUT_TRAVAIL_OPTIONS = ['', 'Spontané', 'Autre'];
export const CONTRACTIONS_TRAVAIL_OPTIONS = ['', 'Régulières', 'Irrégulières', 'Faibles', 'Fortes'];
export const RUPTURE_EAUX_OPTIONS = ['', 'Spontanée', 'Durant le travail', 'Non constatée'];
export const PRESENTATION_OPTIONS = ['', 'Tête', 'Siège', 'Transversale', 'Autre'];
export const PROGRESSION_OPTIONS = ['', 'Normale', 'Lente', 'Difficile', 'Interrompue'];
export const TYPE_ACCOUCHEMENT_OPTIONS = ['', 'Naturel', 'Assisté', 'Intervention nécessaire'];
export const GESTES_OPTIONS = [
  'Accompagnement de la mère durant le travail', "Assistance lors de l'expulsion",
  'Réception et examen immédiat du nouveau-né', 'Ligature et section du cordon ombilical',
  'Surveillance de la délivrance du placenta', "Assistance manuelle à la progression de l'enfant",
  "Aide à l'expulsion", 'Surveillance rapprochée de la mère', 'Intervention immédiate lors de la naissance',
  "Contrôle de l'hémorragie maternelle", 'Prise en charge immédiate du nouveau-né',
  "Surveillance constante de l'état de la mère", 'Tentatives de maîtrise de l’hémorragie',
  'Contrôle et surveillance des pertes sanguines', 'Maintien de la patiente couchée et au chaud',
  'Surveillance continue de la conscience et de la respiration', 'Prise en charge simultanée du nouveau-né',
  "Assistance à l'accouchement", "Réception immédiate de l'enfant", "Vérification immédiate de l'état de l'enfant",
  "Surveillance de la délivrance et de l'état de la mère", 'Autre',
];
export const COMPLICATIONS_ACC_OPTIONS = ['', 'Aucune', 'À préciser'];
export const PERTES_SANGUINES_OPTIONS = ['', 'Faibles', 'Modérées', 'Importantes', 'Très importantes'];
export const DELIVRANCE_OPTIONS = ['', 'Complète', 'Difficile', 'Incomplète', 'À préciser'];
export const SEXE_OPTIONS = ['', 'Fille', 'Garçon'];
export const ETAT_NAISSANCE_OPTIONS = ['', 'Vigoureux', 'Faible', 'Très faible', 'Sans réaction'];
export const RESPIRATION_NE_OPTIONS = ['', 'Régulière', 'Faible', 'Difficile', 'Absente à la naissance'];
export const CRIS_OPTIONS = ['', 'Immédiats', 'Retardés', 'Faibles', 'Absents'];
export const COLORATION_OPTIONS = ['', 'Satisfaisante', 'Pâle', 'Bleutée'];
export const MOUVEMENTS_NE_OPTIONS = ['', 'Vigoureux', 'Faibles', 'Absents'];
export const SOINS_IMMEDIATS_OPTIONS = [
  "Nettoyage et séchage de l'enfant", 'Maintien au chaud', 'Examen général',
  'Enfant confié à sa mère après vérification de son état', 'Nettoyage des voies respiratoires accessibles',
  'Séchage et stimulation', 'Surveillance prolongée de la respiration', 'Libération et nettoyage des voies respiratoires',
  'Stimulation du nouveau-né', 'Frictions avec linge propre et chaud',
  "Surveillance continue jusqu'à obtention d'une respiration satisfaisante", 'Autre',
];
export const ETAT_GENERAL_MERE_OPTIONS = ['', 'Bon', 'Satisfaisant', 'Fatigué', 'Affaibli', 'Critique'];
export const CONSCIENCE_OPTIONS = ['', 'Claire', 'Fatiguée', 'Confuse', 'Inconsciente'];
export const SAIGNEMENTS_MERE_OPTIONS = ['', 'Normaux', 'À surveiller', 'Importants'];
export const LESIONS_OPTIONS = ['', 'Aucune', 'Déchirure légère', 'Déchirure importante', 'Autre'];
export const SURVEILLANCE_MERE_OPTIONS = ['Surveillance des saignements', "Surveillance de l'état général", 'Repos et hydratation', 'Autre'];
export const SURVEILLANCE_ENFANT_OPTIONS = ['Surveillance de la respiration', 'Maintien au chaud', "Surveillance de l'alimentation et de l'état général", 'Autre'];

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

export function genRx(nom: string, age: string, date: string, f: RxFields, scenario: Scenario): string {
  const remedeNom = f.remedeNom || scenario.remedeNom || '[Nom de la plante ou de la préparation]';
  const preparation = f.preparation || scenario.remedePreparation || '[Infusion / Décoction / Teinture / Macération / Sirop / Cataplasme / Pommade / Baume / Autre]';
  const posologieSrc = f.posologie || (scenario.remedePosologie?.join('\n') ?? '[Quantité et fréquence]');
  const posologie = posologieSrc.split('\n').filter(Boolean).map(l => l.trim().startsWith('—') ? l.trim() : `— ${l.trim()}`).join('\n');
  const duree = f.duree || scenario.remedeDuree || '[Durée du traitement]';
  const conseils = (scenario.conseils?.length ? scenario.conseils : ['[Repos / alimentation / hydratation / soins particuliers]', '[Précautions liées au traitement]', '[Signes nécessitant une nouvelle consultation]'])
    .map(c => `— ${c}`).join('\n');
  const suivi = scenario.suivi?.length
    ? scenario.suivi.join('\n\n')
    : `PROCHAIN CONTRÔLE :\n— [Aucun / 24 heures / 48 heures / Quelques jours / Selon évolution]\n\nOBSERVATIONS :\n— [Informations complémentaires]`;
  const indication = [scenario.texte, f.indication].filter(Boolean).join('\n\n') || '[Motif de la prescription, symptômes constatés et précisions éventuelles.]';

  return `# PRESCRIPTION MÉDICALE

DISPENSAIRE DE LITTLE CREEK — COMTÉ DE WEST ELIZABETH · 1890
ORDONNANCE & PRESCRIPTION

PATIENT(E) : ${nom}
ÂGE : ${age || '[Âge]'}
DATE : ${date}

══════════════════════════════════════════════

## INDICATION

${indication}

══════════════════════════════════════════════

## PRESCRIPTION

### ${remedeNom}

PRÉPARATION :
— ${preparation}

POSOLOGIE :
${posologie}

DURÉE :
— ${duree}

══════════════════════════════════════════════

## CONSEILS & PRÉCAUTIONS

${conseils}

══════════════════════════════════════════════

## SUIVI

${suivi}

══════════════════════════════════════════════

Médecin / infirmier signataire : [Nom]`;
}

export function genAccouchement(nom: string, age: string, date: string, f: AccFields, scenario: Scenario): string {
  const terme = f.terme === 'Prématuré' && f.termeSemaines
    ? `Prématuré (${f.termeSemaines} semaines)`
    : (f.terme || '[Nombre de semaines / À terme / Prématuré]');

  const gestes = f.gestesRealises.length ? f.gestesRealises : (scenario.accGestes ?? []);
  const soins = f.soinsImmediats.length ? f.soinsImmediats : (scenario.accSoinsImmediats ?? []);
  const survMere = f.surveillanceMere.length ? f.surveillanceMere : (scenario.accSurveillanceMere ?? []);
  const survEnfant = f.surveillanceEnfant.length ? f.surveillanceEnfant : (scenario.accSurveillanceEnfant ?? []);

  const complications = f.complications || scenario.accComplications || '[—]';
  const complicationsDetail = f.complicationsDetail || scenario.accComplicationsDetail || '';
  const delivrance = f.delivrance || scenario.accDelivrance || '[—]';
  const lesions = f.lesions || '[—]';

  const deces = scenario.id === 'perte_mere' ? `

══════════════════════════════════════════════

## DÉCÈS CONSTATÉ

— Date : ${f.dateDeces || '[JJ/MM/1890]'}
— Heure : ${f.heureDeces || '[HHhMM]'}

CAUSE APPARENTE :
— ${f.causeDeces || '[À préciser selon les constatations médicales]'}` : '';

  return `# COMPTE-RENDU D'ACCOUCHEMENT

DISPENSAIRE DE LITTLE CREEK — COMTÉ DE WEST ELIZABETH · 1890
REGISTRE DES NAISSANCES & RAPPORT D'ACCOUCHEMENT

MÈRE : ${nom}
ÂGE : ${age || '[Âge]'}
DATE DE L'ACCOUCHEMENT : ${date}
HEURE DE LA NAISSANCE : ${f.heureNaissance || '[HHhMM]'}
LIEU : ${f.lieu || '[Dispensaire de Little Creek / Domicile / Autre]'}

TERME ESTIMÉ : ${terme}
DÉBUT DU TRAVAIL : ${f.debutTravailHeure || '[Heure]'}
DURÉE APPROXIMATIVE DU TRAVAIL : ${f.dureeTravail || '[Durée]'}

══════════════════════════════════════════════

## DÉROULEMENT DU TRAVAIL

DÉBUT DU TRAVAIL :
— ${f.debutTravail || scenario.accDebutTravail || '[—]'}${(f.debutTravail || scenario.accDebutTravail) === 'Autre' && f.debutTravailAutre ? ` (${f.debutTravailAutre})` : ''}

CONTRACTIONS :
— ${f.contractions || scenario.accContractions || '[—]'}

RUPTURE DES EAUX :
— ${f.ruptureEaux || scenario.accRuptureEaux || '[—]'}

PRÉSENTATION DE L'ENFANT :
— ${f.presentation || scenario.accPresentation || '[—]'}

PROGRESSION :
— ${f.progression || scenario.accProgression || '[—]'}

OBSERVATIONS :
— ${f.observationsTravail || scenario.accObservationsTravail || '[À compléter]'}

══════════════════════════════════════════════

## ACCOUCHEMENT

TYPE D'ACCOUCHEMENT :
— ${f.typeAccouchement || scenario.accType || '[—]'}

GESTES RÉALISÉS :
${gestes.length ? gestes.map(g => `— ${g}${g === 'Autre' && f.gestesAutre ? ` (${f.gestesAutre})` : ''}`).join('\n') : '— [À compléter]'}

COMPLICATIONS :
— ${complications}${complications === 'À préciser' && complicationsDetail ? ` — ${complicationsDetail}` : ''}

PERTES SANGUINES :
— ${f.pertesSanguines || scenario.accPertesSanguines || '[—]'}

DÉLIVRANCE DU PLACENTA :
— ${delivrance}${delivrance === 'À préciser' && f.delivranceDetail ? ` — ${f.delivranceDetail}` : ''}

══════════════════════════════════════════════

## NOUVEAU-NÉ

SEXE :
— ${f.sexe || '[—]'}

ÉTAT À LA NAISSANCE :
— ${f.etatNaissance || scenario.accEtatNaissance || '[—]'}

RESPIRATION :
— ${f.respiration || scenario.accRespiration || '[—]'}

CRIS :
— ${f.cris || scenario.accCris || '[—]'}

COLORATION :
— ${f.coloration || scenario.accColoration || '[—]'}

MOUVEMENTS :
— ${f.mouvementsNe || scenario.accMouvements || '[—]'}

CORDON OMBILICAL :
— Ligaturé puis sectionné.

SOINS IMMÉDIATS :
${soins.length ? soins.map(s => `— ${s}${s === 'Autre' && f.soinsAutre ? ` (${f.soinsAutre})` : ''}`).join('\n') : '— [À compléter]'}

══════════════════════════════════════════════

## ÉTAT DE LA MÈRE APRÈS L'ACCOUCHEMENT

ÉTAT GÉNÉRAL :
— ${f.etatGeneralMere || scenario.accEtatGeneralMere || '[—]'}

CONSCIENCE :
— ${f.conscience || scenario.accConscience || '[—]'}

SAIGNEMENTS :
— ${f.saignementsMere || scenario.accSaignementsMere || '[—]'}

LÉSIONS LIÉES À L'ACCOUCHEMENT :
— ${lesions}${lesions === 'Autre' && f.lesionsAutre ? ` (${f.lesionsAutre})` : ''}

SOINS EFFECTUÉS :
— ${f.soinsEffectues || scenario.accSoinsEffectues || '[À compléter]'}

══════════════════════════════════════════════

## SURVEILLANCE POST-ACCOUCHEMENT

MÈRE :
${survMere.length ? survMere.map(s => `— ${s}${s === 'Autre' && f.surveillanceMereAutre ? ` (${f.surveillanceMereAutre})` : ''}`).join('\n') : '— [Aucune sélectionnée]'}

ENFANT :
${survEnfant.length ? survEnfant.map(s => `— ${s}${s === 'Autre' && f.surveillanceEnfantAutre ? ` (${f.surveillanceEnfantAutre})` : ''}`).join('\n') : '— [Aucune sélectionnée]'}

══════════════════════════════════════════════

## CONCLUSION

${f.conclusion || scenario.accConclusion || "[Résumé du déroulement de l'accouchement, état final de la mère et de l'enfant et éventuelles recommandations.]"}
${deces}

══════════════════════════════════════════════

Médecin / sage-femme / infirmière ayant procédé à l'accouchement :

[Nom et signature]`;
}
