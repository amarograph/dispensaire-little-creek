import { createClient } from '@/lib/supabase/server';
import { DynamicForm } from '@/components/reports/DynamicForm';
import { notFound } from 'next/navigation';
import type { Template } from '@/types';

export default async function ReportFormPage({
  params,
}: {
  params: { templateId: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: template } = await supabase
    .from('templates')
    .select('*, template_fields(*)')
    .eq('id', params.templateId)
    .eq('owner_id', user!.id)
    .eq('published', true)
    .single();

  if (!template) notFound();

  const { data: settingsRows } = await supabase
    .from('settings')
    .select('key, value')
    .eq('owner_id', user!.id)
    .eq('universe', template.universe);

  const settings: Record<string, string> = {};
  (settingsRows ?? []).forEach(s => {
    settings[s.key] = s.value ?? '';
  });

  return (
    <DynamicForm
      template={template as Template}
      settings={settings}
    />
  );
}