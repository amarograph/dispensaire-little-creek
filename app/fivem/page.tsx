'use client';

import Link from 'next/link';

const sections = [
  { href: '/fivem/reports', icon: '📋', title: 'Créer un rapport', desc: 'Remplir un formulaire et générer un PDF' },
  { href: '/fivem/archives', icon: '🗄️', title: 'Archives', desc: 'Consulter tous les documents générés' },
  { href: '/fivem/bibliotheque', icon: '📚', title: 'Bibliothèque', desc: 'Ressources et documents de référence' },
  { href: '/fivem/symptomes', icon: '🩺', title: 'Classification des symptômes', desc: 'Référence des symptômes et pathologies' },
  { href: '/fivem/comptabilite', icon: '💰', title: 'Comptabilité', desc: 'Gestion financière et facturation' },
  { href: '/fivem/essentiel', icon: '🏥', title: "L'essentiel du médecin", desc: 'Guides et protocoles essentiels' },
  { href: '/fivem/rp-medic', icon: '❓', title: "Qu'est-ce que le RP médic ?", desc: 'Introduction au roleplay médical' },
];

export default function FiveMDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-orange-700">La Tanière du médic — FiveM</h1>
        <p className="text-gray-400 mt-2">Hôpital Moderne</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sections.map((s) => (
          <Link key={s.href} href={s.href}
            className="bg-orange-950/30 border border-orange-900/40 hover:border-orange-700 hover:bg-orange-950/50 rounded-xl p-6 transition group">
            <div className="text-4xl mb-4">{s.icon}</div>
            <h2 className="text-lg font-semibold text-orange-200 group-hover:text-orange-400 transition">{s.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}