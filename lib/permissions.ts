export const ROLES = [
  'dev',
  'directeur',
  'co_directeur',
  'medecin_chef',
  'medecin',
  'apprenti_medecin',
  'infirmier',
  'preparateur_caisse',
  'therapeute',
] as const;

export type Role = typeof ROLES[number];

export const ROLE_LABELS: Record<Role, string> = {
  dev: 'Dev',
  directeur: 'Directeur',
  co_directeur: 'Co-directeur',
  medecin_chef: 'Médecin en Chef',
  medecin: 'Médecin',
  apprenti_medecin: 'Apprenti médecin',
  infirmier: 'Infirmier',
  preparateur_caisse: 'Préparateur de caisse',
  therapeute: 'Thérapeute',
};

export const PERMISSIONS = ['comptabilite', 'bibliotheque', 'direction', 'cabinet'] as const;
export type Permission = typeof PERMISSIONS[number];

// direction = gestion des demandes d'accès, des rôles, des templates et des paramètres
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  dev: ['comptabilite', 'bibliotheque', 'direction', 'cabinet'],
  directeur: ['comptabilite', 'bibliotheque', 'direction'],
  co_directeur: ['comptabilite', 'bibliotheque', 'direction'],
  medecin_chef: ['comptabilite', 'bibliotheque', 'direction'],
  medecin: ['comptabilite', 'bibliotheque', 'direction'],
  apprenti_medecin: ['comptabilite', 'bibliotheque'],
  infirmier: ['comptabilite', 'bibliotheque'],
  preparateur_caisse: ['comptabilite'],
  therapeute: ['cabinet'],
};

// Rôles dont au moins un membre du groupe doit valider les accès / gérer les rôles.
export const DIRECTION_ROLES: Role[] = ['dev', 'directeur', 'co_directeur', 'medecin_chef', 'medecin'];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export function hasPermission(roles: string[], permission: Permission): boolean {
  return roles.some(r => isRole(r) && ROLE_PERMISSIONS[r].includes(permission));
}

export function isDirection(roles: string[]): boolean {
  return hasPermission(roles, 'direction');
}
