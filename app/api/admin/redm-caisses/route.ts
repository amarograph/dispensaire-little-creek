import { NextRequest, NextResponse } from 'next/server';
import { requireDirectionRead } from '@/lib/redm-api-auth';
import { createClient } from '@supabase/supabase-js';
import { CAISSE_RATE, CAISSE_ROLES } from '@/lib/caisse-rates';

export const dynamic = 'force-dynamic';

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/* GET ?from=YYYY-MM-DD&to=YYYY-MM-DD — caisses de tout le personnel concerné sur la période */
export async function GET(req: NextRequest) {
  if (!await requireDirectionRead()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const from = searchParams.get('from');
  const to   = searchParams.get('to');
  if (!from || !to) return NextResponse.json({ error: 'Missing from/to' }, { status: 400 });

  const supabase = db();

  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('discord_id, username, roles')
    .eq('status', 'approved');
  if (membersError) return NextResponse.json({ error: membersError.message }, { status: 500 });

  const staff = (members ?? []).filter(m =>
    (m.roles ?? []).some((r: string) => (CAISSE_ROLES as readonly string[]).includes(r))
  );

  const { data: profiles } = await supabase
    .from('user_rp_profiles')
    .select('discord_id, nom_rp, prenom_rp')
    .eq('universe', 'redm');
  const rp: Record<string, { nom_rp: string; prenom_rp: string }> = {};
  for (const row of profiles ?? []) rp[row.discord_id] = row;

  const { data: caisses, error } = await supabase
    .from('redm_caisses')
    .select('discord_id, date')
    .gte('date', from)
    .lte('date', to);

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ staff: [], missing_table: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const byUser: Record<string, string[]> = {};
  for (const c of caisses ?? []) (byUser[c.discord_id] ??= []).push(c.date);

  const result = staff.map(m => {
    const roles: string[] = m.roles ?? [];
    let rate = 0;
    for (const r of roles) {
      const v = CAISSE_RATE[r as keyof typeof CAISSE_RATE];
      if (v != null && v > rate) rate = v;
    }
    const p = rp[m.discord_id] ?? { prenom_rp: '', nom_rp: '' };
    const nom = [p.prenom_rp, p.nom_rp].filter(Boolean).join(' ') || m.username;
    const dates = (byUser[m.discord_id] ?? []).sort();
    return {
      discord_id: m.discord_id,
      nom,
      roles,
      rate,
      dates,
      count: dates.length,
      salaire: Math.round(dates.length * rate * 100) / 100,
    };
  }).sort((a, b) => b.rate - a.rate || a.nom.localeCompare(b.nom));

  return NextResponse.json({ staff: result });
}
