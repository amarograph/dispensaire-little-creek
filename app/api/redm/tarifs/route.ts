import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getApiSession } from '@/lib/api-auth';

type TypeCategorie = 'vente' | 'achat';

const DEFAULT_CATEGORIES = [
  { id: 'Consultation', nom: 'Consultation', type: 'vente' as TypeCategorie, prix: 1,   pct_dispensaire: 50, pct_medecin: 50, ordre: 0 },
  { id: 'Traitement',   nom: 'Traitement',   type: 'vente' as TypeCategorie, prix: 0.4, pct_dispensaire: 50, pct_medecin: 50, ordre: 1 },
];

function toCategory(row: any) {
  return {
    id:             row.id,
    nom:            row.nom,
    type:           (row.type === 'achat' ? 'achat' : 'vente') as TypeCategorie,
    prix:           row.prix,
    pctDispensaire: row.pct_dispensaire,
    pctMedecin:     row.pct_medecin,
    ordre:          row.ordre,
  };
}

/* ── GET : catégories de tarifs (tout utilisateur connecté) ─────────── */
export async function GET() {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const supabase = await createServiceClient();
  const { data: rows } = await supabase.from('redm_tarifs').select('*').order('ordre');
  const source = rows && rows.length > 0 ? rows : DEFAULT_CATEGORIES;

  return NextResponse.json({ categories: source.map(toCategory) });
}
