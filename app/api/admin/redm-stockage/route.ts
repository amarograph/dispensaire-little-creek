import { NextRequest, NextResponse } from 'next/server';
import { requireDirectionActor, requireDirectionRead } from '@/lib/redm-api-auth';
import { createClient }              from '@supabase/supabase-js';
import { redmLog }                   from '@/lib/redm-log';

export const dynamic = 'force-dynamic';

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const KEY = 'redm_stockage';

interface StockItem { id: string; intitule: string; quantite: number; }
interface StockCategorie { id: string; nom: string; icon: string; items: StockItem[]; }

const PLANTES_DEFAULT: StockItem[] = [
  { id: 'absinthe', intitule: 'Absinthe', quantite: 10 },
  { id: 'sauge-rouge', intitule: 'Sauge Rouge', quantite: 10 },
  { id: 'pavot-somnifere', intitule: 'Pavot somnifère', quantite: 10 },
  { id: 'sauge-du-colibris', intitule: 'Sauge du colibris', quantite: 10 },
  { id: 'achillee-millefeuille', intitule: 'Achillée millefeuille', quantite: 10 },
  { id: 'aloe-verra', intitule: 'Aloe Verra', quantite: 10 },
  { id: 'alaska-ginseng', intitule: 'Alaska Ginseng', quantite: 10 },
  { id: 'rhubarbe', intitule: 'Rhubarbe', quantite: 10 },
  { id: 'verge-dor', intitule: "Verge d'or", quantite: 10 },
  { id: 'echinacee', intitule: 'Échinacée', quantite: 10 },
  { id: 'cassis', intitule: 'Cassis', quantite: 10 },
  { id: 'aubepine', intitule: 'Aubépine', quantite: 10 },
  { id: 'figue-de-barbarie', intitule: 'Figue de barbarie', quantite: 10 },
  { id: 'champignon-bolai-bai', intitule: 'Champignon Bolai Bai', quantite: 10 },
  { id: 'panax-quinquefolius', intitule: 'Panax quinquefolius', quantite: 10 },
  { id: 'camomille', intitule: 'Camomille', quantite: 10 },
  { id: 'perce-neige-violet', intitule: 'Perce Neige Viollet', quantite: 10 },
  { id: 'amanite-tulouche', intitule: 'Amanite Tulouche', quantite: 10 },
];

const DEFAULT_CATEGORIES: StockCategorie[] = [
  { id: 'materiaux', nom: 'Matériaux', icon: '🧰', items: [] },
  { id: 'plantes', nom: 'Plantes', icon: '🌿', items: PLANTES_DEFAULT },
  { id: 'materiels-medicaux', nom: 'Matériels médicaux', icon: '💊', items: [] },
];

/* Lecture : direction, co-direction, médecin en chef (lecteur) */

/* ── GET : inventaire complet (direction + médecin en chef) ──────────── */
export async function GET(req: NextRequest) {
  if (!await requireDirectionRead()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data } = await supabase().from('site_config').select('value').eq('key', KEY).single();
  return NextResponse.json({ categories: data?.value ?? DEFAULT_CATEGORIES });
}

/* ── POST : enregistrement de l'inventaire (direction uniquement) ───── */
export async function POST(req: NextRequest) {
  const actor = await requireDirectionActor();
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const categories = body?.categories;
  if (!Array.isArray(categories)) return NextResponse.json({ error: 'categories manquant' }, { status: 400 });

  const { error } = await supabase()
    .from('site_config')
    .upsert({ key: KEY, value: categories }, { onConflict: 'key' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const nbItems = (categories as any[]).reduce((s, c) => s + (c.items?.length ?? 0), 0);
  redmLog(actor, { action: 'stockage_update', category: 'stockage', description: `A mis à jour l'inventaire (${categories.length} catégorie(s), ${nbItems} article(s))`, meta: { nb_categories: categories.length, nb_items: nbItems } });
  return NextResponse.json({ ok: true });
}
