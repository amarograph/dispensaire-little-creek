import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { isDirection } from '@/lib/permissions';
import { listMembers } from '@/actions/members';
import MemberRow from './MemberRow';

const DISPLAY = "'Central Station', 'Georgia', serif";
const BODY    = "'Cormorant Garamond', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";
const T = { border: 'rgba(139,90,43,0.30)', gold: '#D1B77C', text: '#EADCB9', muted: '#C8BEA5', dim: '#C8BEA5' };

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, marginTop: 8 }}>
      <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold, letterSpacing: '0.16em' }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(209,183,124,0.20)' }} />
    </div>
  );
}

export default async function AccessRequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('members')
    .select('roles, status')
    .eq('user_id', user.id)
    .single();

  if (!me || me.status !== 'approved' || !isDirection(me.roles)) {
    redirect('/redm');
  }

  const members = await listMembers();
  const pending = members.filter(m => m.status === 'pending');
  const decided = members.filter(m => m.status !== 'pending');

  return (
    <div className="admin-panel-content" style={{ fontFamily: BODY }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');`}</style>

      {/* Header */}
      <div style={{ marginBottom: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <Link href="/redm/direction" style={{ fontFamily: MONO, fontSize: 15, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '8px 18px', letterSpacing: '0.1em', textDecoration: 'none' }}>
            ← RETOUR
          </Link>
          <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold, letterSpacing: '0.18em' }}>DISPENSAIRE · DIRECTION · VALIDATION WHITELIST</span>
        </div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 36, color: T.gold, margin: 0 }}>📋 Demandes d&apos;accès</h1>
        <p style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.1em', marginTop: 8 }}>
          VALIDATION DES NOUVEAUX MEMBRES ET ATTRIBUTION DES RÔLES
        </p>
      </div>

      {/* En attente */}
      <SectionLabel>EN ATTENTE ({pending.length})</SectionLabel>
      {pending.length === 0 ? (
        <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, padding: '20px', textAlign: 'center', border: `1px dashed ${T.border}`, marginBottom: 34 }}>
          Aucune demande en attente.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 34 }}>
          {pending.map(m => (
            <MemberRow key={m.user_id} member={m} />
          ))}
        </div>
      )}

      {/* Membres traités */}
      <SectionLabel>MEMBRES TRAITÉS ({decided.length})</SectionLabel>
      {decided.length === 0 ? (
        <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, padding: '20px', textAlign: 'center', border: `1px dashed ${T.border}` }}>
          Aucun membre traité pour le moment.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {decided.map(m => (
            <MemberRow key={m.user_id} member={m} />
          ))}
        </div>
      )}
    </div>
  );
}
