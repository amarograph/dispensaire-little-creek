/*
  ── Migration SQL à exécuter UNE FOIS dans le dashboard Supabase ──────────────

  CREATE TABLE IF NOT EXISTS public.redm_absences (
    id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    discord_id TEXT    NOT NULL,
    nom_rp     TEXT    NOT NULL DEFAULT '',
    date_debut TEXT    NOT NULL DEFAULT '',
    date_fin   TEXT    NOT NULL DEFAULT '',
    motif      TEXT    NOT NULL DEFAULT '',
    note       TEXT    NOT NULL DEFAULT '',
    statut     TEXT    NOT NULL DEFAULT 'En attente',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ALTER TABLE public.redm_absences ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "service_role" ON public.redm_absences FOR ALL TO service_role USING (true);

  ─────────────────────────────────────────────────────────────────────────────
*/

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getApiSession } from '@/lib/api-auth';
import { isDirection } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/* ── GET — liste des absences ───────────────────────────────────────────── */
export async function GET() {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createServiceClient();
  let q = supabase.from('redm_absences').select('*').order('created_at', { ascending: false });
  if (!isDirection(session.roles)) q = q.eq('discord_id', session.discordId);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ absences: data ?? [] });
}

/* ── POST — soumettre une demande d'absence ─────────────────────────────── */
export async function POST(req: NextRequest) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const supabase = await createServiceClient();

  const { data, error } = await supabase.from('redm_absences').insert({
    discord_id: session.discordId,
    nom_rp:     body.nom_rp     ?? '',
    date_debut: body.date_debut ?? '',
    date_fin:   body.date_fin   ?? '',
    motif:      body.motif      ?? '',
    note:       body.note       ?? '',
    statut:     'Absence',
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ absence: data });
}

/* ── PATCH — statut (direction) ou annuler/modifier (employé) ───────────── */
export async function PATCH(req: NextRequest) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const supabase = await createServiceClient();

  // Direction : changement de statut (body.statut présent)
  if (isDirection(session.roles) && body.statut !== undefined) {
    const { statut } = body;
    if (!['Absence', 'Vue et lu', 'Annulée'].includes(statut))
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });

    const { data, error } = await supabase
      .from('redm_absences').update({ statut }).eq('id', id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ absence: data });
  }

  // Employé (ou direction sur sa propre absence) : annuler ou modifier le contenu
  const { data: existing } = await supabase
    .from('redm_absences').select('*').eq('id', id).eq('discord_id', session.discordId).single();
  if (!existing) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });
  if (existing.statut === 'Annulée')
    return NextResponse.json({ error: 'Déjà annulée' }, { status: 400 });

  if (body.statut === 'Annulée') {
    const { data, error } = await supabase
      .from('redm_absences').update({ statut: 'Annulée' }).eq('id', id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ absence: data });
  }

  // Modification de contenu → repart en "Absence"
  const updates: Record<string, any> = { statut: 'Absence' };
  if (body.date_debut !== undefined) updates.date_debut = body.date_debut;
  if (body.date_fin   !== undefined) updates.date_fin   = body.date_fin;
  if (body.motif      !== undefined) updates.motif      = body.motif;
  if (body.note       !== undefined) updates.note       = body.note;

  const { data, error } = await supabase
    .from('redm_absences').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ absence: data });
}

/* ── DELETE — supprimer une absence (direction) ─────────────────────────── */
export async function DELETE(req: NextRequest) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!isDirection(session.roles)) return NextResponse.json({ error: 'Réservé à la Direction' }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const supabase = await createServiceClient();
  const { error } = await supabase.from('redm_absences').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
