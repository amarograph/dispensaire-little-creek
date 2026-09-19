'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isDirection, isRole, ASSIGNABLE_ROLES, type Role } from '@/lib/permissions';

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
  return data;
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
