'use server';

import { revalidatePath } from 'next/cache';
import { requireApprovedMember as getAuthenticatedUser } from '@/lib/auth';
import type { Template, Universe } from '@/types';

export async function getTemplates(universe: Universe) {
  const { supabase, user } = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from('templates')
    .select('*, template_fields(*)')
    .eq('owner_id', user.id)
    .eq('universe', universe)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Template[];
}

export async function getTemplate(id: string) {
  const { supabase, user } = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from('templates')
    .select('*, template_fields(*)')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single();

  if (error) throw error;
  return data as Template;
}

export async function createTemplate(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUser();

  const name = formData.get('name') as string;
  const universe = formData.get('universe') as Universe;
  const description = formData.get('description') as string;
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .substring(0, 60);

  const { data, error } = await supabase
    .from('templates')
    .insert({
      owner_id: user.id,
      universe,
      name,
      slug: `${slug}-${Date.now()}`,
      description,
      body: '',
      published: false,
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/admin/templates');
  return data;
}

export async function updateTemplate(id: string, updates: Partial<Template>) {
  const { supabase, user } = await getAuthenticatedUser();

  const { error } = await supabase
    .from('templates')
    .update(updates)
    .eq('id', id)
    .eq('owner_id', user.id);

  if (error) throw error;
  revalidatePath('/admin/templates');
  revalidatePath(`/admin/templates/${id}`);
}

export async function deleteTemplate(id: string) {
  const { supabase, user } = await getAuthenticatedUser();

  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id);

  if (error) throw error;
  revalidatePath('/admin/templates');
}
