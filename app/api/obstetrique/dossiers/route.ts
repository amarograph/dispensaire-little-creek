import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireObstetriqueActor } from '@/lib/redm-api-auth';

const KEY = 'redm_obstetrique_dossiers';

interface Dossier {
  id: string; ownerId: string;
  patientNom: string; patientPrenom: string; patientAge: string; patientMetier: string;
  dateConsult: string; type: string; plainte: string;
  antecedentsObstetricaux: string; antecedentsFamiliaux: string; evenementsRecents: string;
  risqueGrossesse: string; noteObstetricien: string;
  traitement: string; prochaine: string;
  statut: string; confidentiel: boolean; createdAt: string; updatedAt?: string;
}

async function loadAll(): Promise<Dossier[]> {
  const supabase = await createServiceClient();
  const { data } = await supabase.from('site_config').select('value').eq('key', KEY).single();
  return Array.isArray(data?.value) ? data.value : [];
}

async function saveAll(dossiers: Dossier[]) {
  const supabase = await createServiceClient();
  await supabase.from('site_config').upsert({ key: KEY, value: dossiers }, { onConflict: 'key' });
}

function uid() { return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`; }

// ── GET : liste tous les dossiers (owner uniquement, sauf direction/dev) ──────
export async function GET(req: NextRequest) {
  const ctx = await requireObstetriqueActor();
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const id = searchParams.get('id');
  const all = await loadAll();

  if (id) {
    const dossier = all.find(d => d.id === id);
    if (!dossier) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
    return NextResponse.json({ dossier });
  }

  const dossiers = ctx.isAdmin ? all : all.filter(d => d.ownerId === ctx.discordId);
  return NextResponse.json({ dossiers });
}

// ── POST : créer un dossier ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ctx = await requireObstetriqueActor();
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const all = await loadAll();

  const dossier: Dossier = {
    id: uid(), ownerId: ctx.discordId,
    patientNom:              body.patientNom              ?? '',
    patientPrenom:           body.patientPrenom           ?? '',
    patientAge:              body.patientAge              ?? '',
    patientMetier:           body.patientMetier           ?? '',
    dateConsult:             body.dateConsult              ?? '',
    type:                    body.type                     ?? 'Première consultation',
    plainte:                 body.plainte                  ?? '',
    antecedentsObstetricaux: body.antecedentsObstetricaux ?? '',
    antecedentsFamiliaux:    body.antecedentsFamiliaux    ?? '',
    evenementsRecents:       body.evenementsRecents       ?? '',
    risqueGrossesse:         body.risqueGrossesse         ?? '',
    noteObstetricien:        body.noteObstetricien        ?? '',
    traitement:              body.traitement               ?? '',
    prochaine:               body.prochaine                ?? '',
    statut:                  body.statut                   ?? 'EN COURS',
    confidentiel:            body.confidentiel            ?? false,
    createdAt: new Date().toISOString(),
  };
  all.unshift(dossier);
  await saveAll(all);
  return NextResponse.json({ dossier });
}

// ── PATCH : modifier un dossier ───────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const ctx = await requireObstetriqueActor();
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const all = await loadAll();
  const idx = all.findIndex(d => d.id === id && (ctx.isAdmin || d.ownerId === ctx.discordId));
  if (idx === -1) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  all[idx] = { ...all[idx], ...fields, updatedAt: new Date().toISOString() };
  await saveAll(all);
  return NextResponse.json({ ok: true });
}

// ── DELETE : supprimer un dossier ─────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const ctx = await requireObstetriqueActor();
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const all = await loadAll();
  const next = all.filter(d => !(d.id === id && (ctx.isAdmin || d.ownerId === ctx.discordId)));
  if (next.length === all.length) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  await saveAll(next);
  return NextResponse.json({ ok: true });
}
