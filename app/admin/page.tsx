import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requirePermission } from '@/lib/auth';

export default async function AdminPage() {
  try {
    await requirePermission('direction');
  } catch {
    redirect('/redm');
  }

  const sections = [
    {
      href: '/admin/templates?universe=redm',
      icon: '📜',
      title: 'Templates RedM',
      desc: 'Dispensaire',
    },
    {
      href: '/admin/settings',
      icon: '⚙️',
      title: 'Paramètres',
      desc: 'NOM_HOPITAL, adresse...',
    },
    {
      href: '/admin/access',
      icon: '🛡️',
      title: 'Demandes d\'accès',
      desc: 'Valider les connexions Discord',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Administration</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map(s => (
          <Link
            key={s.href}
            href={s.href}
            className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-5 transition group"
          >
            <div className="text-3xl mb-3">{s.icon}</div>
            <div className="font-medium group-hover:text-white transition">
              {s.title}
            </div>
            <div className="text-sm text-gray-500 mt-1">{s.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}