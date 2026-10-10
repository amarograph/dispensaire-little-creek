/*
  ── Migration SQL à exécuter UNE FOIS dans le dashboard Supabase ──────────────

  CREATE TABLE IF NOT EXISTS public.redm_profils (
    discord_id   TEXT PRIMARY KEY,
    age_rp       TEXT NOT NULL DEFAULT '',
    origine      TEXT NOT NULL DEFAULT '',
    portrait_url TEXT NOT NULL DEFAULT '',
    grade        TEXT NOT NULL DEFAULT 'Apprenti',
    dispensaire  TEXT NOT NULL DEFAULT 'Little Creek',
    specialite   TEXT NOT NULL DEFAULT '',
    statut       TEXT NOT NULL DEFAULT 'En service',
    updated_at   TIMESTAMPTZ DEFAULT NOW()
  );
  ALTER TABLE public.redm_profils ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "service_role" ON public.redm_profils FOR ALL TO service_role USING (true);

  ─────────────────────────────────────────────────────────────────────────────
*/

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireRedmProfileUser } from '@/lib/redm-api-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const ctx = await requireRedmProfileUser();
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createServiceClient();

  const [{ data: rpBase }, { data: profil }, { data: meta }] = await Promise.all([
    supabase.from('user_rp_profiles').select('nom_rp, prenom_rp')
      .eq('discord_id', ctx.discordId).eq('universe', 'redm').single(),
    supabase.from('redm_profils').select('*').eq('discord_id', ctx.discordId).single(),
    supabase.from('redm_medecins_meta').select('numero_compte').eq('discord_id', ctx.discordId).single(),
  ]);

  const since7  = new Date(Date.now() -  7 * 86400000).toISOString();
  const since28 = new Date(Date.now() - 28 * 86400000).toISOString();

  const [{ data: certs7 }, { data: certs28 }] = await Promise.all([
    supabase.from('certificats').select('created_at')
      .eq('owner_id', ctx.discordId).gte('created_at', since7).order('created_at', { ascending: false }),
    supabase.from('certificats').select('created_at')
      .eq('owner_id', ctx.discordId).gte('created_at', since28),
  ]);

  const days7  = new Set((certs7  ?? []).map((c: any) => (c.created_at as string).slice(0, 10)));
  const days28 = new Set((certs28 ?? []).map((c: any) => (c.created_at as string).slice(0, 10)));

  return NextResponse.json({
    nom_rp:       rpBase?.nom_rp       ?? '',
    prenom_rp:    rpBase?.prenom_rp    ?? '',
    numero_compte: meta?.numero_compte ?? '',
    age_rp:       profil?.age_rp       ?? '',
    origine:      profil?.origine      ?? '',
    portrait_url: profil?.portrait_url ?? '',
    grade:        profil?.grade        ?? 'Apprenti',
    dispensaire:  profil?.dispensaire  ?? 'Little Creek',
    specialite:   profil?.specialite   ?? '',
    statut:       profil?.statut       ?? 'En service',
    presence: {
      jours_semaine:  days7.size,
      derniere_prise: (certs7 ?? [])[0]?.created_at ?? null,
      moyenne:        days28.size > 0 ? (days28.size / 4).toFixed(1) : '0',
    },
  });
}

export async function POST(req: NextRequest) {
  const ctx = await requireRedmProfileUser();
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  /* Préparateur de caisse : seulement nom/prénom RP, photo et numéro de compte.
     Grade, dispensaire, spécialités et statut ne sont modifiables que par la direction. */
  const prepOnly    = ctx.roles.length > 0 && ctx.roles.every(r => r === 'redm_preparateur_caisse');
  const isDirection = ctx.isAdmin || ctx.roles.some(r => ['redm_directeur', 'redm_co_directeur'].includes(r));

  const body = await req.json();
  const supabase = await createServiceClient();

  await supabase.from('user_rp_profiles').upsert(
    { discord_id: ctx.discordId, universe: 'redm',
      nom_rp: body.nom_rp ?? '', prenom_rp: body.prenom_rp ?? '' },
    { onConflict: 'discord_id,universe' },
  );

  /* Seuls les champs autorisés ET fournis sont écrits : on n'écrase plus le grade / statut par des valeurs par défaut. */
  const fields: Record<string, any> = { discord_id: ctx.discordId, portrait_url: body.portrait_url ?? '', updated_at: new Date().toISOString() };
  if (!prepOnly) {
    if (body.age_rp !== undefined)  fields.age_rp  = body.age_rp  ?? '';
    if (body.origine !== undefined) fields.origine = body.origine ?? '';
  }
  if (isDirection) {
    if (body.grade !== undefined)       fields.grade       = body.grade;
    if (body.dispensaire !== undefined) fields.dispensaire = body.dispensaire;
    if (body.specialite !== undefined)  fields.specialite  = body.specialite;
    if (body.statut !== undefined)      fields.statut      = body.statut;
  }
  const { error } = await supabase.from('redm_profils').upsert(fields, { onConflict: 'discord_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { error: metaError } = await supabase.from('redm_medecins_meta').upsert(
    { discord_id: ctx.discordId, numero_compte: body.numero_compte ?? '', updated_at: new Date().toISOString() },
    { onConflict: 'discord_id' },
  );
  if (metaError) return NextResponse.json({ error: metaError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
