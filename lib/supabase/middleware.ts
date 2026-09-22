import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { canRead, isAdmin, isDirection, ROUTE_SECTION } from '@/lib/permissions';

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
      .select('status, roles')
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

    const roles: string[] = member.roles ?? [];

    /* Préparateur de caisse "pur" (aucun autre rôle) : accès exclusif au registre des caisses.
       Les routes /api/* ne sont jamais redirigées ici — elles ont leurs propres vérifications de
       rôle, et rediriger une requête API vers une page HTML casse le JSON attendu côté client. */
    if (roles.length === 1 && roles[0] === 'redm_preparateur_caisse') {
      const allowed = request.nextUrl.pathname.startsWith('/redm/registre-caisses')
        || request.nextUrl.pathname.startsWith('/api/');
      if (!allowed) {
        const url = request.nextUrl.clone();
        url.pathname = '/redm/registre-caisses';
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }

    if (isPendingRoute || (isAuthRoute && request.nextUrl.pathname === '/login')) {
      const url = request.nextUrl.clone();
      url.pathname = '/redm';
      return NextResponse.redirect(url);
    }

    if (request.nextUrl.pathname.startsWith('/admin')) {
      const whitelistOnly = request.nextUrl.pathname.startsWith('/admin/access') && isDirection(roles);
      if (!isAdmin(roles) && !whitelistOnly) {
        const url = request.nextUrl.clone();
        url.pathname = '/redm';
        return NextResponse.redirect(url);
      }
    }

    if (!isAdmin(roles)) {
      for (const { prefix, section } of ROUTE_SECTION) {
        if (request.nextUrl.pathname.startsWith(prefix)) {
          if (!canRead(roles, section)) {
            const url = request.nextUrl.clone();
            url.pathname = '/redm';
            return NextResponse.redirect(url);
          }
          break;
        }
      }
    }
  }

  return supabaseResponse;
}