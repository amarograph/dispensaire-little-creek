/**
 * /api/admin/redm-entretiens
 *
 * PRÉREQUIS — exécuter dans Supabase SQL Editor :
 * ─────────────────────────────────────────────────────────
 * CREATE TABLE IF NOT EXISTS public.redm_entretiens (
 *   id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   archived          BOOLEAN DEFAULT false,
 *   discord_id        TEXT DEFAULT '',
 *   lieu              TEXT DEFAULT '',
 *   date_entretien    TEXT DEFAULT '',
 *   nom_candidat      TEXT DEFAULT '',
 *   age               TEXT DEFAULT '',
 *   date_naissance    TEXT DEFAULT '',
 *   lieu_naissance    TEXT DEFAULT '',
 *   diplomes          TEXT DEFAULT '',
 *   universite        TEXT DEFAULT '',
 *   specialite        TEXT DEFAULT '',
 *   motivations       TEXT DEFAULT '',
 *   experience        TEXT DEFAULT '',
 *   travaux           TEXT DEFAULT '',
 *   q1_mission        TEXT DEFAULT '',
 *   q2_indigents      TEXT DEFAULT '',
 *   q3_progres        TEXT DEFAULT '',
 *   q4_gardes         BOOLEAN DEFAULT false,
 *   q4_gardes_details TEXT DEFAULT '',
 *   appreciation      TEXT DEFAULT '',
 *   decision          TEXT DEFAULT '',
 *   poste             TEXT DEFAULT '',
 *   date_decision     TEXT DEFAULT '',
 *   signature         TEXT DEFAULT '',
 *   created_at        TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at        TIMESTAMPTZ DEFAULT NOW()
 * );
 * ALTER TABLE public.redm_entretiens ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "service role full access" ON public.redm_entretiens
 *   USING (true) WITH CHECK (true);
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

/* ── GET : liste des entretiens ─────────────────────────────── */
export async function GET(req: NextRequest) {
  if (!await requireDirectionRead()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await db()
    .from('redm_entretiens')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entretiens: data ?? [] });
}

/* ── POST : créer un entretien ──────────────────────────────── */
export async function POST(req: NextRequest) {
  const actor = await requireDirectionActor();
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { id: _id, created_at: _c, updated_at: _u, ...fields } = body;

  const { data, error } = await db()
    .from('redm_entretiens')
    .insert({ ...fields, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  redmLog(actor, { action: 'entretien_create', category: 'entretiens', description: `A créé un entretien d'admission pour ${fields.nom_candidat || 'candidat inconnu'} — décision : ${fields.decision || 'en attente'}`, meta: { nom: fields.nom_candidat, decision: fields.decision } });
  return NextResponse.json({ entretien: data });
}

/* ── PATCH : modifier un entretien ──────────────────────────── */
export async function PATCH(req: NextRequest) {
  const actor = await requireDirectionActor();
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { data, error } = await db()
    .from('redm_entretiens')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const action = fields.archived === true ? 'entretien_archive' : fields.archived === false ? 'entretien_restore' : 'entretien_update';
  const label = fields.archived === true ? 'archivé' : fields.archived === false ? 'restauré' : 'modifié';
  redmLog(actor, { action, category: 'entretiens', description: `A ${label} l'entretien de ${fields.nom_candidat || data?.nom_candidat || id}`, meta: { id, archived: fields.archived } });
  return NextResponse.json({ entretien: data });
}

/* ── DELETE : supprimer un entretien ────────────────────────── */
export async function DELETE(req: NextRequest) {
  const actor = await requireDirectionActor();
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { error } = await db().from('redm_entretiens').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  redmLog(actor, { action: 'entretien_delete', category: 'entretiens', description: `A supprimé l'entretien (id: ${id})`, meta: { id } });
  return NextResponse.json({ ok: true });
}
