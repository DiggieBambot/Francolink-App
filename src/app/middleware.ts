// src/middleware.ts
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

// ------------------------------------------------------------------
// next-intl middleware
// ------------------------------------------------------------------

const intlMiddleware = createIntlMiddleware(routing);

// ------------------------------------------------------------------
// Routes that bypass intl completely
// ------------------------------------------------------------------

function shouldSkipIntl(pathname: string): boolean {
  const skipPatterns = [
    "/api/",
    "/_next/",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
    // Keep your existing dashboard/portal routes outside [locale] for now
    "/dashboard",
    "/student/",
    "/tutor/",
    "/admin/",
    "/settings",
    "/checkout/",
    "/login",
    "/signup",
    "/auth/",
  ];

  return skipPatterns.some((pattern) => pathname.startsWith(pattern));
}

// ------------------------------------------------------------------
// Routes that SHOULD go through intl (public pages)
// ------------------------------------------------------------------

function shouldUseIntl(pathname: string): boolean {
  // Only apply intl to public-facing routes
  const intlRoutes = [
    "/",
    "/tutors",
    "/pricing",
    "/about",
    "/contact",
    "/blog",
    "/join/",
  ];

  // Check if it's a locale-prefixed route
  const locales = routing.locales;
  const isLocalePrefixed = locales.some(
    (locale) =>
      pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  if (isLocalePrefixed) return true;

  return intlRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

// ------------------------------------------------------------------
// Main middleware
// ------------------------------------------------------------------

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Always refresh Supabase session
  const authResponse = await updateSession(request);

  // 2. If auth middleware wants a redirect, do it
  if (
    authResponse &&
    authResponse.status >= 300 &&
    authResponse.status < 400
  ) {
    return authResponse;
  }

  // 3. Skip intl for dashboard/portal/api routes
  if (shouldSkipIntl(pathname)) {
    return authResponse || NextResponse.next();
  }

  // 4. Apply intl only to public pages
  if (shouldUseIntl(pathname)) {
    const intlResponse = intlMiddleware(request);

    // Merge auth cookies into intl response
    if (authResponse) {
      const setCookieHeaders = authResponse.headers.getSetCookie();
      setCookieHeaders.forEach((cookie) => {
        intlResponse.headers.append("Set-Cookie", cookie);
      });
    }

    return intlResponse;
  }

  // 5. Everything else — pass through
  return authResponse || NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json)$).*)",
  ],
};