import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getApiSession } from '@/lib/api-auth';

type TypeCategorie = 'vente' | 'achat';

const DEFAULT_CATEGORIES = [
  { id: 'Consultation', nom: 'Consultation', type: 'vente' as TypeCategorie, prix: 1,   pct_dispensaire: 50, pct_medecin: 50, ordre: 0 },
  { id: 'Traitement',   nom: 'Traitement',   type: 'vente' as TypeCategorie, prix: 0.4, pct_dispensaire: 50, pct_medecin: 50, ordre: 1 },
];

function toCategory(row: any, commandeSeulementIds: Set<string>) {
  return {
    id:             row.id,
    nom:            row.nom,
    type:           (row.type === 'achat' ? 'achat' : 'vente') as TypeCategorie,
    prix:           row.prix,
    pctDispensaire: row.pct_dispensaire,
    pctMedecin:     row.pct_medecin,
    ordre:          row.ordre,
    commandeSeulement: commandeSeulementIds.has(row.id),
  };
}

/* ── GET : catégories de tarifs (tout utilisateur connecté) ─────────── */
export async function GET() {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const supabase = await createServiceClient();
  const [{ data: rows }, { data: flagRow }] = await Promise.all([
    supabase.from('redm_tarifs').select('*').order('ordre'),
    supabase.from('site_config').select('value').eq('key', 'redm_tarifs_commande_seulement').single(),
  ]);
  const source = rows && rows.length > 0 ? rows : DEFAULT_CATEGORIES;
  const commandeSeulementIds = new Set<string>(Array.isArray(flagRow?.value) ? flagRow.value : []);

  return NextResponse.json({ categories: source.map(r => toCategory(r, commandeSeulementIds)) });
}
