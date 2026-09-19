import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireCabinetActor } from '@/lib/redm-api-auth';

// ── GET : liste tous les dossiers (du thérapeute connecté) ────────────────────
export async function GET(req: NextRequest) {
  const ctx = await requireCabinetActor();
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const id = searchParams.get('id');
  const supabase = await createServiceClient();

  if (id) {
    const { data, error } = await supabase
      .from('cabinet_dossiers')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ dossier: data });
  }

  let query = supabase
    .from('cabinet_dossiers')
    .select('*')
    .order('created_at', { ascending: false });

  if (!ctx.isAdmin) {
    query = query.eq('owner_id', ctx.discordId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ dossiers: data ?? [] });
}

// ── POST : créer un dossier ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ctx = await requireCabinetActor();
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from('cabinet_dossiers')
    .insert({
      owner_id:               ctx.discordId,
      patient_nom:            body.patientNom            ?? '',
      patient_prenom:         body.patientPrenom         ?? '',
      patient_age:            body.patientAge            ?? '',
      patient_metier:         body.patientMetier         ?? '',
      date_consult:           body.dateConsult           ?? '',
      type_seance:            body.type                  ?? 'Première consultation',
      plainte:                body.plainte               ?? '',
      antecedents_personnels: body.antecedentsPersonnels ?? '',
      antecedents_familiaux:  body.antecedentsFamiliaux  ?? '',
      evenements_recents:     body.evenementsRecents     ?? '',
      observations:           body.observations          ?? '',
      observation_medecin:    body.observationMedecin    ?? '',
      equilibre_nerveux:      body.equilibreNerveux      ?? '',
      note_therapeute:        body.noteThérapeute        ?? '',
      traitement:             body.traitement            ?? '',
      prochaine:              body.prochaine             ?? '',
      statut:                 body.statut                ?? 'EN COURS',
      confidentiel:           body.confidentiel          ?? false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ dossier: data });
}

// ── PATCH : modifier un dossier ───────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const ctx = await requireCabinetActor();
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const supabase = await createServiceClient();

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (fields.patientNom            !== undefined) update.patient_nom            = fields.patientNom;
  if (fields.patientPrenom         !== undefined) update.patient_prenom         = fields.patientPrenom;
  if (fields.patientAge            !== undefined) update.patient_age            = fields.patientAge;
  if (fields.patientMetier         !== undefined) update.patient_metier         = fields.patientMetier;
  if (fields.dateConsult           !== undefined) update.date_consult           = fields.dateConsult;
  if (fields.type                  !== undefined) update.type_seance            = fields.type;
  if (fields.plainte               !== undefined) update.plainte                = fields.plainte;
  if (fields.antecedentsPersonnels !== undefined) update.antecedents_personnels = fields.antecedentsPersonnels;
  if (fields.antecedentsFamiliaux  !== undefined) update.antecedents_familiaux  = fields.antecedentsFamiliaux;
  if (fields.evenementsRecents     !== undefined) update.evenements_recents     = fields.evenementsRecents;
  if (fields.observations          !== undefined) update.observations           = fields.observations;
  if (fields.observationMedecin    !== undefined) update.observation_medecin    = fields.observationMedecin;
  if (fields.equilibreNerveux      !== undefined) update.equilibre_nerveux      = fields.equilibreNerveux;
  if (fields.noteThérapeute        !== undefined) update.note_therapeute        = fields.noteThérapeute;
  if (fields.traitement             !== undefined) update.traitement             = fields.traitement;
  if (fields.prochaine              !== undefined) update.prochaine              = fields.prochaine;
  if (fields.statut                 !== undefined) update.statut                 = fields.statut;
  if (fields.confidentiel           !== undefined) update.confidentiel           = fields.confidentiel;

  let query = supabase.from('cabinet_dossiers').update(update).eq('id', id);
  if (!ctx.isAdmin) query = query.eq('owner_id', ctx.discordId);

  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// ── DELETE : supprimer un dossier ─────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const ctx = await requireCabinetActor();
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const supabase = await createServiceClient();
  let query = supabase.from('cabinet_dossiers').delete().eq('id', id);
  if (!ctx.isAdmin) query = query.eq('owner_id', ctx.discordId);

  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
