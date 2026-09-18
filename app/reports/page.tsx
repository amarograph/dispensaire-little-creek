'use client';

import { useRouter } from 'next/navigation';

const templates = [
  { id: 'intervention', icon: '🦴', title: 'Traumatologie', desc: 'Accident, blessure, fracture' },
  { id: 'chirurgie', icon: '🔪', title: 'Chirurgie', desc: 'Rapport opératoire' },
  { id: 'consultation', icon: '🩺', title: 'Consultation générale', desc: 'Consultation standard' },
  { id: 'urgence', icon: '🚨', title: 'Urgence vitale', desc: 'Prise en charge urgente' },
  { id: 'intoxication', icon: '☠️', title: 'Intoxication', desc: 'Intoxication / overdose' },
  { id: 'psychiatrie', icon: '🧠', title: 'Psychiatrie', desc: 'Bilan psychiatrique' },
  { id: 'legiste', icon: '🔍', title: 'Médecin légiste', desc: 'Rapport légiste' },
  { id: 'deces', icon: '📋', title: 'Certificat de décès', desc: 'Constat de décès' },
];

export default function ReportsPage() {
  const router = useRouter();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-amber-400">Créer un rapport</h1>
        <p className="text-gray-400 mt-2">Choisissez le type de rapport à créer</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => router.push(`/reports/${t.id}`)}
            className="bg-slate-800/50 border border-slate-700 hover:border-amber-700 hover:bg-amber-950/30 rounded-xl p-5 transition group text-left"
          >
            <div className="text-3xl mb-3">{t.icon}</div>
            <h2 className="text-sm font-semibold text-amber-200 group-hover:text-amber-400 transition">
              {t.title}
            </h2>
            <p className="text-xs text-gray-500 mt-1">{t.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}