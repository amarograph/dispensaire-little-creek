import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireCabinetActor } from '@/lib/redm-api-auth';

// ── GET : documents (d'un patient ou tous) ────────────────────────────────────
export async function GET(req: NextRequest) {
  const ctx = await requireCabinetActor();
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const patient_id = req.nextUrl.searchParams.get('patient_id');
  const supabase = await createServiceClient();

  let query = supabase
    .from('cabinet_documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (patient_id) {
    query = query.eq('patient_id', patient_id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ documents: data ?? [] });
}

// ── POST : créer un document ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ctx = await requireCabinetActor();
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { id, patient_id, type, titre, contenu, date, created_at } = body;

  if (!patient_id || !titre) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const row: Record<string, unknown> = {
    patient_id,
    type:    type    ?? 'Synthèse de consultation',
    titre:   titre   ?? '',
    contenu: contenu ?? '',
    date:    date    ?? '',
  };
  if (id)         row.id         = id;
  if (created_at) row.created_at = created_at;

  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from('cabinet_documents')
    .insert(row)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ document: data });
}

// ── PATCH : modifier un document ──────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const ctx = await requireCabinetActor();
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { id, type, titre, contenu, date, patient_id } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (type       !== undefined) update.type       = type;
  if (titre      !== undefined) update.titre      = titre;
  if (contenu    !== undefined) update.contenu    = contenu;
  if (date       !== undefined) update.date       = date;
  if (patient_id !== undefined) update.patient_id = patient_id;

  const supabase = await createServiceClient();
  const { error } = await supabase
    .from('cabinet_documents')
    .update(update)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// ── DELETE : supprimer un document ────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const ctx = await requireCabinetActor();
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const supabase = await createServiceClient();
  const { error } = await supabase
    .from('cabinet_documents')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
