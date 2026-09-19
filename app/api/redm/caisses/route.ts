/**
 * /api/redm/caisses
 *
 * PRÉREQUIS — exécuter une fois dans Supabase SQL Editor :
 * ─────────────────────────────────────────────────────────
 * CREATE TABLE IF NOT EXISTS public.redm_caisses (
 *   id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   discord_id TEXT NOT NULL,
 *   date       DATE NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   UNIQUE(discord_id, date)
 * );
 * ALTER TABLE public.redm_caisses ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "service role full access" ON public.redm_caisses USING (true) WITH CHECK (true);
 * ─────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-auth';
import { createServiceClient } from '@/lib/supabase/server';
import { caisseRateForRoles } from '@/lib/caisse-rates';
import { redmLog } from '@/lib/redm-log';

export const dynamic = 'force-dynamic';

/* GET ?from=YYYY-MM-DD&to=YYYY-MM-DD — mes propres caisses sur la période */
export async function GET(req: NextRequest) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rate = caisseRateForRoles(session.roles);
  if (rate == null) return NextResponse.json({ error: 'Grade non concerné par le registre des caisses' }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const from = searchParams.get('from');
  const to   = searchParams.get('to');
  if (!from || !to) return NextResponse.json({ error: 'Missing from/to' }, { status: 400 });

  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from('redm_caisses')
    .select('date')
    .eq('discord_id', session.discordId)
    .gte('date', from)
    .lte('date', to);

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ dates: [], rate, missing_table: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ dates: (data ?? []).map((r: { date: string }) => r.date), rate });
}

/* POST — marque la caisse du jour (date réelle du serveur) */
export async function POST() {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rate = caisseRateForRoles(session.roles);
  if (rate == null) return NextResponse.json({ error: 'Grade non concerné par le registre des caisses' }, { status: 403 });

  const today = new Date().toISOString().slice(0, 10);
  const supabase = await createServiceClient();

  const { error } = await supabase
    .from('redm_caisses')
    .upsert({ discord_id: session.discordId, date: today }, { onConflict: 'discord_id,date' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  redmLog({ id: session.discordId, name: session.username }, {
    action: 'caisse_faite',
    category: 'caisses',
    description: `${session.username} a fait sa caisse le ${today}`,
    meta: { date: today, rate },
  });

  return NextResponse.json({ ok: true, date: today });
}
