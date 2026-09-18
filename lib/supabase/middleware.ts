import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/auth');
  const isPendingRoute = request.nextUrl.pathname.startsWith('/pending');

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && !isAuthRoute) {
    const { data: member } = await supabase
      .from('members')
      .select('status')
      .eq('user_id', user.id)
      .single();

    if (member?.status !== 'approved') {
      if (!isPendingRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/pending';
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }

    if (isPendingRoute || (isAuthRoute && request.nextUrl.pathname === '/login')) {
      const url = request.nextUrl.clone();
      url.pathname = '/redm';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}