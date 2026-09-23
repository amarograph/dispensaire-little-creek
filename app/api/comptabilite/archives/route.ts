import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-auth';
import { canRead, isAdmin } from '@/lib/permissions';
import { createServiceClient } from '@/lib/supabase/server';

const KEY = 'redm_comptabilite_archives';

async function canAccess(): Promise<boolean> {
  const session = await getApiSession();
  if (!session) return false;
  return isAdmin(session.roles) || canRead(session.roles, 'redm_comptabilite');
}

/* GET — semaines archivées du registre partagé */
export async function GET() {
  if (!await canAccess()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createServiceClient();
  const { data } = await supabase.from('site_config').select('value').eq('key', KEY).single();
  return NextResponse.json(Array.isArray(data?.value) ? data.value : []);
}

/* POST — remplace les archives partagées (même sémantique que l'ancien localStorage) */
export async function POST(req: NextRequest) {
  if (!await canAccess()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const data = await req.json();
    if (!Array.isArray(data)) return NextResponse.json({ error: 'Format invalide' }, { status: 400 });
    const supabase = await createServiceClient();
    const { error } = await supabase.from('site_config').upsert({ key: KEY, value: data }, { onConflict: 'key' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
