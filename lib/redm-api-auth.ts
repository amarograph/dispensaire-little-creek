import { getApiSession } from '@/lib/api-auth';
import { isAdmin } from '@/lib/permissions';

const DIRECTION_ROLES = ['redm_directeur', 'redm_co_directeur'];
const DIRECTION_READ_ROLES = [...DIRECTION_ROLES, 'redm_medecin_chef'];
const CABINET_ROLES = ['redm_therapeute', 'redm_directeur', 'redm_co_directeur'];

/** Direction / co-direction (ou dev) — accès complet aux routes d'admin RedM. */
export async function requireDirectionActor(): Promise<{ id: string; name: string } | null> {
  const session = await getApiSession();
  if (!session) return null;
  const ok = isAdmin(session.roles) || session.roles.some(r => DIRECTION_ROLES.includes(r));
  if (!ok) return null;
  return { id: session.discordId, name: session.username };
}

/** Direction / co-direction / médecin en chef (ou dev) — lecture seule élargie. */
export async function requireDirectionRead(): Promise<string | null> {
  const session = await getApiSession();
  if (!session) return null;
  const ok = isAdmin(session.roles) || session.roles.some(r => DIRECTION_READ_ROLES.includes(r));
  return ok ? session.discordId : null;
}

/** Thérapeute / directeur (ou dev) — accès au cabinet thérapeutique. */
export async function requireCabinetActor(): Promise<{ discordId: string; isAdmin: boolean } | null> {
  const session = await getApiSession();
  if (!session) return null;
  const admin = isAdmin(session.roles);
  const ok = admin || session.roles.some(r => CABINET_ROLES.includes(r));
  if (!ok) return null;
  return { discordId: session.discordId, isAdmin: admin };
}

const REDM_STAFF_ROLES = [
  'redm_directeur', 'redm_co_directeur', 'redm_medecin_chef', 'redm_medecin',
  'redm_infirmier', 'redm_apprenti', 'redm_therapeute',
];

/** N'importe quel membre du personnel RedM (ou dev) — profil, portrait… */
export async function requireRedmStaff(): Promise<{ discordId: string; roles: string[]; isAdmin: boolean } | null> {
  const session = await getApiSession();
  if (!session) return null;
  const admin = isAdmin(session.roles);
  const ok = admin || session.roles.some(r => REDM_STAFF_ROLES.includes(r));
  if (!ok) return null;
  return { discordId: session.discordId, roles: session.roles, isAdmin: admin };
}
