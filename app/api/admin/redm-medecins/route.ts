/**
 * /api/admin/redm-medecins
 *
 * PRÉREQUIS — exécuter une fois dans Supabase SQL Editor :
 * ─────────────────────────────────────────────────────────
 * CREATE TABLE IF NOT EXISTS public.redm_medecins_meta (
 *   discord_id              TEXT PRIMARY KEY,
 *   numero_compte           TEXT DEFAULT '',
 *   date_naissance          TEXT DEFAULT '',
 *   parcours_universitaire  TEXT DEFAULT '',
 *   updated_at              TIMESTAMPTZ DEFAULT NOW()
 * );
 * ALTER TABLE public.redm_medecins_meta ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "service role full access" ON public.redm_medecins_meta USING (true) WITH CHECK (true);
 * ─────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireDirectionActor, requireDirectionRead } from '@/lib/redm-api-auth';
import { createClient } from '@supabase/supabase-js';
import { redmLog } from '@/lib/redm-log';

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/* Rôles RedM considérés comme « personnel médical » du dispensaire */
const REDM_MEDICAL_ROLES = [
  'redm_directeur', 'redm_co_directeur', 'redm_medecin_chef', 'redm_medecin',
  'redm_therapeute', 'redm_infirmier', 'redm_apprenti',
] as const;

/* ── GET : liste du personnel médical RedM ──────────────────── */
export async function GET(req: NextRequest) {
  if (!await requireDirectionRead()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = admin();

  const { data: users, error } = await supabase
    .from('members')
    .select('discord_id, username, roles, requested_at')
    .eq('status', 'approved')
    .order('requested_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  /* Filtrer : seulement ceux qui ont au moins un rôle médical RedM */
  const medical = (users ?? []).filter(u => {
    const r: string[] = u.roles ?? [];
    return r.some(x => (REDM_MEDICAL_ROLES as readonly string[]).includes(x));
  });

  /* Profils RP (universe redm) */
  const { data: profiles } = await supabase
    .from('user_rp_profiles')
    .select('discord_id, nom_rp, prenom_rp')
    .eq('universe', 'redm');
  const rp: Record<string, { nom_rp: string; prenom_rp: string }> = {};
  for (const row of profiles ?? []) rp[row.discord_id] = row;

  /* Fiches complémentaires (numéro de compte, date de naissance, parcours) */
  const { data: metaRows } = await supabase.from('redm_medecins_meta').select('*');
  const meta: Record<string, any> = {};
  for (const row of metaRows ?? []) meta[row.discord_id] = row;

  /* Profils étendus (grade, dispensaire, spécialité, statut, portrait) */
  const { data: profilRows } = await supabase.from('redm_profils').select('*');
  const profils: Record<string, any> = {};
  for (const row of profilRows ?? []) profils[row.discord_id] = row;

  /* Grade par défaut selon le rôle Discord (si aucun grade explicite dans redm_profils) */
  const ROLE_DEFAULT_GRADE: Record<string, string> = {
    redm_directeur:    'Directeur',
    redm_co_directeur: 'Co-Directeur',
    redm_medecin_chef: 'Médecin Chef',
    redm_medecin:      'Médecin',
    redm_therapeute:   'Thérapeute',
    redm_infirmier:    'Infirmier',
    redm_apprenti:     'Apprenti',
  };

  const medecins = medical.map(u => {
    const roles: string[] = u.roles ?? [];
    const p = rp[u.discord_id] ?? {};
    const m = meta[u.discord_id] ?? {};
    const pr = profils[u.discord_id] ?? {};
    const topRole = (REDM_MEDICAL_ROLES as readonly string[]).find(r => roles.includes(r)) ?? 'redm_apprenti';
    return {
      discord_id:             u.discord_id,
      username:               u.username,
      avatar:                 null,
      roles,
      rp_prenom:              p.prenom_rp    ?? '',
      rp_nom:                 p.nom_rp       ?? '',
      created_at:             u.requested_at,
      numero_compte:          m.numero_compte          ?? '',
      date_naissance:         m.date_naissance         ?? '',
      parcours_universitaire: m.parcours_universitaire ?? '',
      portrait_url:           pr.portrait_url ?? '',
      age_rp:                 pr.age_rp       ?? '',
      origine:                pr.origine      ?? '',
      grade:                  pr.grade        || ROLE_DEFAULT_GRADE[topRole] || 'Apprenti',
      dispensaire:            pr.dispensaire  ?? 'Saint Denis',
      specialite:             pr.specialite   ?? '',
      statut:                 pr.statut       ?? 'En service',
    };
  });

  return NextResponse.json({ medecins });
}

/* ── PATCH : mise à jour de la fiche médecin ────────────────── */
export async function PATCH(req: NextRequest) {
  const actor = await requireDirectionActor();
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { discord_id, rp_prenom, rp_nom,
          numero_compte, date_naissance, parcours_universitaire,
          grade, dispensaire, specialite, statut, portrait_url, age_rp, origine } = body;
  if (!discord_id) return NextResponse.json({ error: 'Missing discord_id' }, { status: 400 });

  const db = admin();
  const ops: PromiseLike<any>[] = [];

  /* Nom / Prénom RP → user_rp_profiles */
  if (rp_prenom !== undefined || rp_nom !== undefined) {
    ops.push(
      db.from('user_rp_profiles').upsert(
        { discord_id, universe: 'redm',
          prenom_rp: rp_prenom ?? '', nom_rp: rp_nom ?? '' },
        { onConflict: 'discord_id,universe' },
      ).then((r: any) => r),
    );
  }

  /* Fiche administrative */
  ops.push(
    db.from('redm_medecins_meta').upsert(
      { discord_id, numero_compte, date_naissance, parcours_universitaire,
        updated_at: new Date().toISOString() },
      { onConflict: 'discord_id' },
    ).then((r: any) => r),
  );

  /* Fonction médicale + identité RP étendue */
  const profilFields: Record<string, any> = { discord_id, updated_at: new Date().toISOString() };
  if (grade        !== undefined) profilFields.grade        = grade;
  if (dispensaire  !== undefined) profilFields.dispensaire  = dispensaire;
  if (specialite   !== undefined) profilFields.specialite   = specialite;
  if (statut       !== undefined) profilFields.statut       = statut;
  if (portrait_url !== undefined) profilFields.portrait_url = portrait_url;
  if (age_rp       !== undefined) profilFields.age_rp       = age_rp;
  if (origine      !== undefined) profilFields.origine      = origine;

  if (Object.keys(profilFields).length > 2) {
    ops.push(
      db.from('redm_profils').upsert(profilFields, { onConflict: 'discord_id' }).then((r: any) => r),
    );
  }

  const results = await Promise.all(ops);
  const failed  = results.find(r => r?.error);
  if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 500 });

  const nomComplet = [rp_prenom, rp_nom].filter(Boolean).join(' ') || discord_id;
  redmLog(actor, { action: 'medecin_update', category: 'medecins', description: `A mis à jour la fiche de ${nomComplet}`, meta: { discord_id, grade, statut } });
  return NextResponse.json({ ok: true });
}
