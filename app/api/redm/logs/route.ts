/**
 * /api/redm/logs
 *
 * PRÉREQUIS — exécuter une fois dans Supabase SQL Editor :
 * ─────────────────────────────────────────────────────────
 * CREATE TABLE IF NOT EXISTS public.redm_logs (
 *   id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   created_at       TIMESTAMPTZ DEFAULT NOW(),
 *   actor_discord_id TEXT NOT NULL,
 *   actor_name       TEXT NOT NULL,
 *   action           TEXT NOT NULL,
 *   category         TEXT NOT NULL,
 *   description      TEXT NOT NULL,
 *   meta             JSONB DEFAULT '{}'::JSONB
 * );
 * CREATE INDEX IF NOT EXISTS redm_logs_created_at_idx ON public.redm_logs (created_at DESC);
 * CREATE INDEX IF NOT EXISTS redm_logs_category_idx   ON public.redm_logs (category);
 * ALTER TABLE public.redm_logs ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "service role full access" ON public.redm_logs USING (true) WITH CHECK (true);
 * ─────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireDirectionRead } from '@/lib/redm-api-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!await requireDirectionRead()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const category = req.nextUrl.searchParams.get('category') ?? '';
  const supabase = await createServiceClient();

  let query = supabase
    .from('redm_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300);

  if (category) query = query.eq('category', category);

  const { data: logs, error } = await query;
  if (error) {
    if (error.code === '42P01') return NextResponse.json({ logs: [], missing_table: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const enriched = (logs ?? []).map(l => ({ ...l, actor_avatar: null }));

  return NextResponse.json({ logs: enriched });
}
