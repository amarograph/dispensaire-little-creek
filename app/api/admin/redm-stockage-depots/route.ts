import { NextRequest, NextResponse } from 'next/server';
import { requireDirectionRead, requireDirectionActor } from '@/lib/redm-api-auth';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const KEY = 'redm_stockage_depots';

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/* GET — historique des dépôts de stock déclarés par le personnel (direction, co-direction, médecin en chef) */
export async function GET() {
  if (!await requireDirectionRead()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data } = await db().from('site_config').select('value').eq('key', KEY).single();
  return NextResponse.json({ depots: Array.isArray(data?.value) ? data.value : [] });
}

/* DELETE { id } — supprime une entrée du journal des dépôts (direction / co-direction / dev uniquement) */
export async function DELETE(req: NextRequest) {
  if (!await requireDirectionActor()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const supabase = db();
  const { data } = await supabase.from('site_config').select('value').eq('key', KEY).single();
  const depots: Array<{ id: string }> = Array.isArray(data?.value) ? data.value : [];
  const next = depots.filter(d => d.id !== id);

  const { error } = await supabase.from('site_config').upsert({ key: KEY, value: next }, { onConflict: 'key' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
