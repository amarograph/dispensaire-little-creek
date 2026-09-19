import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from './SignOutButton';

export default async function PendingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('status, roles')
    .eq('user_id', user.id)
    .single();

  const status = member?.status ?? null;

  if (status === 'approved') {
    redirect('/redm');
  }

  const rejected = status === 'rejected';

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="text-5xl mb-4">{rejected ? '⛔' : '⏳'}</div>
        <h1 className="text-2xl font-bold text-white mb-2">
          {rejected ? 'Accès refusé' : 'En attente de validation'}
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          {rejected
            ? "La direction n'a pas validé ta demande d'accès."
            : 'Ta demande a bien été enregistrée. Un membre de la direction doit valider ton accès avant que tu puisses entrer.'}
        </p>
        <SignOutButton />

        <div style={{ marginTop: 40, textAlign: 'left', fontSize: 11, color: '#666', background: '#111', padding: 12, borderRadius: 8, fontFamily: 'monospace', wordBreak: 'break-all' }}>
          DEBUG (temporaire) —<br />
          user.id: {user.id}<br />
          member: {JSON.stringify(member)}<br />
          error: {JSON.stringify(memberError)}
        </div>
      </div>
    </div>
  );
}
