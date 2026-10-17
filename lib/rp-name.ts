import { createClient } from '@supabase/supabase-js';

/* Nom et prénom RP (plutôt que le pseudo Discord) pour l'affichage des auteurs d'actions. */

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const join = (p?: { prenom_rp?: string | null; nom_rp?: string | null } | null) =>
  p ? [p.prenom_rp, p.nom_rp].filter(Boolean).join(' ').trim() : '';

/** Nom RP d'un membre à partir de son identifiant Discord ; `fallback` (pseudo) si aucun nom RP n'est renseigné. */
export async function rpNameOf(discordId: string, fallback: string): Promise<string> {
  try {
    const { data } = await db().from('user_rp_profiles').select('nom_rp, prenom_rp')
      .eq('discord_id', discordId).eq('universe', 'redm').single();
    return join(data) || fallback;
  } catch { return fallback; }
}

/** Table pseudo Discord (minuscules) → nom RP, pour afficher d'anciennes entrées qui ne stockaient que le pseudo. */
export async function rpNamesByUsername(): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  try {
    const supabase = db();
    const [{ data: membres }, { data: profils }] = await Promise.all([
      supabase.from('members').select('discord_id, username'),
      supabase.from('user_rp_profiles').select('discord_id, nom_rp, prenom_rp').eq('universe', 'redm'),
    ]);
    const rp: Record<string, string> = {};
    for (const p of profils ?? []) rp[p.discord_id] = join(p);
    for (const m of membres ?? []) {
      const nom = rp[m.discord_id];
      if (nom && m.username) out.set(String(m.username).toLowerCase(), nom);
    }
  } catch {}
  return out;
}
