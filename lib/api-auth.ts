import { createClient } from '@/lib/supabase/server';

export interface ApiSession {
  userId: string;
  discordId: string;
  username: string;
  roles: string[];
}

export async function getApiSession(): Promise<ApiSession | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member } = await supabase
    .from('members')
    .select('discord_id, username, status, roles')
    .eq('user_id', user.id)
    .single();

  if (!member || member.status !== 'approved') return null;

  return {
    userId: user.id,
    discordId: member.discord_id,
    username: member.username,
    roles: (member.roles as string[]) ?? [],
  };
}
