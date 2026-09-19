import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireCabinetActor } from '@/lib/redm-api-auth';

const KEY = 'redm_cabinet_agenda';

export async function GET() {
  const ctx = await requireCabinetActor();
  if (!ctx) return NextResponse.json([], { status: 200 });

  try {
    const supabase = await createServiceClient();
    const { data } = await supabase.from('site_config').select('value').eq('key', KEY).single();
    return NextResponse.json(data?.value ?? []);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const ctx = await requireCabinetActor();
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const data = await req.json();
    const supabase = await createServiceClient();
    const { error } = await supabase.from('site_config').upsert({ key: KEY, value: data }, { onConflict: 'key' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
