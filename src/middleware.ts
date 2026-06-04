import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

// Routes that skip intl entirely (static files, api)
const SKIP_INTL = [
  "/auth/",
  "/api/",
  "/_next/",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

// App routes that should NOT go through intl
// These are your (auth), (student), (tutor), (admin) route groups
const APP_ROUTES = [
  "/auth",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/callback",
  "/onboarding",
  "/join",
  "/dashboard",
  "/learn",
  "/profile",
  "/settings",
  "/notifications",
  "/placement-test",
  "/checkout",
  "/student",
  "/messages",
  "/progress",
  "/practice",
  "/lessons",
  "/upgrade-plus",
  "/admin",
  "/preview",
  "/room",
  "/library",
  "/how-it-works",
  "/get-started",
  "/tutor",
  "/tutors",
  "/pricing",
  "/about",
  "/contact",
];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
if (SKIP_INTL.some((p) => pathname.startsWith(p))) {
  // Auth routes still need session handling for cookies
  if (pathname.startsWith('/auth/')) {
    return await updateSession(request);
  }
  return NextResponse.next();
}

  // 2. App routes — run auth middleware only, skip intl
  const isAppRoute = APP_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isAppRoute) {
    return await updateSession(request);
  }

  // 3. Everything else (/, /en, /fr, /en/..., /fr/...) — run intl + auth
  const authResponse = await updateSession(request);

  // If auth wants a redirect, do it
  if (
    authResponse?.status &&
    authResponse.status >= 300 &&
    authResponse.status < 400
  ) {
    return authResponse;
  }

  // Run intl middleware for locale routes
  const intlResponse = intlMiddleware(request);

  // Merge auth cookies into intl response
  if (authResponse) {
    const cookies = authResponse.headers.getSetCookie();
    cookies.forEach((cookie) => {
      intlResponse.headers.append("Set-Cookie", cookie);
    });
  }

  return intlResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:js|svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|webmanifest|wav|mp3)$).*)",
  ],
};
