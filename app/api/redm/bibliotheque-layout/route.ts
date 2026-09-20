import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getApiSession } from '@/lib/api-auth';
import { isAdmin } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const KEY = 'bibliotheque_layout';

/* GET — lecture publique (tout membre connecté) de la disposition personnalisée des étagères */
export async function GET() {
  try {
    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', KEY)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ __error: error.message }, { status: 200 });
    }

    return NextResponse.json(data?.value ?? null);
  } catch (e: any) {
    return NextResponse.json({ __error: e?.message ?? 'Erreur inconnue' }, { status: 200 });
  }
}

/* POST — écriture réservée au rôle "dev" */
export async function POST(req: NextRequest) {
  const session = await getApiSession();
  if (!session || !isAdmin(session.roles)) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const body = await req.json();
  const supabase = await createServiceClient();

  const { error } = await supabase
    .from('site_config')
    .upsert({ key: KEY, value: body }, { onConflict: 'key' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
