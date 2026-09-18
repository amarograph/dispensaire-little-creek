import { requirePermission } from '@/lib/auth';
import AccessDenied from '@/components/redm/AccessDenied';

export default async function CabinetPage() {
  try {
    await requirePermission('cabinet');
  } catch {
    return <AccessDenied />;
  }

  return (
    <div style={{ fontFamily: "'Josefin Slab', 'Georgia', serif" }}>
      <h1 style={{ fontFamily: "'Rye', 'Georgia', serif", fontSize: 32, color: '#E8D8C0', marginBottom: 10 }}>
        Cabinet Thérapeutique
      </h1>
      <p style={{ fontSize: 16, color: '#C0B0A0', lineHeight: 1.7 }}>
        Espace réservé aux séances thérapeutiques — contenu à venir.
      </p>
    </div>
  );
}
