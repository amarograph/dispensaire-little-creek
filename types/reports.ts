'use server';

import { generatePDF } from '@/lib/pdf-generator';
import { renderTemplate } from '@/lib/template-engine';
import { requireApprovedMember as getAuthenticatedUser } from '@/lib/auth';
import type { Template } from '@/types';

export async function submitReport(
  templateId: string,
  fieldValues: Record<string, unknown>,
  settings: Record<string, string>
): Promise<string> {
  const { supabase, user } = await getAuthenticatedUser();

  const { data: template, error: tErr } = await supabase
    .from('templates')
    .select('*, template_fields(*)')
    .eq('id', templateId)
    .eq('owner_id', user.id)
    .eq('published', true)
    .single();

  if (tErr || !template) throw new Error('Template introuvable');

  const patientName =
    (fieldValues['patient_name'] as string) ||
    (fieldValues['nom_patient'] as string) ||
    (fieldValues['patient'] as string) ||
    'Unknown Patient';

  const date = new Date().toISOString().split('T')[0];
  const cleanTemplate = template.name
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim();
  const cleanPatient = patientName
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim();
  const filename = `${date} - ${cleanTemplate} - ${cleanPatient}.pdf`;

  const renderedBody = renderTemplate(template.body, fieldValues, settings);

  const pdfBuffer = await generatePDF(
    template as Template,
    fieldValues,
    settings
  );

  const storagePath = `${user.id}/${template.universe}/${date}/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from('pdf-archives')
    .upload(storagePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: false,
    });

  if (uploadError) throw new Error(`Upload échoué: ${uploadError.message}`);

  const { data: archive, error: archiveError } = await supabase
    .from('archives')
    .insert({
      owner_id: user.id,
      universe: template.universe,
      template_id: template.id,
      template_name: template.name,
      patient_name: patientName,
      storage_path: storagePath,
      filename,
      field_values: fieldValues,
      rendered_body: renderedBody,
    })
    .select('id')
    .single();

  if (archiveError) throw new Error(`Archive échouée: ${archiveError.message}`);

  return archive.id;
}