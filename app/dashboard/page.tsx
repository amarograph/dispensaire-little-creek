import Link from 'next/link';

const redmSections = [
  { href: '/reports', icon: '📋', title: 'Créer un rapport', desc: 'Remplir un formulaire et générer un PDF' },
  { href: '/archives', icon: '🗄️', title: 'Archives', desc: 'Consulter tous les documents générés' },
];

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-red-700">
          Dispensaire de Little Creek
        </h1>
        <p className="text-gray-400 mt-2">
          Système de gestion documentaire privé — RedM
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {redmSections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="bg-gray-900 border border-gray-800 hover:border-red-700 rounded-xl p-6 transition group"
          >
            <div className="text-4xl mb-4">{s.icon}</div>
            <h2 className="text-lg font-semibold group-hover:text-red-400 transition">
              {s.title}
            </h2>
            <p className="text-sm text-gray-400 mt-1">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}