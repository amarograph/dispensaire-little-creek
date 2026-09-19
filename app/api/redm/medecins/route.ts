import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getApiSession } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

/* Rôles RedM considérés comme « personnel médical » du dispensaire */
const REDM_MEDICAL_ROLES = [
  'redm_directeur', 'redm_co_directeur', 'redm_medecin_chef', 'redm_medecin',
  'redm_therapeute', 'redm_infirmier', 'redm_apprenti',
] as const;

/* ── GET : noms RP des médecins/soignants (tout utilisateur connecté) ── */
export async function GET() {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const db = await createServiceClient();

  const { data: users } = await db
    .from('members')
    .select('discord_id, username, roles')
    .eq('status', 'approved');

  const medical = (users ?? []).filter(u => {
    const r: string[] = u.roles ?? [];
    return r.some(x => (REDM_MEDICAL_ROLES as readonly string[]).includes(x));
  });

  const { data: profiles } = await db
    .from('user_rp_profiles')
    .select('discord_id, nom_rp, prenom_rp')
    .eq('universe', 'redm');

  const rp: Record<string, { nom_rp: string; prenom_rp: string }> = {};
  for (const row of profiles ?? []) rp[row.discord_id] = row;

  const noms = medical
    .map(u => {
      const p = rp[u.discord_id];
      const rpName = p ? [p.prenom_rp, p.nom_rp].filter(Boolean).join(' ').trim() : '';
      return rpName || `@${u.username}`;
    })
    .filter(Boolean);

  const uniques = Array.from(new Set(noms)).sort((a, b) => a.localeCompare(b, 'fr'));

  return NextResponse.json({ medecins: uniques });
}
