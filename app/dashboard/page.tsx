'use client';

import Link from 'next/link';
import { useUniverse } from '@/components/layout/UniverseProvider';

const fivemSections = [
  { href: '/reports', icon: '📋', title: 'Créer un rapport', desc: 'Remplir un formulaire et générer un PDF' },
  { href: '/archives', icon: '🗄️', title: 'Archives', desc: 'Consulter tous les documents générés' },
  { href: '/bibliotheque', icon: '📚', title: 'Bibliothèque', desc: 'Ressources et documents de référence' },
  { href: '/symptomes', icon: '🩺', title: 'Classification des symptômes', desc: 'Référence des symptômes et pathologies' },
  { href: '/comptabilite', icon: '💰', title: 'Comptabilité', desc: 'Gestion financière et facturation' },
  { href: '/essentiel', icon: '🏥', title: "L'essentiel du médecin", desc: 'Guides et protocoles essentiels' },
  { href: '/rp-medic', icon: '❓', title: "Qu'est-ce que le RP médic ?", desc: 'Introduction au roleplay médical' },
];

const redmSections = [
  { href: '/reports', icon: '📋', title: 'Créer un rapport', desc: 'Remplir un formulaire et générer un PDF' },
  { href: '/archives', icon: '🗄️', title: 'Archives', desc: 'Consulter tous les documents générés' },
];

export default function DashboardPage() {
  const { universe } = useUniverse();
  const isFivem = universe === 'fivem';
  const sections = isFivem ? fivemSections : redmSections;

  return (
    <div>
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${isFivem ? 'text-orange-700' : 'text-red-700'}`}>
          La Tanière du médic
        </h1>
        <p className="text-gray-400 mt-2">
          Système de gestion documentaire privé — {isFivem ? 'FiveM' : 'RedM'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={`bg-gray-900 border border-gray-800 ${isFivem ? 'hover:border-orange-700' : 'hover:border-red-700'} rounded-xl p-6 transition group`}
          >
            <div className="text-4xl mb-4">{s.icon}</div>
            <h2 className={`text-lg font-semibold ${isFivem ? 'group-hover:text-orange-400' : 'group-hover:text-red-400'} transition`}>
              {s.title}
            </h2>
            <p className="text-sm text-gray-400 mt-1">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}