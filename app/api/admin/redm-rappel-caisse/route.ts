import { NextRequest, NextResponse } from 'next/server';
import { requireDirectionActor, requireDirectionRead } from '@/lib/redm-api-auth';
import { createServiceClient } from '@/lib/supabase/server';
import { redmLog } from '@/lib/redm-log';
import { CAISSE_KEY, CONFIG_DEFAUT, MESSAGE_DEFAUT, envoyerTestCaisse, lireConfigCaisse } from '@/lib/rappel-caisse';

export const dynamic = 'force-dynamic';

/* Réglage du rappel quotidien de caisse (heure, jours, message). Lecture : direction ; écriture : directeur / co-directeur / admin. */

export async function GET() {
  if (!await requireDirectionRead()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const db = await createServiceClient();
  const config = await lireConfigCaisse(db);

  /* Combien de préparateurs seraient concernés (information) */
  const { data: membres } = await db.from('members').select('roles').eq('status', 'approved');
  const nbPreparateurs = (membres ?? []).filter(m => (m.roles ?? []).includes('redm_preparateur_caisse')).length;

  return NextResponse.json({ config, defautMessage: MESSAGE_DEFAUT, webhookConfigure: !!process.env.DISCORD_CAISSE_WEBHOOK_URL, nbPreparateurs });
}

export async function POST(req: NextRequest) {
  const actor = await requireDirectionActor();
  if (!actor) return NextResponse.json({ error: 'Réservé à la direction' }, { status: 403 });

  try {
    const body = await req.json();
    const db = await createServiceClient();
    const actuelle = await lireConfigCaisse(db);

    if (body.action === 'test') {
      const r = await envoyerTestCaisse({ ...actuelle, message: typeof body.message === 'string' && body.message.trim() ? body.message : actuelle.message });
      return NextResponse.json(r, { status: r.ok ? 200 : 400 });
    }

    if (body.action === 'save' && body.config) {
      const c = body.config;
      const heure = typeof c.heure === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(c.heure) ? c.heure : CONFIG_DEFAUT.heure;
      const jours = Array.isArray(c.jours) ? Array.from(new Set(c.jours.map(Number).filter((n: number) => n >= 1 && n <= 7))).sort() : CONFIG_DEFAUT.jours;
      const next = {
        ...actuelle,
        actif: !!c.actif,
        heure,
        jours,
        seulementNonFaits: !!c.seulementNonFaits,
        message: typeof c.message === 'string' && c.message.trim() ? c.message.slice(0, 1500) : MESSAGE_DEFAUT,
        /* si l'heure ou les jours changent, la journée du jour peut de nouveau déclencher */
        derniereDate: (actuelle.heure !== heure) ? undefined : actuelle.derniereDate,
      };
      const { error } = await db.from('site_config').upsert({ key: CAISSE_KEY, value: next }, { onConflict: 'key' });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      redmLog(actor, {
        action: 'rappel_caisse_config', category: 'notes',
        description: `${actor.name} a ${next.actif ? 'activé' : 'désactivé'} le rappel de caisse (${next.heure}, ${next.jours.length} jour${next.jours.length > 1 ? 's' : ''} par semaine)`,
        meta: { actif: next.actif, heure: next.heure, jours: next.jours },
      });
      return NextResponse.json({ ok: true, config: next });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
