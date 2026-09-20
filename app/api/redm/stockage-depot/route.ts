import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-auth';
import { createServiceClient } from '@/lib/supabase/server';
import { canEdit, isAdmin } from '@/lib/permissions';
import { redmLog } from '@/lib/redm-log';

const KEY        = 'redm_stockage';
const DEPOTS_KEY = 'redm_stockage_depots';

interface StockItem { id: string; intitule: string; quantite: number; }
interface StockCategorie { id: string; nom: string; icon: string; items: StockItem[]; }
interface Depot { id: string; auteur: string; categorie: string; item: string; quantite: number; date: string; createdAt: string; }

function slug(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function canDeposit(roles: string[]) {
  return isAdmin(roles) || canEdit(roles, 'redm_comptabilite');
}

/* GET — catalogue des catégories/articles (sans quantités) pour le formulaire de dépôt, ouvert à tout le personnel */
export async function GET() {
  const session = await getApiSession();
  if (!session || !canDeposit(session.roles)) return NextResponse.json({ categories: [] }, { status: 200 });

  const supabase = await createServiceClient();
  const { data } = await supabase.from('site_config').select('value').eq('key', KEY).single();
  const categories: StockCategorie[] = Array.isArray(data?.value) ? data.value : [];
  return NextResponse.json({
    categories: categories.map(c => ({ id: c.id, nom: c.nom, icon: c.icon, items: c.items.map(i => ({ id: i.id, intitule: i.intitule })) })),
  });
}

/* POST { categorieId, itemId?, nouvelIntitule?, quantite } — déclare un dépôt, ajouté immédiatement au stock */
export async function POST(req: NextRequest) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  if (!canDeposit(session.roles)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const categorieId     = String(body?.categorieId ?? '');
  const itemId          = body?.itemId ? String(body.itemId) : '';
  const nouvelIntitule  = String(body?.nouvelIntitule ?? '').trim();
  const quantite        = Math.floor(Number(body?.quantite));

  if (!categorieId) return NextResponse.json({ error: 'Catégorie manquante' }, { status: 400 });
  if (!itemId && !nouvelIntitule) return NextResponse.json({ error: 'Article manquant' }, { status: 400 });
  if (!Number.isFinite(quantite) || quantite <= 0) return NextResponse.json({ error: 'Quantité invalide' }, { status: 400 });

  const supabase = await createServiceClient();
  const { data } = await supabase.from('site_config').select('value').eq('key', KEY).single();
  const categories: StockCategorie[] = Array.isArray(data?.value) ? data.value : [];
  const cat = categories.find(c => c.id === categorieId);
  if (!cat) return NextResponse.json({ error: 'Catégorie introuvable' }, { status: 404 });

  let item: StockItem | undefined;
  if (itemId) {
    item = cat.items.find(i => i.id === itemId);
    if (!item) return NextResponse.json({ error: 'Article introuvable' }, { status: 404 });
    item.quantite += quantite;
  } else {
    const existing = cat.items.find(i => i.intitule.trim().toLowerCase() === nouvelIntitule.toLowerCase());
    if (existing) {
      existing.quantite += quantite;
      item = existing;
    } else {
      item = { id: slug(nouvelIntitule) || `item-${Date.now().toString(36)}`, intitule: nouvelIntitule, quantite };
      cat.items.push(item);
    }
  }

  const { error } = await supabase.from('site_config').upsert({ key: KEY, value: categories }, { onConflict: 'key' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: depotsRow } = await supabase.from('site_config').select('value').eq('key', DEPOTS_KEY).single();
  const depots: Depot[] = Array.isArray(depotsRow?.value) ? depotsRow.value : [];
  const entry: Depot = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    auteur: session.username, categorie: cat.nom, item: item.intitule, quantite,
    date: new Date().toLocaleDateString('fr-FR'), createdAt: new Date().toISOString(),
  };
  const nextDepots = [entry, ...depots].slice(0, 50);
  await supabase.from('site_config').upsert({ key: DEPOTS_KEY, value: nextDepots }, { onConflict: 'key' });

  redmLog({ id: session.discordId, name: session.username }, {
    action: 'stockage_depot', category: 'stockage',
    description: `${session.username} a déposé ${quantite} × ${item.intitule} (${cat.nom})`,
    meta: { categorie: cat.nom, item: item.intitule, quantite },
  });

  return NextResponse.json({ ok: true, item, categorie: cat.nom });
}
