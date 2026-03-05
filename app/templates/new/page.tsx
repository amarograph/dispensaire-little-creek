import { Suspense } from 'react';
import NewTemplateForm from './NewTemplateForm';

export default function NewTemplatePage() {
  return (
    <Suspense>
      <NewTemplateForm />
    </Suspense>
  );
}