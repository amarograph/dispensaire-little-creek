// ─────────────────────────────────────────────────────────────────────────────
// Système de permissions — 4 niveaux
// 0 = Aucun accès | 1 = Lecture | 2 = Éditeur | 3 = Gestionnaire
// ─────────────────────────────────────────────────────────────────────────────

export const PERM = {
  NONE:    0,
  READ:    1,
  EDITOR:  2,
  MANAGER: 3,
} as const;

export type PermLevel = 0 | 1 | 2 | 3;

export type Section =
  | 'redm_certificats'   // Certificats médicaux
  | 'redm_archives'      // Archives patients
  | 'redm_bibliotheque'  // Bibliothèque
  | 'redm_contexte'      // Contexte époque
  | 'redm_comptabilite'  // Comptabilité dispensaire
  | 'redm_guide'         // Guide RP
  | 'redm_cabinet'       // Cabinet thérapeutique
  | 'redm_obstetrique'   // Obstétrique
  | 'redm_direction';    // Direction (réservé direction/co-direction)

type PermMap = Record<Section, PermLevel>;

const ALL_MANAGER: PermMap = {
  redm_certificats: 3, redm_archives: 3, redm_bibliotheque: 3,
  redm_contexte: 3, redm_comptabilite: 3, redm_guide: 3, redm_cabinet: 3, redm_obstetrique: 3, redm_direction: 3,
};

const NONE_MAP: PermMap = {
  redm_certificats: 0, redm_archives: 0, redm_bibliotheque: 0,
  redm_contexte: 0, redm_comptabilite: 0, redm_guide: 0, redm_cabinet: 0, redm_obstetrique: 0, redm_direction: 0,
};

export const ROLES = [
  'dev',
  'redm_directeur',
  'redm_co_directeur',
  'redm_medecin_chef',
  'redm_medecin',
  'redm_apprenti',
  'redm_infirmier',
  'redm_preparateur_caisse',
  'redm_therapeute',
  'redm_obstetricien',
] as const;

export type Role = typeof ROLES[number];

/**
 * Rôles proposables via l'interface (validation des accès / attribution des
 * rôles). "dev" en est volontairement exclu : il ne doit figurer dans aucun
 * registre ni être attribuable manuellement — seul le bootstrap via
 * ADMIN_DISCORD_IDS peut l'accorder.
 */
export const ASSIGNABLE_ROLES = ROLES.filter(r => r !== 'dev') as Exclude<Role, 'dev'>[];

export const ROLE_LABELS: Record<Role, string> = {
  dev: 'Dev',
  redm_directeur: 'Directeur',
  redm_co_directeur: 'Co-directeur',
  redm_medecin_chef: 'Médecin en Chef',
  redm_medecin: 'Médecin',
  redm_apprenti: 'Apprenti médecin',
  redm_infirmier: 'Infirmier',
  redm_preparateur_caisse: 'Préparateur de caisse',
  redm_therapeute: 'Thérapeute',
  redm_obstetricien: 'Obstétricien',
};

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export const ROLE_PERMISSIONS: Record<Role, PermMap> = {

  // ── Système (rôle caché, non listé, jamais attribuable via l'UI) ──────────
  dev: ALL_MANAGER,

  // ── Directeur dispensaire : tout ─────────────────────────────────────────
  redm_directeur: ALL_MANAGER,

  // ── Co-Directeur dispensaire : tout ──────────────────────────────────────
  redm_co_directeur: ALL_MANAGER,

  // ── Médecin dispensaire ───────────────────────────────────────────────────
  redm_medecin: {
    ...NONE_MAP,
    redm_certificats:  PERM.EDITOR,
    redm_archives:     PERM.EDITOR,
    redm_bibliotheque: PERM.READ,
    redm_contexte:     PERM.READ,
    redm_guide:        PERM.READ,
    redm_cabinet:      PERM.NONE,
    redm_comptabilite: PERM.EDITOR,
    redm_direction:    PERM.NONE,
  },

  // ── Médecin en Chef (Médecin + lecture Direction/Comptabilité) ──────────
  redm_medecin_chef: {
    ...NONE_MAP,
    redm_certificats:  PERM.EDITOR,
    redm_archives:     PERM.EDITOR,
    redm_bibliotheque: PERM.READ,
    redm_contexte:     PERM.READ,
    redm_guide:        PERM.READ,
    redm_cabinet:      PERM.NONE,
    redm_comptabilite: PERM.EDITOR,
    redm_direction:    PERM.READ,
  },

  // ── Thérapeute dispensaire ────────────────────────────────────────────────
  redm_therapeute: {
    ...NONE_MAP,
    redm_certificats:  PERM.READ,
    redm_archives:     PERM.EDITOR,
    redm_bibliotheque: PERM.READ,
    redm_contexte:     PERM.READ,
    redm_guide:        PERM.READ,
    redm_cabinet:      PERM.EDITOR,
    redm_comptabilite: PERM.NONE,
    redm_direction:    PERM.NONE,
  },

  // ── Infirmier dispensaire ─────────────────────────────────────────────────
  redm_infirmier: {
    ...NONE_MAP,
    redm_certificats:  PERM.READ,
    redm_archives:     PERM.READ,
    redm_bibliotheque: PERM.READ,
    redm_contexte:     PERM.READ,
    redm_guide:        PERM.READ,
    redm_cabinet:      PERM.NONE,
    redm_comptabilite: PERM.EDITOR,
    redm_direction:    PERM.NONE,
  },

  // ── Apprenti dispensaire ──────────────────────────────────────────────────
  redm_apprenti: {
    ...NONE_MAP,
    redm_certificats:  PERM.READ,
    redm_archives:     PERM.READ,
    redm_bibliotheque: PERM.READ,
    redm_contexte:     PERM.READ,
    redm_guide:        PERM.READ,
    redm_cabinet:      PERM.NONE,
    redm_comptabilite: PERM.EDITOR,
    redm_direction:    PERM.NONE,
  },

  // ── Préparateur de caisse : aucun accès aux sections — uniquement le
  // Registre des Caisses en libre-service (hors système de sections,
  // verrouillé côté middleware pour ce rôle) ──────────────────────────────
  redm_preparateur_caisse: {
    ...NONE_MAP,
  },

  // ── Obstétricien dispensaire ─────────────────────────────────────────────
  redm_obstetricien: {
    ...NONE_MAP,
    redm_certificats:  PERM.READ,
    redm_archives:     PERM.EDITOR,
    redm_bibliotheque: PERM.READ,
    redm_contexte:     PERM.READ,
    redm_guide:        PERM.READ,
    redm_cabinet:      PERM.NONE,
    redm_obstetrique:  PERM.EDITOR,
    redm_comptabilite: PERM.NONE,
    redm_direction:    PERM.NONE,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Fonctions utilitaires
// ─────────────────────────────────────────────────────────────────────────────

/** Retourne le niveau de permission effectif (max sur tous les rôles de l'utilisateur) */
export function getPermission(roles: string[], section: Section): PermLevel {
  let max: PermLevel = 0;
  for (const role of roles) {
    if (!isRole(role)) continue;
    const p = (ROLE_PERMISSIONS[role]?.[section] ?? 0) as PermLevel;
    if (p > max) max = p;
  }
  return max;
}

export const canRead   = (roles: string[], s: Section) => getPermission(roles, s) >= PERM.READ;
export const canEdit   = (roles: string[], s: Section) => getPermission(roles, s) >= PERM.EDITOR;
export const canManage = (roles: string[], s: Section) => getPermission(roles, s) >= PERM.MANAGER;

export function isAdmin(roles: string[]): boolean {
  return roles.includes('dev');
}

export function isDirection(roles: string[]): boolean {
  return isAdmin(roles) || canRead(roles, 'redm_direction');
}

/** Mapping route → section pour le middleware (du plus spécifique au plus général) */
export const ROUTE_SECTION: Array<{ prefix: string; section: Section }> = [
  { prefix: '/redm/direction/comptabilite', section: 'redm_comptabilite' },
  { prefix: '/redm/direction',            section: 'redm_direction'     },
  { prefix: '/redm/cabinet',              section: 'redm_cabinet'       },
  { prefix: '/redm/obstetrique',          section: 'redm_obstetrique'   },
  { prefix: '/redm/certificats',          section: 'redm_certificats'   },
  { prefix: '/redm/archives',             section: 'redm_archives'      },
  { prefix: '/redm/bibliotheque',         section: 'redm_bibliotheque'  },
  { prefix: '/redm/contexte',             section: 'redm_contexte'      },
  { prefix: '/redm/essentiel',            section: 'redm_guide'         },
  { prefix: '/redm/comptabilite',         section: 'redm_comptabilite'  },
  { prefix: '/bibliotheque',              section: 'redm_bibliotheque'  },
];
