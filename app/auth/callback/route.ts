import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  const user = data.user;
  const discordId = (user.user_metadata?.provider_id ?? user.user_metadata?.sub) as string | undefined;
  const username = (user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.user_metadata?.custom_claims?.global_name ?? 'Inconnu') as string;

  if (!discordId) {
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  const { data: existing } = await supabase
    .from('members')
    .select('status')
    .eq('user_id', user.id)
    .single();

  if (!existing) {
    const adminIds = (process.env.ADMIN_DISCORD_IDS ?? '')
      .split(',')
      .map(id => id.trim())
      .filter(Boolean);
    const isDev = adminIds.includes(discordId);

    await supabase.from('members').insert({
      user_id: user.id,
      discord_id: discordId,
      username,
      status: isDev ? 'approved' : 'pending',
      roles: isDev ? ['dev'] : [],
      decided_at: isDev ? new Date().toISOString() : null,
      decided_by: isDev ? 'auto (ADMIN_DISCORD_IDS)' : null,
    });

    return NextResponse.redirect(`${origin}${isDev ? '/redm' : '/pending'}`);
  }

  if (existing.status !== 'approved') {
    return NextResponse.redirect(`${origin}/pending`);
  }

  return NextResponse.redirect(`${origin}/redm`);
}
