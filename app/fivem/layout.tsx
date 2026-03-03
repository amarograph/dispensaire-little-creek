import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { UniverseProvider } from '@/components/layout/UniverseProvider';
import { Navbar } from '@/components/layout/Navbar';

export default async function FiveMLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.NEXT_PUBLIC_ALLOWED_EMAIL) {
    redirect('/login');
  }

  return (
    <UniverseProvider>
      <div className="min-h-screen text-white" style={{ background: 'radial-gradient(ellipse at top, #1c1008 0%, #1e293b 40%, #0f172a 100%)' }}>
        <Navbar user={user} />
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          {children}
        </main>
      </div>
    </UniverseProvider>
  );
}