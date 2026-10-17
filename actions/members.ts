'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isDirection, isAdmin, isRole, ASSIGNABLE_ROLES, type Role } from '@/lib/permissions';

async function requireDirection() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');

  const { data: member } = await supabase
    .from('members')
    .select('roles, status')
    .eq('user_id', user.id)
    .single();

  if (!member || member.status !== 'approved' || !isDirection(member.roles)) {
    throw new Error('Unauthorized');
  }

  return { supabase, user };
}

function sanitizeRoles(roles: string[]): Role[] {
  // "dev" n'est jamais attribuable via cette interface — uniquement via le
  // bootstrap ADMIN_DISCORD_IDS. On le filtre même si un client malveillant
  // l'envoie directement à l'action serveur.
  return Array.from(new Set(roles)).filter(
    (r): r is Role => isRole(r) && (ASSIGNABLE_ROLES as readonly string[]).includes(r)
  );
}

export async function listMembers() {
  const { supabase } = await requireDirection();
  const { data, error } = await supabase
    .from('members')
    .select('user_id, discord_id, username, status, roles, requested_at')
    .order('requested_at', { ascending: false });

  if (error) throw error;

  /* Nom et prénom RP de chaque membre (table user_rp_profiles, lue côté serveur) */
  const db = await createServiceClient();
  const { data: profils } = await db.from('user_rp_profiles').select('discord_id, nom_rp, prenom_rp').eq('universe', 'redm');
  const rp: Record<string, { nom_rp: string; prenom_rp: string }> = {};
  for (const p of profils ?? []) rp[p.discord_id] = { nom_rp: p.nom_rp ?? '', prenom_rp: p.prenom_rp ?? '' };

  return (data ?? []).map(m => ({ ...m, prenom_rp: rp[m.discord_id]?.prenom_rp ?? '', nom_rp: rp[m.discord_id]?.nom_rp ?? '' }));
}

/* Modifier le nom et le prénom RP d'un membre (directeur, co-directeur, admin) */
export async function updateMemberRp(discordId: string, prenom: string, nom: string) {
  const { supabase, user } = await requireDirection();
  const { data: me } = await supabase.from('members').select('roles').eq('user_id', user.id).single();
  const roles: string[] = me?.roles ?? [];
  if (!isAdmin(roles) && !roles.some(r => ['redm_directeur', 'redm_co_directeur'].includes(r))) throw new Error('Unauthorized');
  if (!discordId) throw new Error('Identifiant manquant');

  const db = await createServiceClient();
  const { error } = await db.from('user_rp_profiles').upsert(
    { discord_id: discordId, universe: 'redm', prenom_rp: prenom.trim().slice(0, 60), nom_rp: nom.trim().slice(0, 60) },
    { onConflict: 'discord_id,universe' },
  );
  if (error) throw error;
  revalidatePath('/admin/access');
  revalidatePath('/admin');
}

export async function decideMember(userId: string, status: 'approved' | 'rejected', roles: string[] = []) {
  const { supabase, user } = await requireDirection();

  const { error } = await supabase
    .from('members')
    .update({
      status,
      roles: status === 'approved' ? sanitizeRoles(roles) : [],
      decided_at: new Date().toISOString(),
      decided_by: user.id,
    })
    .eq('user_id', userId);

  if (error) throw error;
  revalidatePath('/admin/access');
  revalidatePath('/admin');
}

export async function updateMemberRoles(userId: string, roles: string[]) {
  const { supabase, user } = await requireDirection();

  // Le rôle "dev" n'est jamais proposé dans le sélecteur de rôles (il ne doit
  // figurer dans aucun registre), donc sanitizeRoles() l'exclut toujours du
  // tableau soumis par le formulaire. Sans ce garde-fou, enregistrer les rôles
  // d'un compte qui a déjà "dev" l'en dépouillerait silencieusement.
  const { data: existing } = await supabase
    .from('members')
    .select('roles')
    .eq('user_id', userId)
    .single();
  const hadDev = (existing?.roles ?? []).includes('dev');

  const nextRoles = sanitizeRoles(roles);
  if (hadDev) nextRoles.push('dev');

  const { error } = await supabase
    .from('members')
    .update({
      roles: nextRoles,
      decided_at: new Date().toISOString(),
      decided_by: user.id,
    })
    .eq('user_id', userId);

  if (error) throw error;
  revalidatePath('/admin/access');
  revalidatePath('/admin');
}
