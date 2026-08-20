// src/components/auth/turnstile.tsx
//
// Cloudflare Turnstile, wired for Supabase Auth's built-in captcha check.
//
// Why this lives on the client and not in middleware: the signup forms talk to
// Supabase directly from the browser, so a bot never has to touch our Next.js
// app at all — it can POST straight to /auth/v1/signup with the public anon
// key. The only place a check actually bites is inside Supabase, which means
// Auth → Settings → Bot and Abuse Protection must be turned on with the
// matching secret key. This component just produces the token it expects.
//
// With NEXT_PUBLIC_TURNSTILE_SITE_KEY unset the hook reports `enabled: false`,
// renders nothing, and hands back a null token — forms keep working in local
// dev exactly as they did before.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("turnstile-script-failed"));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Returns the token to hand Supabase, a `reset()` to call after a failed
 * attempt (tokens are single-use), and the widget element to drop in the form.
 */
export function useTurnstile() {
  const [token, setToken] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const enabled = !!SITE_KEY;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    loadScript()
      .then(() => {
        if (cancelled || !containerRef.current || widgetIdRef.current) return;
        widgetIdRef.current = window.turnstile!.render(containerRef.current, {
          sitekey: SITE_KEY,
          callback: (t: string) => setToken(t),
          "expired-callback": () => setToken(null),
          "error-callback": () => setToken(null),
          theme: "light",
        });
      })
      .catch(() => {
        // Cloudflare unreachable (ad blocker, offline). Leave the token null;
        // Supabase will reject the attempt and the form shows its error.
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [enabled]);

  const reset = useCallback(() => {
    setToken(null);
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, []);

  const widget = enabled ? <div ref={containerRef} className="flex justify-center" /> : null;

  return { token, reset, enabled, widget };
}
