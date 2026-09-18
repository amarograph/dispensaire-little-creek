import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getMemberStatus } from '@/lib/auth';
import SignOutButton from './SignOutButton';

export default async function PendingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const status = await getMemberStatus(user.id);

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
      </div>
    </div>
  );
}
