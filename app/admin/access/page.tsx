import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isDirection } from '@/lib/permissions';
import { listMembers } from '@/actions/members';
import MemberRow from './MemberRow';

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
    <div>
      <h1 className="text-2xl font-bold mb-8">Demandes d'accès</h1>

      <div className="mb-10">
        <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-3">
          En attente ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucune demande en attente.</p>
        ) : (
          <div className="space-y-2">
            {pending.map(m => (
              <MemberRow key={m.user_id} member={m} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-3">
          Membres traités
        </h2>
        {decided.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucun membre traité pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {decided.map(m => (
              <MemberRow key={m.user_id} member={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
