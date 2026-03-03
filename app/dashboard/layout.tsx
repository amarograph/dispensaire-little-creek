import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { UniverseProvider } from '@/components/layout/UniverseProvider';
import { Navbar } from '@/components/layout/Navbar';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.NEXT_PUBLIC_ALLOWED_EMAIL) {
    redirect('/login');
  }

  return (
    <UniverseProvider>
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar user={user} />
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          {children}
        </main>
      </div>
    </UniverseProvider>
  );
}