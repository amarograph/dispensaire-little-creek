'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { TemplateField, FieldType, TableColumn } from '@/types';

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || user.email !== process.env.NEXT_PUBLIC_ALLOWED_EMAIL) {
    throw new Error('Unauthorized');
  }
  return { supabase, user };
}

export async function getFields(templateId: string) {
  const { supabase, user } = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from('template_fields')
    .select('*')
    .eq('template_id', templateId)
    .eq('owner_id', user.id)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data as TemplateField[];
}

export async function createField(templateId: string, field: {
  key: string;
  label: string;
  field_type: FieldType;
  required: boolean;
  options?: string[];
  table_columns?: TableColumn[];
  default_value?: string;
  sort_order: number;
}) {
  const { supabase, user } = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from('template_fields')
    .insert({
      owner_id: user.id,
      template_id: templateId,
      ...field,
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath(`/admin/templates/${templateId}/fields`);
  return data;
}

export async function updateField(fieldId: string, updates: Partial<TemplateField>) {
  const { supabase, user } = await getAuthenticatedUser();

  const { error } = await supabase
    .from('template_fields')
    .update(updates)
    .eq('id', fieldId)
    .eq('owner_id', user.id);

  if (error) throw error;
}

export async function deleteField(fieldId: string, templateId: string) {
  const { supabase, user } = await getAuthenticatedUser();

  const { error } = await supabase
    .from('template_fields')
    .delete()
    .eq('id', fieldId)
    .eq('owner_id', user.id);

  if (error) throw error;
  revalidatePath(`/admin/templates/${templateId}/fields`);
}