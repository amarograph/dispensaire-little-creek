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
  { id: 'ginseng-americain', intitule: 'Ginseng Americain', quantite: 10 },
  { id: 'gingseng-alaska', intitule: 'Gingseng Alaska', quantite: 10 },
  { id: 'camomille', intitule: 'Camomille', quantite: 10 },
  { id: 'menthe', intitule: 'Menthe', quantite: 10 },
  { id: 'thym', intitule: 'Thym', quantite: 10 },
  { id: 'laurier-rose', intitule: 'Laurier Rose', quantite: 10 },
  { id: 'pavot', intitule: 'Pavot', quantite: 10 },
  { id: 'bardane', intitule: 'Bardane', quantite: 10 },
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
