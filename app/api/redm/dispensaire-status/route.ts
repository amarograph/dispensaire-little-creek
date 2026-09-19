import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getApiSession } from '@/lib/api-auth';
import { isDirection } from '@/lib/permissions';
import { DEFAULT_DISPENSAIRE_STATUS, type SanitaireEntry } from '@/app/redm/_lib/sanitaireListes';

export const dynamic = 'force-dynamic';

function toEntry(raw: any): SanitaireEntry {
  const nom = typeof raw?.nom === 'string' ? raw.nom.trim().slice(0, 120) : '';
  return { nom, critique: nom ? !!raw?.critique : false };
}

/* ── GET : statut sanitaire (tout utilisateur connecté) ── */
export async function GET() {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const supabase = await createServiceClient();
  const { data } = await supabase
    .from('site_config')
    .select('value')
    .eq('key', 'redm_dispensaire_status')
    .single();

  const value = data?.value ?? {};
  return NextResponse.json({
    epidemie: toEntry(value.epidemie ?? DEFAULT_DISPENSAIRE_STATUS.epidemie),
    risque:   toEntry(value.risque   ?? DEFAULT_DISPENSAIRE_STATUS.risque),
  });
}

/* ── POST : déclarer/lever une épidémie ou un risque sanitaire (direction) ── */
export async function POST(req: NextRequest) {
  const session = await getApiSession();
  if (!session || !isDirection(session.roles)) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const body = await req.json();
  const value = {
    epidemie: toEntry(body.epidemie),
    risque:   toEntry(body.risque),
  };

  const supabase = await createServiceClient();
  const { error } = await supabase
    .from('site_config')
    .upsert({ key: 'redm_dispensaire_status', value }, { onConflict: 'key' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(value);
}
