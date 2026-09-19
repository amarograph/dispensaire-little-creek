'use client';

import Link from 'next/link';
import { isAdmin } from '@/lib/permissions';
import { useRedmSession } from '@/app/redm/_components/RedmSessionProvider';

/**
 * Bouton ADMIN — visible uniquement pour les membres avec le rôle admin.
 */
export default function AdminButton({ style }: { style?: React.CSSProperties }) {
  const { roles } = useRedmSession();

  if (!isAdmin(roles)) return null;

  return (
    <Link
      href="/admin"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '12px 22px',
        background: 'rgba(200,168,80,0.15)',
        border: '1px solid rgba(200,168,80,0.50)',
        borderRadius: 7,
        color: '#C8A850',
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 17,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      ⚙ ADMIN
    </Link>
  );
}
