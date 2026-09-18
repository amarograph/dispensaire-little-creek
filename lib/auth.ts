import { createClient } from '@/lib/supabase/server';
import { hasPermission, type Permission } from '@/lib/permissions';

export async function getMember(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('members')
    .select('status, roles')
    .eq('user_id', userId)
    .single();

  return data as { status: string; roles: string[] } | null;
}

export async function getMemberStatus(userId: string) {
  const member = await getMember(userId);
  return member?.status ?? null;
}

export async function requireApprovedMember() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');

  const member = await getMember(user.id);
  if (member?.status !== 'approved') throw new Error('Unauthorized');

  return { supabase, user, roles: member.roles };
}

export async function requirePermission(permission: Permission) {
  const { supabase, user, roles } = await requireApprovedMember();
  if (!hasPermission(roles, permission)) throw new Error('Unauthorized');
  return { supabase, user, roles };
}
