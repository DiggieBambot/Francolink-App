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
          // Pass Supabase's cookie options through unchanged. The previous code
          // forced httpOnly: true, which hid auth cookies from the browser SDK
          // and made every client-side supabase.auth.getUser() return null.
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const publicRoutes = [
    '/tutors', '/join', '/about', '/pricing', '/contact',
    '/terms', '/privacy', '/api/webhooks', '/auth/callback',
    '/admin/login',  // ← ADD THIS
  ];

  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );
  if (isPublicRoute) return supabaseResponse;

  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url));  // ← was /login
    }
    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (!userData) return NextResponse.redirect(new URL('/onboarding', request.url));
    if (userData?.role !== 'ADMIN') return NextResponse.redirect(new URL('/admin/login', request.url));  // ← was /dashboard
    return supabaseResponse;
  }

  if (pathname.startsWith('/tutor')) {
    if (!user) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (!userData) return NextResponse.redirect(new URL('/onboarding', request.url));
    if (userData?.role !== 'TUTOR' && userData?.role !== 'ADMIN') return NextResponse.redirect(new URL('/dashboard', request.url));
    return supabaseResponse;
  }

  if (pathname === '/onboarding' || pathname.startsWith('/onboarding/')) {
    if (user) return supabaseResponse;
    return NextResponse.redirect(new URL('/signup', request.url));
  }

  const protectedRoutes = [
    '/dashboard', '/learn', '/profile', '/settings', '/notifications', '/placement-test',
    '/checkout', '/student', '/messages', '/progress', '/practice',
    '/lessons', '/upgrade-plus',
  ];

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    if (!user) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (!userData) return NextResponse.redirect(new URL('/onboarding', request.url));
    return supabaseResponse;
  }

  const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];
  const isAuthRoute = authRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

  if (isAuthRoute && user) {
    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (!userData) return NextResponse.redirect(new URL('/onboarding', request.url));
    if (userData?.role === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.url));
    if (userData?.role === 'TUTOR') return NextResponse.redirect(new URL('/tutor', request.url));
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return supabaseResponse;
}
