import { requirePermission } from '@/lib/auth';
import AccessDenied from '@/components/redm/AccessDenied';

export default async function BibliothequePage() {
  try {
    await requirePermission('bibliotheque');
  } catch {
    return <AccessDenied />;
  }

  return (
    <div style={{ fontFamily: "'Josefin Slab', 'Georgia', serif" }}>
      <h1 style={{ fontFamily: "'Rye', 'Georgia', serif", fontSize: 32, color: '#E8D8C0', marginBottom: 10 }}>
        Bibliothèque
      </h1>
      <p style={{ fontSize: 16, color: '#C0B0A0', lineHeight: 1.7 }}>
        Traités médicaux, remèdes et guides de soins — contenu à venir.
      </p>
    </div>
  );
}
