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
import { requireRedmStaff } from '@/lib/redm-api-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const ctx = await requireRedmStaff();
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
  const ctx = await requireRedmStaff();
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const supabase = await createServiceClient();

  await supabase.from('user_rp_profiles').upsert(
    { discord_id: ctx.discordId, universe: 'redm',
      nom_rp: body.nom_rp ?? '', prenom_rp: body.prenom_rp ?? '' },
    { onConflict: 'discord_id,universe' },
  );

  const { error } = await supabase.from('redm_profils').upsert(
    {
      discord_id:   ctx.discordId,
      age_rp:       body.age_rp       ?? '',
      origine:      body.origine       ?? '',
      portrait_url: body.portrait_url  ?? '',
      grade:        body.grade         ?? 'Apprenti',
      dispensaire:  body.dispensaire   ?? 'Little Creek',
      specialite:   body.specialite    ?? '',
      statut:       body.statut        ?? 'En service',
      updated_at:   new Date().toISOString(),
    },
    { onConflict: 'discord_id' },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { error: metaError } = await supabase.from('redm_medecins_meta').upsert(
    { discord_id: ctx.discordId, numero_compte: body.numero_compte ?? '', updated_at: new Date().toISOString() },
    { onConflict: 'discord_id' },
  );
  if (metaError) return NextResponse.json({ error: metaError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
