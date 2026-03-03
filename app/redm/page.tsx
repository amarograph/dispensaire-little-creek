'use client';

import Link from 'next/link';

const sections = [
  { href: '/redm/certificats', icon: '📜', title: 'Création de certificat', desc: 'Créer et gérer les certificats médicaux' },
  { href: '/redm/archives', icon: '🗄️', title: 'Archives', desc: 'Consulter tous les documents générés' },
  { href: '/redm/bibliotheque', icon: '📚', title: 'Bibliothèque', desc: 'Ressources et documents de référence' },
  { href: '/redm/contexte', icon: '🕰️', title: "Contexte de l'époque", desc: 'Histoire et contexte médical du Far West' },
  { href: '/redm/comptabilite', icon: '💰', title: 'Comptabilité', desc: 'Gestion financière et facturation' },
  { href: '/redm/essentiel', icon: '🏥', title: "L'essentiel du médecin", desc: 'Guides et protocoles essentiels' },
  { href: '/redm/rp-medic', icon: '❓', title: "Qu'est-ce que le RP médic ?", desc: 'Introduction au roleplay médical' },
];

export default function RedMDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-rose-900">La Tanière du médic — RedM</h1>
        <p className="text-gray-400 mt-2">Dispensaire 1890</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sections.map((s) => (
          <Link key={s.href} href={s.href}
            className="bg-rose-950/30 border border-rose-900/40 hover:border-rose-800 hover:bg-rose-950/50 rounded-xl p-6 transition group">
            <div className="text-4xl mb-4">{s.icon}</div>
            <h2 className="text-lg font-semibold text-rose-200 group-hover:text-rose-400 transition">{s.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}