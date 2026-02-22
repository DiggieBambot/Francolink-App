// src/lib/supabase/middleware.ts

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

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
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ═══════════════════════════════════════════════════════════════
  // ██  PUBLIC ROUTES - Allow without any checks  ██████████████████
  // ═══════════════════════════════════════════════════════════════
  const publicRoutes = [
    '/tutors',
    '/join',
    '/about',
    '/pricing',
    '/contact',
    '/terms',
    '/privacy',
    '/api/webhooks',
    '/auth/callback',
  ];

  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  if (isPublicRoute) {
    return supabaseResponse;
  }
  // ═══════════════════════════════════════════════════════════════

  // 1. Handle Admin Routes
  if (pathname.startsWith('/admin')) {
    // If not logged in -> redirect to login
    if (!user) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Check role in database
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    // If user doesn't exist in DB yet, redirect to onboarding
    if (!userData) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    // If logged in but not ADMIN -> redirect to dashboard
    if (userData?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // If ADMIN -> allow access
    return supabaseResponse;
  }

  // 2. Handle Tutor Routes
  if (pathname.startsWith('/tutor')) {
    if (!user) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    // If user doesn't exist in DB yet, redirect to onboarding
    if (!userData) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    // Tutors and Admins can access tutor dashboard
    if (userData?.role !== 'TUTOR' && userData?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    return supabaseResponse;
  }

  // 3. Handle Onboarding Route
  if (pathname === '/onboarding' || pathname.startsWith('/onboarding/')) {
    // Allow authenticated users to access onboarding
    if (user) {
      return supabaseResponse;
    }
    // Not logged in -> redirect to signup
    return NextResponse.redirect(new URL('/signup', request.url));
  }

  // 4. Handle Protected Student Routes
  const protectedRoutes = [
    '/dashboard',
    '/learn',
    '/profile',
    '/settings',
    '/placement-test',
    '/checkout',
    '/student',
    '/messages',
    '/progress',
    '/practice',
    '/lessons',
    '/upgrade-plus',
  ];

  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    if (!user) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Check if user exists in database
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    // If user is authenticated but not in database, redirect to onboarding
    if (!userData) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    // User exists, allow access
    return supabaseResponse;
  }

  // 5. Handle Auth Routes (Login/Signup)
  const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];
  const isAuthRoute = authRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  if (isAuthRoute && user) {
    // If already logged in, check their role and redirect
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    // If user doesn't exist in DB yet, send to onboarding
    if (!userData) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    // Redirect based on role
    if (userData?.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    if (userData?.role === 'TUTOR') {
      return NextResponse.redirect(new URL('/tutor', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return supabaseResponse;
}
