import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getApiSession } from '@/lib/api-auth';
import { requireDirectionActor } from '@/lib/redm-api-auth';
import { redmLog } from '@/lib/redm-log';

/* Réductions (ex. Écurie de Little Creek −10 %) : définies par la Direction, appliquées aux ventes et commandes */
const REDUCTIONS_KEY = 'redm_reductions';
type Reduction = { nom: string; pct: number; actif: boolean };
const DEFAULT_REDUCTIONS: Reduction[] = [{ nom: 'Écurie de Little Creek', pct: 10, actif: true }];
function normReductions(v: unknown): Reduction[] {
  if (!Array.isArray(v)) return DEFAULT_REDUCTIONS;
  const vu = new Set<string>();
  return v.map((r: any) => ({ nom: String(r?.nom ?? '').trim().slice(0, 60), pct: Math.max(0, Math.min(100, Math.round((Number(r?.pct) || 0) * 100) / 100)), actif: r?.actif !== false }))
    .filter(r => r.nom && !vu.has(r.nom) && vu.add(r.nom));
}

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
  const [{ data: rows }, { data: flagRow }, { data: redRow }] = await Promise.all([
    supabase.from('redm_tarifs').select('*').order('ordre'),
    supabase.from('site_config').select('value').eq('key', 'redm_tarifs_commande_seulement').single(),
    supabase.from('site_config').select('value').eq('key', REDUCTIONS_KEY).single(),
  ]);
  const source = rows && rows.length > 0 ? rows : DEFAULT_CATEGORIES;
  const commandeSeulementIds = new Set<string>(Array.isArray(flagRow?.value) ? flagRow.value : []);

  return NextResponse.json({ categories: source.map(r => toCategory(r, commandeSeulementIds)), reductions: redRow ? normReductions(redRow.value) : DEFAULT_REDUCTIONS });
}

/* ── PUT : enregistre la liste des réductions (direction / co-direction) ── */
export async function PUT(req: Request) {
  const actor = await requireDirectionActor();
  if (!actor) return NextResponse.json({ error: 'Réservé à la direction' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const reductions = normReductions(body.reductions);
  const supabase = await createServiceClient();
  const { error } = await supabase.from('site_config').upsert({ key: REDUCTIONS_KEY, value: reductions }, { onConflict: 'key' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  redmLog(actor, { action: 'reductions_update', category: 'tarifs', description: `A modifié les réductions : ${reductions.map(r => `${r.nom} −${r.pct} %${r.actif ? '' : ' (désactivée)'}`).join(' · ') || 'aucune'}`, meta: { reductions } });
  return NextResponse.json({ ok: true, reductions });
}
