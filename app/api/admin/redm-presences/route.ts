/**
 * /api/admin/redm-presences
 *
 * PRÉREQUIS — exécuter une fois dans Supabase SQL Editor :
 * ─────────────────────────────────────────────────────────
 * CREATE TABLE IF NOT EXISTS public.redm_presences (
 *   id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   discord_id TEXT NOT NULL,
 *   date       DATE NOT NULL,
 *   UNIQUE(discord_id, date),
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * ALTER TABLE public.redm_presences ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "service role full access" ON public.redm_presences USING (true) WITH CHECK (true);
 * ─────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireDirectionActor, requireDirectionRead } from '@/lib/redm-api-auth';
import { createClient }              from '@supabase/supabase-js';
import { redmLog }                   from '@/lib/redm-log';

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/* ── GET ?from=YYYY-MM-DD&to=YYYY-MM-DD ─────────────────────────── */
export async function GET(req: NextRequest) {
  if (!await requireDirectionActor()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const from = searchParams.get('from');
  const to   = searchParams.get('to');
  if (!from || !to) return NextResponse.json({ error: 'Missing from/to' }, { status: 400 });

  const { data, error } = await db()
    .from('redm_presences')
    .select('discord_id, date')
    .gte('date', from)
    .lte('date', to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ presences: data ?? [] });
}

/* ── POST { discord_id, date } — toggle présence ────────────────── */
export async function POST(req: NextRequest) {
  const actor = await requireDirectionActor();
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { discord_id, date } = await req.json();
  if (!discord_id || !date) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const supabase = db();

  /* Vérifie si la présence existe déjà */
  const { data: existing } = await supabase
    .from('redm_presences')
    .select('id')
    .eq('discord_id', discord_id)
    .eq('date', date)
    .single();

  if (existing) {
    /* Présent → absent : supprimer */
    const { error } = await supabase
      .from('redm_presences')
      .delete()
      .eq('discord_id', discord_id)
      .eq('date', date);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    redmLog(actor, { action: 'presence_remove', category: 'presences', description: `A retiré la présence de ${discord_id} pour le ${date}`, meta: { discord_id, date } });
    return NextResponse.json({ present: false });
  } else {
    /* Absent → présent : insérer */
    const { error } = await supabase
      .from('redm_presences')
      .insert({ discord_id, date });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    redmLog(actor, { action: 'presence_add', category: 'presences', description: `A coché la présence de ${discord_id} pour le ${date}`, meta: { discord_id, date } });
    return NextResponse.json({ present: true });
  }
}
