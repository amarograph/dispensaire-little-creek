/**
 * Listes de référence pour l'Alerte Sanitaire (Direction).
 * `nom: ''` signifie "Aucune" (statut sain, affiché en vert sur l'accueil).
 */

export interface SanitaireEntry {
  nom: string;
  critique: boolean;
}

export interface DispensaireStatus {
  epidemie: SanitaireEntry;
  risque: SanitaireEntry;
}

export const DEFAULT_DISPENSAIRE_STATUS: DispensaireStatus = {
  epidemie: { nom: '', critique: false },
  risque:   { nom: '', critique: false },
};

/** Vert (aucune cause), Ambre (cause active), Rouge (marquée critique). */
export function sanitaireColor(e: SanitaireEntry) {
  if (!e.nom) return '#5A9A58';
  return e.critique ? '#C83030' : '#C8A040';
}

export function sanitaireLabel(e: SanitaireEntry) {
  if (!e.nom) return 'AUCUNE';
  return e.critique ? `${e.nom} — CRITIQUE` : e.nom;
}

export const EPIDEMIES: string[] = [
  'Tuberculose', 'Fièvre jaune', 'Fièvre typhoïde', 'Choléra', 'Dysenterie', 'Grippe',
  'Pneumonie', 'Bronchite infectieuse', 'Diphtérie', 'Coqueluche', 'Rougeole', 'Scarlatine',
  'Oreillons', 'Rubéole', 'Varicelle', 'Variole', 'Typhus', 'Gale', 'Teigne', 'Poux',
  'Paludisme', 'Méningite', 'Syphilis', 'Blennorragie (gonorrhée)', 'Chancre mou', 'Lèpre',
  'Érysipèle', 'Tétanos', 'Rage', 'Conjonctivite infectieuse', 'Fièvre rhumatismale',
  'Septicémie', 'Infection puerpérale (fièvre des accouchées)', 'Anthrax (charbon)',
  'Brucellose', 'Trichinose', 'Diphtérie laryngée', 'Fièvre récurrente',
  'Peste bubonique (rare mais connue)', 'Poliomyélite (encore peu identifiée à l’époque)',
  'Maladie de Hansen (lèpre)', 'Croup', 'Épidémies de diarrhées estivales infantiles',
  'Infections de plaies gangréneuses', 'Gangrène gazeuse', 'Érysipèle facial',
  'Fièvres des marais', 'Fièvres inconnues d’origine bactérienne ou parasitaire',
  'Intoxications alimentaires collectives',
  'Épidémies de parasites intestinaux (vers, tænia, ascaris)',
];

export const RISQUES_SANITAIRES: string[] = [
  'Eau potable contaminée', 'Puits contaminés', 'Réservoirs d’eau insalubres',
  'Égouts défectueux', 'Débordement des latrines', 'Accumulation d’ordures dans les rues',
  'Décharges sauvages', 'Cadavres d’animaux non retirés',
  'Cadavres humains non pris en charge rapidement', 'Prolifération des rats',
  'Prolifération des souris', 'Prolifération des moustiques', 'Prolifération des mouches',
  'Infestation de poux', 'Infestation de puces', 'Infestation de tiques',
  'Parasites intestinaux', 'Eau stagnante dans les marais', 'Inondations',
  'Sécheresse affectant la qualité de l’eau', 'Pollution des rivières et cours d’eau',
  'Pollution des puits par les animaux', 'Viande avariée', 'Poisson avarié',
  'Conserves détériorées', 'Lait contaminé', 'Aliments contaminés',
  'Mauvaises conditions de stockage alimentaire', 'Marchés insalubres', 'Abattoirs insalubres',
  'Boucheries insalubres', 'Élevages contaminés',
  'Épidémies animales transmissibles à l’homme', 'Surpopulation des logements',
  'Logements insalubres', 'Mauvaise ventilation des bâtiments',
  'Humidité excessive dans les habitations', 'Présence de moisissures',
  'Pauvreté et malnutrition', 'Famine locale', 'Manque d’accès aux soins',
  'Manque de personnel médical', 'Absence de quarantaine',
  'Non-respect des mesures d’isolement', 'Arrivée de voyageurs malades',
  'Arrivée de navires provenant de zones infectées', 'Camps de travailleurs insalubres',
  'Prisons insalubres', 'Orphelinats surchargés', 'Hospices surchargés',
  'Saloons et lieux publics surpeuplés', 'Écoles touchées par des maladies contagieuses',
  'Réutilisation de matériel médical non désinfecté', 'Instruments chirurgicaux mal stérilisés',
  'Réutilisation de bandages souillés', 'Mauvaise gestion des déchets médicaux',
  'Manipulation de cadavres sans protection', 'Enterrements non conformes',
  'Morsures d’animaux errants', 'Rage animale', 'Morsures de serpents',
  'Accidents agricoles', 'Accidents industriels', 'Accidents miniers',
  'Accidents ferroviaires', 'Accidents de diligence', 'Accidents équestres',
  'Incendies urbains', 'Brûlures graves', 'Intoxication par la fumée',
  'Intoxication au monoxyde de carbone', 'Exposition aux produits chimiques',
  'Exposition au plomb', 'Conditions météorologiques extrêmes', 'Vagues de chaleur',
  'Déshydratation', 'Gelures', 'Hypothermie', 'Tempêtes et ouragans',
  'Épidémies de tuberculose', 'Épidémies de fièvre jaune', 'Épidémies de choléra',
  'Épidémies de fièvre typhoïde', 'Épidémies de paludisme', 'Épidémies de rougeole',
  'Épidémies de scarlatine', 'Épidémies de diphtérie', 'Épidémies de coqueluche',
  'Épidémies de grippe', 'Épidémies de dysenterie', 'Propagation des maladies vénériennes',
  'Automédication dangereuse', 'Vente de médicaments frelatés', 'Charlatanisme médical',
  'Consommation excessive de laudanum', 'Alcoolisme chronique', 'Toxicomanie aux opiacés',
  'Troubles mentaux non pris en charge', 'Suicide',
  'Violence armée et blessures par armes à feu', 'Violences domestiques',
  'Banditisme et attaques de diligence',
  'Manque de sensibilisation aux règles d’hygiène publique',
];
