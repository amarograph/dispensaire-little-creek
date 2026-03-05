'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Universe } from '@/types';

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || user.email !== process.env.NEXT_PUBLIC_ALLOWED_EMAIL) {
    throw new Error('Unauthorized');
  }
  return { supabase, user };
}

export async function getSettings(universe: Universe) {
  const { supabase, user } = await getAuthenticatedUser();

  const { data } = await supabase
    .from('settings')
    .select('*')
    .eq('owner_id', user.id)
    .eq('universe', universe);

  const map: Record<string, string> = {};
  (data ?? []).forEach(s => {
    map[s.key] = s.value ?? '';
  });
  return map;
}

export async function upsertSetting(
  universe: Universe,
  key: string,
  value: string
) {
  const { supabase, user } = await getAuthenticatedUser();

  await supabase.from('settings').upsert(
    { owner_id: user.id, universe, key, value },
    { onConflict: 'owner_id,universe,key' }
  );

  revalidatePath('/admin/settings');
}