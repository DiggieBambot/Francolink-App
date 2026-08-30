"use client";

// The visitor's shortlist on the MARKETING host.
//
// Why this is localStorage and not the tutor_favorites table: the Supabase
// session cookie belongs to app.francolink.net, and the website is
// francolink.net. A visitor reading /tutors is anonymous to us no matter
// whether they have an account — the site has no way to know, and a
// cross-origin write would need third-party cookies, which Safari blocks
// outright. Same constraint that made /book a navigation rather than a fetch.
//
// So the website keeps a local shortlist, and it transfers exactly once: the
// signup CTA carries the slugs in the URL, and the app persists them against
// the real account on arrival. Local until there is somebody to attach it to.
//
// localStorage is also per-origin, so this list genuinely cannot be read by
// the app host — the URL handoff is not laziness, it is the only door.

import { useCallback, useEffect, useState } from "react";

const KEY = "fl.shortlist";
const EVENT = "fl:shortlist";

/** Cap: a shortlist is a shortlist. It also keeps the handoff URL sane. */
const MAX = 20;

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    // A corrupt or unavailable store (private mode, quota) must not break the
    // directory. An empty shortlist is a fine thing to fall back to.
    return [];
  }
}

function write(slugs: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(slugs.slice(0, MAX)));
  } catch {
    /* nothing useful to do; the heart just won't persist */
  }
  // Same-tab listeners: the `storage` event only fires in OTHER tabs, so every
  // heart on the page would go stale without this.
  window.dispatchEvent(new Event(EVENT));
}

export function useShortlist() {
  const [slugs, setSlugs] = useState<string[]>([]);

  // Read after mount, never during render: the server has no localStorage and
  // seeding state from it directly would hydrate-mismatch every card.
  useEffect(() => {
    const sync = () => setSlugs(read());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((slug: string) => {
    const current = read();
    write(
      current.includes(slug)
        ? current.filter((s) => s !== slug)
        : [slug, ...current]
    );
  }, []);

  const has = useCallback((slug: string) => slugs.includes(slug), [slugs]);

  return { slugs, toggle, has };
}

/**
 * Append the shortlist to a CTA so signup can adopt it.
 *
 * Slugs only — no ids, nothing personal — so this is safe in a URL that will
 * land in browser history and referrer headers.
 */
export function withShortlist(url: string, slugs: string[]): string {
  if (slugs.length === 0) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}shortlist=${encodeURIComponent(slugs.slice(0, MAX).join(","))}`;
}
