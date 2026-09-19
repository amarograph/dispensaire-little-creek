import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getApiSession } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const universe = req.nextUrl.searchParams.get('universe');
  if (universe !== 'redm')
    return NextResponse.json({ error: 'universe invalide' }, { status: 400 });

  const supabase = await createServiceClient();

  const [{ data: rpData }, { data: profilData }] = await Promise.all([
    supabase.from('user_rp_profiles')
      .select('nom_rp, prenom_rp')
      .eq('discord_id', session.discordId)
      .eq('universe', universe)
      .single(),
    supabase.from('redm_profils')
      .select('portrait_url')
      .eq('discord_id', session.discordId)
      .single(),
  ]);

  return NextResponse.json({
    nom_rp:      rpData?.nom_rp      ?? '',
    prenom_rp:   rpData?.prenom_rp   ?? '',
    portrait_url: (profilData as any)?.portrait_url ?? '',
  });
}

export async function POST(req: NextRequest) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { universe, nom_rp, prenom_rp } = await req.json();
  if (universe !== 'redm')
    return NextResponse.json({ error: 'universe invalide' }, { status: 400 });

  const supabase = await createServiceClient();
  const { error } = await supabase
    .from('user_rp_profiles')
    .upsert(
      { discord_id: session.discordId, universe, nom_rp: nom_rp ?? '', prenom_rp: prenom_rp ?? '' },
      { onConflict: 'discord_id,universe' }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
