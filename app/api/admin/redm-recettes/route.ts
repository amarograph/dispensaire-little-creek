import { NextRequest, NextResponse } from 'next/server';
import { requireDirectionActor, requireDirectionRead } from '@/lib/redm-api-auth';
import { createServiceClient } from '@/lib/supabase/server';
import { redmLog } from '@/lib/redm-log';

const KEY = 'redm_recettes_fabrication';

interface Ingredient { nom: string; quantite: number; }
interface Recette {
  id: string; nom: string; variante?: string;
  quantiteProduite: number; ingredients: Ingredient[]; ordre: number;
}

const DEFAULT_RECETTES: Recette[] = [
  { id: 'bandage-simple', nom: 'Bandage simple', quantiteProduite: 18, ordre: 0, ingredients: [
    { nom: 'Tissu solide', quantite: 1 },
  ] },
  { id: 'bandage-ameliore', nom: 'Bandage amélioré', quantiteProduite: 10, ordre: 1, ingredients: [
    { nom: 'Tissu solide', quantite: 1 },
    { nom: 'Lotion antiseptique', quantite: 1 },
  ] },
  { id: 'fiole-ammoniac', nom: "Fiole d'ammoniac", quantiteProduite: 1, ordre: 2, ingredients: [
    { nom: 'Composte', quantite: 2 },
    { nom: 'Déchet organique', quantite: 1 },
    { nom: "Gourde d'eau", quantite: 1 },
  ] },
  { id: 'infusion-ginseng-alaska', nom: "Infusion au Ginseng d'Alaska", quantiteProduite: 1, ordre: 3, ingredients: [
    { nom: "Ginseng d'Alaska", quantite: 2 },
    { nom: 'Menthe sauvage', quantite: 5 },
    { nom: "Gourde d'eau", quantite: 1 },
  ] },
  { id: 'infusion-ginseng-americain', nom: 'Infusion au Ginseng Américain', quantiteProduite: 1, ordre: 4, ingredients: [
    { nom: 'Ginseng Américain', quantite: 2 },
    { nom: 'Menthe sauvage', quantite: 5 },
    { nom: "Gourde d'eau", quantite: 1 },
  ] },
  { id: 'lait-pavot', nom: 'Lait de pavot', quantiteProduite: 1, ordre: 5, ingredients: [
    { nom: 'Pavot des champs', quantite: 10 },
    { nom: "Gourde d'eau", quantite: 1 },
  ] },
  { id: 'lotion-antiseptique-thym', nom: 'Lotion antiseptique', variante: 'Thym & Camomille', quantiteProduite: 3, ordre: 6, ingredients: [
    { nom: 'Thym sauvage', quantite: 2 },
    { nom: 'Camomille sauvage', quantite: 1 },
    { nom: "Tonneau d'éthanol", quantite: 1 },
  ] },
  { id: 'lotion-antiseptique-ginseng', nom: 'Lotion antiseptique', variante: 'Ginseng & Bardane', quantiteProduite: 3, ordre: 7, ingredients: [
    { nom: 'Ginseng Américain', quantite: 1 },
    { nom: 'Bardane', quantite: 2 },
    { nom: "Tonneau d'éthanol", quantite: 1 },
  ] },
  { id: 'medicament', nom: 'Médicament', quantiteProduite: 1, ordre: 8, ingredients: [
    { nom: "Ginseng d'Alaska", quantite: 4 },
    { nom: 'Camomille sauvage', quantite: 4 },
    { nom: "Gourde d'eau", quantite: 1 },
  ] },
  { id: 'trousse-de-soins', nom: 'Trousse de soins', quantiteProduite: 6, ordre: 9, ingredients: [
    { nom: 'Bandage simple', quantite: 6 },
    { nom: 'Bandage amélioré', quantite: 6 },
    { nom: 'Lotion antiseptique', quantite: 2 },
    { nom: 'Fil de pêche', quantite: 1 },
  ] },
  { id: 'macerat-catalyse-agricole', nom: 'Macérat de Catalyse Agricole', quantiteProduite: 1, ordre: 10, ingredients: [
    { nom: 'Laurier Rose', quantite: 50 },
    { nom: 'Ginseng Américain', quantite: 50 },
    { nom: 'Salpêtre', quantite: 20 },
    { nom: 'Souffre', quantite: 10 },
  ] },
];

function uid() { return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`; }

/* GET — liste des recettes de fabrication (lecture : direction, co-direction, médecin en chef) */
export async function GET() {
  if (!await requireDirectionRead()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createServiceClient();
  const { data } = await supabase.from('site_config').select('value').eq('key', KEY).single();
  const recettes: Recette[] = Array.isArray(data?.value) && data.value.length ? data.value : DEFAULT_RECETTES;
  return NextResponse.json({ recettes: [...recettes].sort((a, b) => a.ordre - b.ordre) });
}

/* POST — créer une recette */
export async function POST(req: NextRequest) {
  const actor = await requireDirectionActor();
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const nom = String(body.nom ?? '').trim();
  if (!nom) return NextResponse.json({ error: 'Nom manquant' }, { status: 400 });

  const supabase = await createServiceClient();
  const { data } = await supabase.from('site_config').select('value').eq('key', KEY).single();
  const current: Recette[] = Array.isArray(data?.value) && data.value.length ? data.value : DEFAULT_RECETTES;

  const recette: Recette = {
    id: uid(),
    nom,
    variante: body.variante ? String(body.variante).trim() : undefined,
    quantiteProduite: Math.max(1, Number(body.quantiteProduite) || 1),
    ingredients: Array.isArray(body.ingredients)
      ? body.ingredients.map((i: any) => ({ nom: String(i.nom ?? '').trim(), quantite: Math.max(1, Number(i.quantite) || 1) })).filter((i: Ingredient) => i.nom)
      : [],
    ordre: current.reduce((m, r) => Math.max(m, r.ordre), -1) + 1,
  };

  const next = [...current, recette];
  const { error } = await supabase.from('site_config').upsert({ key: KEY, value: next }, { onConflict: 'key' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  redmLog(actor, { action: 'recette_create', category: 'fabrication', description: `${actor.name} a créé la recette « ${nom}${recette.variante ? ` — ${recette.variante}` : ''} »`, meta: { id: recette.id } });
  return NextResponse.json({ recette });
}

/* PATCH — modifier une recette */
export async function PATCH(req: NextRequest) {
  const actor = await requireDirectionActor();
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: 'id manquant' }, { status: 400 });

  const supabase = await createServiceClient();
  const { data } = await supabase.from('site_config').select('value').eq('key', KEY).single();
  const current: Recette[] = Array.isArray(data?.value) && data.value.length ? data.value : DEFAULT_RECETTES;

  const idx = current.findIndex(r => r.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Recette introuvable' }, { status: 404 });

  const updated: Recette = {
    ...current[idx],
    nom:              typeof body.nom === 'string' && body.nom.trim() ? body.nom.trim() : current[idx].nom,
    variante:         body.variante !== undefined ? (String(body.variante).trim() || undefined) : current[idx].variante,
    quantiteProduite: body.quantiteProduite !== undefined ? Math.max(1, Number(body.quantiteProduite) || 1) : current[idx].quantiteProduite,
    ingredients:      Array.isArray(body.ingredients)
      ? body.ingredients.map((i: any) => ({ nom: String(i.nom ?? '').trim(), quantite: Math.max(1, Number(i.quantite) || 1) })).filter((i: Ingredient) => i.nom)
      : current[idx].ingredients,
  };

  const next = current.map(r => r.id === id ? updated : r);
  const { error } = await supabase.from('site_config').upsert({ key: KEY, value: next }, { onConflict: 'key' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  redmLog(actor, { action: 'recette_update', category: 'fabrication', description: `${actor.name} a modifié la recette « ${updated.nom}${updated.variante ? ` — ${updated.variante}` : ''} »`, meta: { id } });
  return NextResponse.json({ ok: true });
}

/* DELETE — supprimer une recette */
export async function DELETE(req: NextRequest) {
  const actor = await requireDirectionActor();
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id manquant' }, { status: 400 });

  const supabase = await createServiceClient();
  const { data } = await supabase.from('site_config').select('value').eq('key', KEY).single();
  const current: Recette[] = Array.isArray(data?.value) && data.value.length ? data.value : DEFAULT_RECETTES;

  const removed = current.find(r => r.id === id);
  const next = current.filter(r => r.id !== id);
  const { error } = await supabase.from('site_config').upsert({ key: KEY, value: next }, { onConflict: 'key' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (removed) redmLog(actor, { action: 'recette_delete', category: 'fabrication', description: `${actor.name} a supprimé la recette « ${removed.nom}${removed.variante ? ` — ${removed.variante}` : ''} »`, meta: { id } });
  return NextResponse.json({ ok: true });
}
