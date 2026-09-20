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

const MATERIAUX_DEFAULT: StockItem[] = [
  { id: 'tissu-solide', intitule: 'Tissu solide', quantite: 10 },
  { id: 'gourde-d-eau', intitule: "Gourde d'eau", quantite: 10 },
  { id: 'ethanol', intitule: 'Ethanol', quantite: 10 },
  { id: 'lotion-antiseptique', intitule: 'Lotion antiseptique', quantite: 10 },
  { id: 'composte', intitule: 'Composte', quantite: 10 },
  { id: 'dechet-organique', intitule: 'Déchet organique', quantite: 10 },
  { id: 'fil-de-peche', intitule: 'Fil de pêche', quantite: 10 },
  { id: 'salpetre', intitule: 'Salpêtre', quantite: 10 },
  { id: 'souffre', intitule: 'Souffre', quantite: 10 },
];

const MATERIELS_MEDICAUX_DEFAULT: StockItem[] = [
  { id: 'bandage-simple', intitule: 'Bandage simple', quantite: 10 },
  { id: 'bandage-ameliorer', intitule: 'Bandage améliorer', quantite: 10 },
  { id: 'trousse-de-soins', intitule: 'Trousse de soins', quantite: 10 },
  { id: 'ammoniaque', intitule: 'Ammoniaque', quantite: 10 },
  { id: 'infusion-de-ginseng', intitule: 'Infusion de Ginseng', quantite: 10 },
  { id: 'lait-de-pavot', intitule: 'Lait de Pavot', quantite: 10 },
  { id: 'canne', intitule: 'Canne', quantite: 10 },
  { id: 'cercueil', intitule: 'Cercueil', quantite: 10 },
];

const DEFAULT_CATEGORIES: StockCategorie[] = [
  { id: 'materiaux', nom: 'Matériaux', icon: '🧰', items: MATERIAUX_DEFAULT },
  { id: 'plantes', nom: 'Plantes', icon: '🌿', items: PLANTES_DEFAULT },
  { id: 'materiels-medicaux', nom: 'Matériels médicaux', icon: '💊', items: MATERIELS_MEDICAUX_DEFAULT },
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
