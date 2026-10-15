import { type NextFetchEvent, type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { APP_URL, SITE_PREFIX, SITE_URL, isMarketingHost } from "@/lib/site/hosts";
import { REF_COOKIE, REF_COOKIE_DAYS, normalizeCode, refCookieDomain } from "@/lib/affiliates";

const intlMiddleware = createIntlMiddleware(routing);

// Paths that belong to neither host in particular — served as-is everywhere.
const HOST_NEUTRAL = ["/api/", "/_next/", "/auth/", "/icons/", "/images/"];

const HOST_NEUTRAL_EXACT = [
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  // Host-aware: the route handler serves different text per host, so it must
  // reach the handler rather than be redirected across domains like a page.
  "/llms.txt",
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
    // A path the website doesn't own but the app does — a signup link, a room
    // deeplink, an old bookmark. Hand it to the app domain.
    if (isAppPath(pathname)) {
      return NextResponse.redirect(new URL(`${pathname}${search}`, APP_URL), 307);
    }

    // Anything else is simply not a page. This used to fall through to the same
    // cross-domain redirect above, which meant every typo, dead link and
    // case-variant ("/Tutors") answered 307 → app.francolink.net → 404: a
    // wasted crawl hop for Googlebot, inbound link equity handed to a foreign
    // host, and 4xx noise in the app's Search Console for URLs it never owned.
    // Rewriting to a path under the site tree that matches no route renders the
    // website's own 404, on the website's own host, with no redirect.
    const notFound = request.nextUrl.clone();
    notFound.pathname = `${SITE_PREFIX}/_not-found`;
    return NextResponse.rewrite(notFound, { status: 404 });
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
  // Author pages. The E-E-A-T anchor every blog post's Person schema points at,
  // so it has to resolve on the marketing host, not bounce to the app.
  "/authors",
  // Pillar guides. docs/seo-content-plan.md originally put these under /learn,
  // which cannot work: /learn is in APP_ROUTES below, so anything beneath it
  // host-splits to app.francolink.net and the hub would redirect off the
  // marketing domain. Decided 2026-09-10.
  "/guides",
  "/privacy",
  "/terms",
  // Google Play's required web link for account deletion. Must work signed-out.
  "/delete-account",
  // The workbook's sales page. Lives on the website, not the app: it is
  // indexable, it is what ads point at, and buying does not need a session.
  "/francais-pas-a-pas",
];

function isSitePath(pathname: string): boolean {
  return SITE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

/**
 * Paths the app domain genuinely owns. Only these get forwarded off the
 * marketing host; everything else 404s there instead of bouncing cross-domain
 * into the app's 404. Reuses APP_ROUTES below — the entries that also appear in
 * SITE_ROUTES (/tutors, /pricing, /about…) never reach here, because
 * isSitePath() matches them first.
 */
function isAppPath(pathname: string): boolean {
  return APP_ROUTES.some(
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
  "/book",
  "/upgrade-plus",
  "/admin",
  "/preview",
  "/room",
  "/library",
  // The workbook funnel. These must be listed here or they fall through to
  // the intl middleware, which rewrites them to /[locale]/... -- routes that
  // do not exist, so every one of them 404s. /unlock is the link in the
  // delivery email, so this list is the difference between a buyer opening
  // their workbook and a buyer seeing a 404 after paying.
  "/unlock",
  "/oto",
  "/workbook",
  // The lesson funnel entrance. Same trap as the workbook routes above: every
  // "Register free" CTA on the website and every booking gate redirect points
  // at /start, so leaving it off this list 404s the whole funnel — which is
  // exactly what it did in production until someone tried it.
  "/start",
  "/how-it-works",
  "/get-started",
  "/space",
  "/become-tutor",
  // Creator (affiliate) dashboard.
  "/creator",
  "/tutor",
  "/tutors",
  "/pricing",
  "/about",
  "/contact",
];

/**
 * Creator links: ?ref=<code> on any page, either host.
 *
 * Stores the code in a cookie both hosts can read (creators link to the
 * website; signup and checkout happen on the app) and counts the click. The
 * latest creator link wins the cookie; who finally gets the customer is
 * decided once, at signup or checkout (lib/affiliates). The code is not
 * checked here -- an unknown one is simply never matched later.
 */
function withReferral(request: NextRequest, response: Response, event: NextFetchEvent): Response {
  const code = normalizeCode(request.nextUrl.searchParams.get("ref"));
  if (!code || !(response instanceof NextResponse)) return response;

  // A reload or second page view with the same link is not a second click.
  if (request.cookies.get(REF_COOKIE)?.value === code) return response;

  response.cookies.set(REF_COOKIE, code, {
    path: "/",
    domain: refCookieDomain(),
    maxAge: REF_COOKIE_DAYS * 24 * 60 * 60,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceKey) {
    let referrerHost: string | null = null;
    try {
      const ref = request.headers.get("referer");
      referrerHost = ref ? new URL(ref).hostname : null;
    } catch {}
    // After the response: counting a click must never slow the page down.
    event.waitUntil(
      fetch(`${supabaseUrl}/rest/v1/rpc/record_affiliate_click`, {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          p_code: code,
          p_landing_path: request.nextUrl.pathname,
          p_referrer_host: referrerHost,
        }),
      }).catch(() => {}),
    );
  }
  return response;
}

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  return withReferral(request, await route(request), event);
}

async function route(request: NextRequest): Promise<Response> {
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
  // Supabase's auth client refreshes the session in here on every request. On
  // the Edge runtime that fetch fails outright in local dev — the edge sandbox
  // cannot reach Supabase — and auth-js retries with backoff, adding 40-50s to
  // every single request before the page finally renders. Node is the runtime
  // Vercel recommends for middleware now (Edge is the legacy path), and it is
  // where the Supabase client is happiest.
  runtime: "nodejs",
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:js|svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|webmanifest|wav|mp3)$).*)",
  ],
};
