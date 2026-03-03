import { renderTemplate, renderTableAsHtml } from './template-engine';
import type { Template } from '@/types';

export async function generatePDF(
  template: Template,
  fieldValues: Record<string, unknown>,
  settings: Record<string, string>
): Promise<Buffer> {
  const text = buildText(template, fieldValues, settings);
  
  // Encode le texte en UTF-8 dans un Buffer
  return Buffer.from(text, 'utf-8');
}

function buildText(
  template: Template,
  fieldValues: Record<string, unknown>,
  settings: Record<string, string>
): string {
  const fields = template.template_fields ?? [];
  const isRedm = template.universe === 'redm';

  let body = renderTemplate(template.body, fieldValues, settings);

  const hospitalName = settings.NOM_HOPITAL ?? (isRedm ? 'Dispensaire' : 'Hôpital');
  const subtitle = settings.SOUS_TITRE ?? (isRedm ? 'Registre Médical — 1890' : 'Dossier Médical');

  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
================================================================================
${hospitalName.toUpperCase()}
${subtitle}
${template.universe.toUpperCase()} — ${dateStr}
================================================================================

${template.name.toUpperCase()}

${body}

--------------------------------------------------------------------------------
Document confidentiel — Généré le ${dateStr}
================================================================================
`.trim();
}