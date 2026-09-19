import { NextRequest, NextResponse } from 'next/server';
import { requireDirectionActor, requireDirectionRead } from '@/lib/redm-api-auth';
import { createClient }              from '@supabase/supabase-js';
import { redmLog }                   from '@/lib/redm-log';

export const dynamic = 'force-dynamic';

const CONFIG_KEY = 'redm_salaires_grades';

const GRADES_DEFAULT: Record<string, number> = {
  'Directeur':    0,
  'Co-Directeur': 0,
  'Médecin Chef': 0,
  'Médecin':      0,
  'Apprenti':     0,
  'Infirmier':    0,
};

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(req: NextRequest) {
  if (!await requireDirectionRead()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data } = await db()
    .from('site_config')
    .select('value')
    .eq('key', CONFIG_KEY)
    .single();

  const salaires: Record<string, number> = { ...GRADES_DEFAULT, ...(data?.value ?? {}) };
  return NextResponse.json({ salaires });
}

export async function PATCH(req: NextRequest) {
  const actor = await requireDirectionActor();
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const salaires: Record<string, number> = {};
  for (const grade of Object.keys(GRADES_DEFAULT)) {
    const val = Number(body[grade]);
    salaires[grade] = isNaN(val) || val < 0 ? 0 : val;
  }

  const { error } = await db()
    .from('site_config')
    .upsert({ key: CONFIG_KEY, value: salaires }, { onConflict: 'key' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const desc = Object.entries(salaires).map(([g, v]) => `${g}: $${v}`).join(', ');
  redmLog(actor, { action: 'salaires_update', category: 'salaires', description: `A mis à jour la grille salariale — ${desc}`, meta: salaires });
  return NextResponse.json({ ok: true, salaires });
}
