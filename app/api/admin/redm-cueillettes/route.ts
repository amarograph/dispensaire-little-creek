import { NextRequest, NextResponse } from 'next/server';
import { requireDirectionActor, requireDirectionRead } from '@/lib/redm-api-auth';
import { createClient }              from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export const PRIX_PLANTE = 0.05;

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * GET ?cueilleur_id=X&mois=YYYY-MM   → entrées du mois (aperçu calendrier)
 * GET ?cueilleur_id=X&date=YYYY-MM-DD → entrées d'un jour + montant_saisi
 * GET ?cueilleur_id=X&archives=1      → archives de ce cueilleur
 */
export async function GET(req: NextRequest) {
  const actor = await requireDirectionActor();
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const cid  = req.nextUrl.searchParams.get('cueilleur_id') ?? '';
  const mois = req.nextUrl.searchParams.get('mois')         ?? '';
  const date = req.nextUrl.searchParams.get('date')         ?? '';
  const arch = req.nextUrl.searchParams.get('archives')     ?? '';
  const all  = req.nextUrl.searchParams.get('all')          ?? '';

  const supabase = admin();

  // Récapitulatif global — toutes les archives de tous les cueilleurs
  if (all) {
    const { data, error } = await supabase
      .from('redm_cueillettes_archives')
      .select('id,date,cueilleur_id,cueilleur_nom,entrees,total_plantes,total_valeur,montant_saisi')
      .order('date', { ascending: false })
      .order('cueilleur_nom', { ascending: true });
    if (error) {
      if (error.code === '42P01') return NextResponse.json({ archives: [] });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ archives: data ?? [] });
  }

  if (!cid) return NextResponse.json({ error: 'cueilleur_id requis' }, { status: 400 });

  if (arch) {
    const { data, error } = await supabase
      .from('redm_cueillettes_archives')
      .select('*')
      .eq('cueilleur_id', cid)
      .order('date', { ascending: false });
    if (error) {
      if (error.code === '42P01') return NextResponse.json({ archives: [] });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ archives: data ?? [] });
  }

  if (date) {
    const [{ data: entrees }, { data: arch }] = await Promise.all([
      supabase.from('redm_cueillettes')
        .select('id, plante, quantite')
        .eq('cueilleur_id', cid)
        .eq('date', date),
      supabase.from('redm_cueillettes_archives')
        .select('montant_saisi')
        .eq('cueilleur_id', cid)
        .eq('date', date)
        .maybeSingle(),
    ]);
    return NextResponse.json({
      entrees: entrees ?? [],
      montant_saisi: arch?.montant_saisi ?? null,
    });
  }

  if (mois) {
    const from = `${mois}-01`;
    const to   = `${mois}-31`;
    const { data, error } = await supabase
      .from('redm_cueillettes')
      .select('date, plante, quantite')
      .eq('cueilleur_id', cid)
      .gte('date', from)
      .lte('date', to);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ entrees: data ?? [] });
  }

  return NextResponse.json({ error: 'mois ou date requis' }, { status: 400 });
}

/**
 * POST — sauvegarde complète d'un jour
 * body: { cueilleur_id, date, cueilleur_nom, entrees: [{plante, quantite}], montant_saisi? }
 * Supprime les entrées existantes pour ce jour et insère les nouvelles.
 * Met également à jour l'archive du jour (upsert).
 */
export async function POST(req: NextRequest) {
  const actor = await requireDirectionActor();
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { cueilleur_id, date, cueilleur_nom, entrees, montant_saisi } = await req.json();
  if (!cueilleur_id || !date)
    return NextResponse.json({ error: 'cueilleur_id et date requis' }, { status: 400 });

  const supabase = admin();

  // Supprime toutes les entrées existantes pour ce jour
  await supabase
    .from('redm_cueillettes')
    .delete()
    .eq('cueilleur_id', cueilleur_id)
    .eq('date', date);

  // Insère les nouvelles entrées (quantité > 0 uniquement)
  const toInsert = ((entrees ?? []) as { plante: string; quantite: number }[])
    .filter(e => e.quantite > 0);

  if (toInsert.length > 0) {
    const { error: insErr } = await supabase
      .from('redm_cueillettes')
      .insert(toInsert.map(e => ({ cueilleur_id, date, plante: e.plante, quantite: e.quantite })));
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  // Met à jour l'archive du jour (calcule les totaux)
  const total_plantes = toInsert.reduce((s, e) => s + e.quantite, 0);
  const total_valeur  = +(total_plantes * PRIX_PLANTE).toFixed(2);

  const hasMontant = montant_saisi !== undefined && montant_saisi !== null && montant_saisi !== '';

  if (total_plantes > 0 || hasMontant) {
    const archiveRow: Record<string, unknown> = {
      cueilleur_id,
      date,
      cueilleur_nom: cueilleur_nom ?? cueilleur_id,
      entrees: toInsert.map(e => ({
        plante:   e.plante,
        quantite: e.quantite,
        valeur:   +(e.quantite * PRIX_PLANTE).toFixed(2),
      })),
      total_plantes,
      total_valeur,
    };
    if (hasMontant) archiveRow.montant_saisi = parseFloat(String(montant_saisi));

    await supabase
      .from('redm_cueillettes_archives')
      .upsert(archiveRow, { onConflict: 'cueilleur_id,date' });
  }

  return NextResponse.json({ ok: true });
}
