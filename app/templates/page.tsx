import { getTemplates } from '@/actions/templates';
import Link from 'next/link';
import { TemplateList } from '@/components/admin/TemplateList';

export default async function AdminTemplatesPage({
  searchParams,
}: {
  searchParams: { universe?: string };
}) {
  const universe =
    searchParams.universe === 'redm' ? 'redm' : 'fivem';
  const templates = await getTemplates(universe);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Templates</h1>
          <p className="text-gray-400 text-sm mt-1">
            Gérer les modèles de documents
          </p>
        </div>
        <Link
          href={`/admin/templates/new?universe=${universe}`}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm transition"
        >
          + Nouveau template
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        {(['fivem', 'redm'] as const).map(u => (
          <Link
            key={u}
            href={`/admin/templates?universe=${u}`}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              universe === u
                ? u === 'fivem'
                  ? 'bg-blue-600 text-white'
                  : 'bg-amber-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {u === 'fivem' ? '🏥 FiveM' : '⚕️ RedM'}
          </Link>
        ))}
      </div>

      <TemplateList templates={templates} universe={universe} />
    </div>
  );
}