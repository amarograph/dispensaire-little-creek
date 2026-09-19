import type { Role } from './permissions';

/**
 * Tarif d'une "caisse" (shift journalier autodéclaré) selon le grade.
 * Un membre avec plusieurs rôles concernés se voit appliquer le tarif le plus élevé.
 */
export const CAISSE_RATE: Partial<Record<Role, number>> = {
  redm_preparateur_caisse: 5,
  redm_infirmier:          5.5,
  redm_apprenti:           5.5,
  redm_medecin:            6,
  redm_medecin_chef:       6,
  redm_co_directeur:       6,
  redm_directeur:          6,
};

export const CAISSE_ROLES = Object.keys(CAISSE_RATE) as Role[];

export function caisseRateForRoles(roles: string[]): number | null {
  let best: number | null = null;
  for (const r of roles) {
    const rate = CAISSE_RATE[r as Role];
    if (rate != null && (best === null || rate > best)) best = rate;
  }
  return best;
}
