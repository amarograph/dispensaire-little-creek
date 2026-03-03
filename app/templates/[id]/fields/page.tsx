import { getTemplate } from '@/actions/templates';
import { TemplateEditor } from '@/components/admin/TemplateEditor';

export default async function EditTemplatePage({
  params,
}: {
  params: { id: string };
}) {
  const template = await getTemplate(params.id);
  return <TemplateEditor template={template} />;
}