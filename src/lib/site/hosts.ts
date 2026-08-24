// Host split between the front-facing website and the app.
//
//   francolink.net / www.francolink.net  → the marketing site (src/app/site/**)
//   app.francolink.net                   → the app (everything else)
//
// Middleware rewrites `/` → `/site` on the marketing hosts, so marketing pages
// live at clean root URLs while staying in one Next.js project. Nothing else
// in the codebase should hardcode these hostnames — import from here.

/**
 * In development the marketing host defaults to site.localhost, not the live
 * domain. `localhost:3000` is the APP host, and /tutors there is a redirect to
 * `siteUrl("/tutors")` — with the production default that redirect walked
 * straight out of the dev server and onto francolink.net, so local changes
 * looked like they had never been made. An explicit NEXT_PUBLIC_SITE_URL still
 * wins, and production builds (including Vercel previews) are untouched.
 */
const DEV = process.env.NODE_ENV === "development";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (DEV ? "http://site.localhost:3000" : "https://francolink.net");

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (DEV ? "http://localhost:3000" : "https://app.francolink.net");

/** Path prefix the marketing pages physically live under. */
export const SITE_PREFIX = "/site";

function hostnamesOf(url: string): string[] {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h.startsWith("www.") ? [h, h.slice(4)] : [h, `www.${h}`];
  } catch {
    return [];
  }
}

/**
 * Hosts that should serve the marketing site.
 *
 * `SITE_DEV_HOSTS` lets you exercise the split locally: run the dev server and
 * visit http://site.localhost:3000 for the website, http://localhost:3000 for
 * the app.
 */
const SITE_DEV_HOSTS = ["site.localhost", "www.localhost"];

export function isMarketingHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const hostname = host.split(":")[0].toLowerCase();
  if (SITE_DEV_HOSTS.includes(hostname)) return true;
  // A Vercel preview deployment serves both halves; the app is the default
  // there, and the site is reachable at /site/* directly.
  return hostnamesOf(SITE_URL).includes(hostname);
}

/** Absolute URL for a marketing page, used for cross-host links and SEO tags. */
export function siteUrl(path = "/"): string {
  return `${SITE_URL}${path === "/" ? "" : path}`;
}

/** Absolute URL for an app page, used for CTAs on the marketing site. */
export function appUrl(path = "/"): string {
  return `${APP_URL}${path === "/" ? "" : path}`;
}
