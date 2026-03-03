'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUniverse } from './UniverseProvider';
import { UNIVERSES } from '@/lib/constants';
import type { User } from '@supabase/supabase-js';

export function Navbar({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const { universe, setUniverse } = useUniverse();
  const supabase = createClient();

  const isActive = (path: string) =>
    pathname.startsWith(path)
      ? 'text-white bg-gray-800'
      : 'text-gray-400 hover:text-white hover:bg-gray-800/50';

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  function handleUniverseChange(id: string) {
    setUniverse(id as any);
    router.push(id === 'fivem' ? '/fivem' : '/redm');
  }

  const uData = UNIVERSES[universe];
  const isFivem = universe === 'fivem';

  return (
    <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">

          <Link href={isFivem ? '/fivem' : '/redm'} className="flex items-center gap-2">
            <span className="text-2xl">{uData.icon}</span>
            <div>
              <div className="text-sm font-bold text-white leading-tight">
                La Tanière de l'EMS
              </div>
              <div className="text-xs text-gray-500">{uData.subtitle}</div>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            {isFivem ? (
              <>
                <Link href="/fivem/reports" className={`px-3 py-2 rounded-lg text-sm transition ${isActive('/fivem/reports')}`}>
                  📋 Rapports
                </Link>
                <Link href="/fivem/archives" className={`px-3 py-2 rounded-lg text-sm transition ${isActive('/fivem/archives')}`}>
                  🗄️ Archives
                </Link>
                <Link href="/fivem/bibliotheque" className={`px-3 py-2 rounded-lg text-sm transition ${isActive('/fivem/bibliotheque')}`}>
                  📚 Bibliothèque
                </Link>
              </>
            ) : (
              <>
                <Link href="/redm/certificats" className={`px-3 py-2 rounded-lg text-sm transition ${isActive('/redm/certificats')}`}>
                  📜 Certificats
                </Link>
                <Link href="/redm/archives" className={`px-3 py-2 rounded-lg text-sm transition ${isActive('/redm/archives')}`}>
                  🗄️ Archives
                </Link>
                <Link href="/redm/bibliotheque" className={`px-3 py-2 rounded-lg text-sm transition ${isActive('/redm/bibliotheque')}`}>
                  📚 Bibliothèque
                </Link>
              </>
            )}
            <Link href="/admin" className={`px-3 py-2 rounded-lg text-sm transition ${isActive('/admin')}`}>
              ⚙️ Admin
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-800 rounded-lg p-1 gap-1">
              {Object.values(UNIVERSES).map(u => (
                <button
                  key={u.id}
                  onClick={() => handleUniverseChange(u.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                    universe === u.id
                      ? u.id === 'fivem'
                        ? 'bg-orange-700 text-white'
                        : 'bg-rose-900 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {u.icon} {u.label}
                </button>
              ))}
            </div>

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