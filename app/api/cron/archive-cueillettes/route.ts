/**
 * /api/cron/archive-cueillettes
 *
 * Archive les entrées de cueillette de la veille dans redm_cueillettes_archives.
 * Peut être appelé par un Vercel Cron (CRON_SECRET) ou manuellement par la
 * direction via le bouton « Archiver maintenant » sur la page cueilleurs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getApiSession } from '@/lib/api-auth';
import { isDirection } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const PRIX_PLANTE = 0.05;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const isCron = process.env.CRON_SECRET
    ? authHeader === `Bearer ${process.env.CRON_SECRET}`
    : false;

  if (!isCron) {
    const session = await getApiSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isDirection(session.roles)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const targetParam = req.nextUrl.searchParams.get('date');
  let dateStr: string;
  if (targetParam) {
    dateStr = targetParam;
  } else {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1);
    const base = d.toISOString().slice(0, 10);
    dateStr = `1890${base.slice(4)}`;
  }

  const supabase = await createServiceClient();

  const { data: cueilleurs } = await supabase
    .from('redm_cueilleurs')
    .select('id, nom_rp')
    .eq('actif', true);

  if (!cueilleurs?.length) return NextResponse.json({ ok: true, date: dateStr, archived: 0 });

  let count = 0;

  for (const c of cueilleurs) {
    const { data: entrees } = await supabase
      .from('redm_cueillettes')
      .select('plante, quantite')
      .eq('cueilleur_id', c.id)
      .eq('date', dateStr);

    if (!entrees?.length) continue;

    const total_plantes = entrees.reduce((s, e: any) => s + (e.quantite ?? 0), 0);
    const total_valeur  = +(total_plantes * PRIX_PLANTE).toFixed(2);

    const { data: existing } = await supabase
      .from('redm_cueillettes_archives')
      .select('montant_saisi')
      .eq('cueilleur_id', c.id)
      .eq('date', dateStr)
      .maybeSingle();

    const archiveRow: Record<string, unknown> = {
      cueilleur_id:  c.id,
      cueilleur_nom: c.nom_rp,
      date:          dateStr,
      entrees:       entrees.map((e: any) => ({
        plante:   e.plante,
        quantite: e.quantite,
        valeur:   +(e.quantite * PRIX_PLANTE).toFixed(2),
      })),
      total_plantes,
      total_valeur,
      archived_at: new Date().toISOString(),
    };
    if (existing?.montant_saisi != null) archiveRow.montant_saisi = existing.montant_saisi;

    await supabase
      .from('redm_cueillettes_archives')
      .upsert(archiveRow, { onConflict: 'cueilleur_id,date' });

    count++;
  }

  return NextResponse.json({ ok: true, date: dateStr, archived: count });
}
