'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UNIVERSES } from '@/lib/constants';
import type { User } from '@supabase/supabase-js';

export function Navbar({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const isActive = (path: string) =>
    pathname.startsWith(path)
      ? 'text-white bg-gray-800'
      : 'text-gray-400 hover:text-white hover:bg-gray-800/50';

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const uData = UNIVERSES.redm;

  return (
    <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">

          <Link href="/redm" className="flex items-center gap-2">
            <span className="text-2xl">{uData.icon}</span>
            <div>
              <div className="text-sm font-bold text-white leading-tight">
                Dispensaire de Little Creek
              </div>
              <div className="text-xs text-gray-500">{uData.subtitle}</div>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <Link href="/redm/certificats" className={`px-3 py-2 rounded-lg text-sm transition ${isActive('/redm/certificats')}`}>
              📜 Certificats
            </Link>
            <Link href="/redm/archives" className={`px-3 py-2 rounded-lg text-sm transition ${isActive('/redm/archives')}`}>
              🗄️ Archives
            </Link>
            <Link href="/redm/bibliotheque" className={`px-3 py-2 rounded-lg text-sm transition ${isActive('/redm/bibliotheque')}`}>
              📚 Bibliothèque
            </Link>
            <Link href="/admin" className={`px-3 py-2 rounded-lg text-sm transition ${isActive('/admin')}`}>
              ⚙️ Admin
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSignOut}
              className="text-xs text-gray-500 hover:text-red-400 transition px-2"
            >
              Déconnexion
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}