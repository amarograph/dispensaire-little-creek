import { NextRequest, NextResponse } from 'next/server';
import { requireDirectionActor, requireDirectionRead } from '@/lib/redm-api-auth';
import { createClient } from '@supabase/supabase-js';
import { redmLog } from '@/lib/redm-log';

export const dynamic = 'force-dynamic';

const KEY = 'redm_compta_ajustements';

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

interface Ajustement {
  id: string; montant: number; motif: string;
  auteur: string; date: string; createdAt: string;
}

/* GET — historique des ajustements manuels (direction, co-direction, médecin en chef) */
export async function GET() {
  if (!await requireDirectionRead()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data } = await db().from('site_config').select('value').eq('key', KEY).single();
  return NextResponse.json({ ajustements: Array.isArray(data?.value) ? data.value : [] });
}

/* POST { montant, motif } — ajoute un ajustement (direction / co-direction uniquement) */
export async function POST(req: NextRequest) {
  const actor = await requireDirectionActor();
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const montant = Number(body?.montant);
  const motif   = String(body?.motif ?? '').trim();
  if (!Number.isFinite(montant) || montant === 0) return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
  if (!motif) return NextResponse.json({ error: 'Motif requis' }, { status: 400 });

  const supabase = db();
  const { data } = await supabase.from('site_config').select('value').eq('key', KEY).single();
  const ajustements: Ajustement[] = Array.isArray(data?.value) ? data.value : [];

  const entry: Ajustement = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    montant, motif, auteur: actor.name,
    date: new Date().toLocaleDateString('fr-FR'),
    createdAt: new Date().toISOString(),
  };
  const next = [entry, ...ajustements];

  const { error } = await supabase.from('site_config').upsert({ key: KEY, value: next }, { onConflict: 'key' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  redmLog(actor, {
    action: 'compta_ajustement', category: 'comptabilite',
    description: `A ${montant >= 0 ? 'ajouté' : 'retiré'} ${Math.abs(montant).toFixed(2)}$ ${montant >= 0 ? 'au' : 'du'} compte du dispensaire (${motif})`,
    meta: { montant, motif },
  });

  return NextResponse.json({ ok: true, ajustement: entry });
}

/* DELETE ?id=... — annule un ajustement (direction / co-direction uniquement) */
export async function DELETE(req: NextRequest) {
  const actor = await requireDirectionActor();
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id manquant' }, { status: 400 });

  const supabase = db();
  const { data } = await supabase.from('site_config').select('value').eq('key', KEY).single();
  const ajustements: Ajustement[] = Array.isArray(data?.value) ? data.value : [];
  const removed = ajustements.find(a => a.id === id);
  const next = ajustements.filter(a => a.id !== id);

  const { error } = await supabase.from('site_config').upsert({ key: KEY, value: next }, { onConflict: 'key' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (removed) {
    redmLog(actor, {
      action: 'compta_ajustement_suppr', category: 'comptabilite',
      description: `A annulé un ajustement de ${removed.montant.toFixed(2)}$ (${removed.motif})`,
      meta: { id },
    });
  }

  return NextResponse.json({ ok: true });
}
