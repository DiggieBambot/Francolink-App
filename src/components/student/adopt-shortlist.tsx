"use client";

// Turns a shortlist built on the marketing site into real favourites.
//
// Fires once, silently, on mount. Nothing is shown for it: the student
// hearted those tutors on another host minutes ago and does not need a
// confirmation, and a failure here costs them nothing they can't redo.

import { useEffect, useRef } from "react";

export function AdoptShortlist({ slugs }: { slugs: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const list = slugs.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20);
    if (list.length === 0) return;

    fetch("/api/tutors/favorites/adopt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slugs: list }),
    }).catch(() => {
      /* best effort — the student can re-save from the directory */
    });
  }, [slugs]);

  return null;
}
