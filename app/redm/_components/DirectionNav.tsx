'use client';

import Link from 'next/link';
import { canRead, isAdmin } from '@/lib/permissions';
import { useRedmSession } from './RedmSessionProvider';

// Lien "Direction" — visible pour le Directeur, le Co-Directeur, le Médecin en Chef (lecture) et l'admin.
export default function DirectionNav() {
  const { roles } = useRedmSession();
  const canAccess = isAdmin(roles) || canRead(roles, 'redm_direction');

  if (!canAccess) return null;

  return (
    <Link href="/redm/direction">
      <span>🏛</span>Direction
    </Link>
  );
}
