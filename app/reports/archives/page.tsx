import { Suspense } from 'react';
import ArchivesContent from './ArchivesContent';

export default function ArchivesPage() {
  return (
    <Suspense>
      <ArchivesContent />
    </Suspense>
  );
}