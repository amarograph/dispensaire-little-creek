import { NextResponse } from 'next/server';
import { requireDirectionRead } from '@/lib/redm-api-auth';
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
