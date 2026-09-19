/**
 * /api/admin/redm-cueilleurs
 *
 * PRÉREQUIS — exécuter une fois dans Supabase SQL Editor :
 * ─────────────────────────────────────────────────────────
 * CREATE TABLE IF NOT EXISTS public.redm_cueilleurs (
 *   id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   nom_rp     TEXT NOT NULL,
 *   notes      TEXT DEFAULT '',
 *   actif      BOOLEAN DEFAULT true
 * );
 * ALTER TABLE public.redm_cueilleurs ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "service role full access" ON public.redm_cueilleurs USING (true) WITH CHECK (true);
 *
 * CREATE TABLE IF NOT EXISTS public.redm_cueillettes (
 *   id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   cueilleur_id UUID NOT NULL REFERENCES redm_cueilleurs(id) ON DELETE CASCADE,
 *   date         DATE NOT NULL,
 *   plante       TEXT NOT NULL,
 *   quantite     INTEGER NOT NULL DEFAULT 0,
 *   UNIQUE(cueilleur_id, date, plante)
 * );
 * ALTER TABLE public.redm_cueillettes ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "service role full access" ON public.redm_cueillettes USING (true) WITH CHECK (true);
 *
 * CREATE TABLE IF NOT EXISTS public.redm_cueillettes_archives (
 *   id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   archived_at    TIMESTAMPTZ DEFAULT NOW(),
 *   cueilleur_id   UUID NOT NULL REFERENCES redm_cueilleurs(id) ON DELETE CASCADE,
 *   cueilleur_nom  TEXT NOT NULL,
 *   date           DATE NOT NULL,
 *   entrees        JSONB NOT NULL DEFAULT '[]',
 *   total_plantes  INTEGER NOT NULL DEFAULT 0,
 *   total_valeur   NUMERIC(10,2) NOT NULL DEFAULT 0,
 *   montant_saisi  NUMERIC(10,2),
 *   UNIQUE(cueilleur_id, date)
 * );
 * ALTER TABLE public.redm_cueillettes_archives ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "service role full access" ON public.redm_cueillettes_archives USING (true) WITH CHECK (true);
 * ─────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireDirectionActor, requireDirectionRead } from '@/lib/redm-api-auth';
import { createClient }              from '@supabase/supabase-js';
import { redmLog }                   from '@/lib/redm-log';

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(req: NextRequest) {
  const actor = await requireDirectionActor();
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const id = req.nextUrl.searchParams.get('id');
  const supabase = admin();

  if (id) {
    const { data, error } = await supabase
      .from('redm_cueilleurs')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ cueilleur: data });
  }

  const { data, error } = await supabase
    .from('redm_cueilleurs')
    .select('*')
    .order('nom_rp');
  if (error) {
    if (error.code === '42P01') return NextResponse.json({ cueilleurs: [], missing_table: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ cueilleurs: data ?? [] });
}

export async function POST(req: NextRequest) {
  const actor = await requireDirectionActor();
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { nom_rp, notes = '', actif = true } = await req.json();
  if (!nom_rp?.trim()) return NextResponse.json({ error: 'nom_rp requis' }, { status: 400 });

  const supabase = admin();
  const { data, error } = await supabase
    .from('redm_cueilleurs')
    .insert({ nom_rp: nom_rp.trim(), notes, actif })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  redmLog(actor, {
    action: 'cueilleur_create',
    category: 'cueilleurs',
    description: `Nouveau cueilleur créé : ${nom_rp}`,
    meta: { id: data.id, nom_rp },
  });

  return NextResponse.json({ cueilleur: data });
}

export async function PATCH(req: NextRequest) {
  const actor = await requireDirectionActor();
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, nom_rp, notes, actif } = await req.json();
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (nom_rp !== undefined) patch.nom_rp = nom_rp.trim();
  if (notes  !== undefined) patch.notes  = notes;
  if (actif  !== undefined) patch.actif  = actif;

  const supabase = admin();
  const { data, error } = await supabase
    .from('redm_cueilleurs')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  redmLog(actor, {
    action: 'cueilleur_update',
    category: 'cueilleurs',
    description: `Cueilleur modifié : ${data.nom_rp}`,
    meta: { id, ...patch },
  });

  return NextResponse.json({ cueilleur: data });
}

export async function DELETE(req: NextRequest) {
  const actor = await requireDirectionActor();
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const supabase = admin();
  const { data: c } = await supabase.from('redm_cueilleurs').select('nom_rp').eq('id', id).single();
  const { error } = await supabase.from('redm_cueilleurs').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  redmLog(actor, {
    action: 'cueilleur_delete',
    category: 'cueilleurs',
    description: `Cueilleur supprimé : ${c?.nom_rp ?? id}`,
    meta: { id },
  });

  return NextResponse.json({ ok: true });
}
