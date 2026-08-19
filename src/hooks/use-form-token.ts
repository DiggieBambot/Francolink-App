"use client";

import { useEffect, useState } from "react";

/**
 * Fetches the anti-spam token a public form must submit.
 *
 * Fetched on mount rather than embedded in the page because these pages are
 * statically generated with ISR — a token baked at build time would be hours
 * stale by the time anyone saw it.
 */
export function useFormToken(): string {
  const [token, setToken] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/site/form-token")
      .then((r) => r.json())
      .then((b) => {
        if (!cancelled && typeof b?.token === "string") setToken(b.token);
      })
      .catch(() => {
        /* Submitting without one fails closed on the server. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return token;
}
