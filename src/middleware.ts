import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { APP_URL, SITE_PREFIX, SITE_URL, isMarketingHost } from "@/lib/site/hosts";

const intlMiddleware = createIntlMiddleware(routing);

// Paths that belong to neither host in particular — served as-is everywhere.
const HOST_NEUTRAL = ["/api/", "/_next/", "/auth/", "/icons/", "/images/"];

const HOST_NEUTRAL_EXACT = [
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/sw.js",
];

function isHostNeutral(pathname: string): boolean {
  return (
    HOST_NEUTRAL.some((p) => pathname.startsWith(p)) ||
    HOST_NEUTRAL_EXACT.includes(pathname)
  );
}

/**
 * Splits traffic between francolink.net (the front-facing website) and
 * app.francolink.net (the product). Returns a response when it has handled the
 * request, or null to let the normal app middleware below take over.
 */
function handleHostSplit(request: NextRequest): NextResponse | null {
  const { pathname, search } = request.nextUrl;
  if (isHostNeutral(pathname)) return null;

  const onMarketingHost = isMarketingHost(request.headers.get("host"));

  if (onMarketingHost) {
    // Marketing host never serves app pages — send those to the app domain so
    // a stale link or bookmark still lands somewhere useful.
    if (pathname.startsWith(SITE_PREFIX)) {
      const clean = pathname.slice(SITE_PREFIX.length) || "/";
      return NextResponse.redirect(new URL(`${clean}${search}`, SITE_URL), 308);
    }
    if (isSitePath(pathname)) {
      // Serve the marketing page from src/app/site/** at the clean root URL.
      const url = request.nextUrl.clone();
      url.pathname = pathname === "/" ? SITE_PREFIX : `${SITE_PREFIX}${pathname}`;
      return NextResponse.rewrite(url);
    }
    // Anything the website doesn't own belongs to the app — a signup link, a
    // room deeplink, an old bookmark. Hand it to the app domain.
    return NextResponse.redirect(new URL(`${pathname}${search}`, APP_URL), 307);
  }

  // App host: the marketing pages have a canonical home on the other domain.
  if (pathname === SITE_PREFIX || pathname.startsWith(`${SITE_PREFIX}/`)) {
    const clean = pathname.slice(SITE_PREFIX.length) || "/";
    return NextResponse.redirect(new URL(`${clean}${search}`, SITE_URL), 308);
  }

  return null;
}

// Pages the front-facing website owns. Everything else on francolink.net is
// redirected to the app domain, so this list is the website's whole surface.
const SITE_ROUTES = [
  "/",
  "/tutors",
  "/teach",
  "/how-it-works",
  "/pricing",
  "/about",
  "/faq",
  "/contact",
  "/testimonials",
  "/blog",
  "/privacy",
  "/terms",
];

function isSitePath(pathname: string): boolean {
  return SITE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

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
  "/games",
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
  "/space",
  "/become-tutor",
  "/tutor",
  "/tutors",
  "/pricing",
  "/about",
  "/contact",
];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 0. francolink.net vs app.francolink.net. The marketing site is fully
  //    anonymous (sessions live on the app domain), so it needs neither the
  //    Supabase session refresh nor intl routing below.
  const hostResponse = handleHostSplit(request);
  if (hostResponse) return hostResponse;

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
