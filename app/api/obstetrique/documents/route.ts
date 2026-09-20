import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireObstetriqueActor } from '@/lib/redm-api-auth';

const KEY = 'redm_obstetrique_documents';

interface DocumentRow {
  id: string; patientId: string; type: string;
  titre: string; contenu: string; date: string; createdAt: string;
}

async function loadAll(): Promise<DocumentRow[]> {
  const supabase = await createServiceClient();
  const { data } = await supabase.from('site_config').select('value').eq('key', KEY).single();
  return Array.isArray(data?.value) ? data.value : [];
}

async function saveAll(docs: DocumentRow[]) {
  const supabase = await createServiceClient();
  await supabase.from('site_config').upsert({ key: KEY, value: docs }, { onConflict: 'key' });
}

function uid() { return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`; }

// ── GET : documents (d'une patiente ou tous) ──────────────────────────────────
export async function GET(req: NextRequest) {
  const ctx = await requireObstetriqueActor();
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const patientId = req.nextUrl.searchParams.get('patient_id');
  const all = await loadAll();
  const documents = patientId ? all.filter(d => d.patientId === patientId) : all;
  return NextResponse.json({ documents });
}

// ── POST : créer un document ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ctx = await requireObstetriqueActor();
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const patientId = body.patient_id ?? body.patientId;
  const titre = body.titre;
  if (!patientId || !titre) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const doc: DocumentRow = {
    id: body.id || uid(),
    patientId,
    type:      body.type    ?? 'Suivi de grossesse',
    titre:     titre         ?? '',
    contenu:   body.contenu  ?? '',
    date:      body.date     ?? '',
    createdAt: body.created_at ?? new Date().toISOString(),
  };

  const all = await loadAll();
  all.unshift(doc);
  await saveAll(all);
  return NextResponse.json({ document: doc });
}

// ── PATCH : modifier un document ───────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const ctx = await requireObstetriqueActor();
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const all = await loadAll();
  const idx = all.findIndex(d => d.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  const { type, titre, contenu, date, patient_id, patientId } = body;
  if (type !== undefined) all[idx].type = type;
  if (titre !== undefined) all[idx].titre = titre;
  if (contenu !== undefined) all[idx].contenu = contenu;
  if (date !== undefined) all[idx].date = date;
  if ((patient_id ?? patientId) !== undefined) all[idx].patientId = patient_id ?? patientId;

  await saveAll(all);
  return NextResponse.json({ ok: true });
}

// ── DELETE : supprimer un document ─────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const ctx = await requireObstetriqueActor();
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const all = await loadAll();
  const next = all.filter(d => d.id !== id);
  if (next.length === all.length) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  await saveAll(next);
  return NextResponse.json({ ok: true });
}
