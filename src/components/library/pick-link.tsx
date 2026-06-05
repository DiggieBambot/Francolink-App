"use client";

import type { ReactNode } from "react";

/**
 * Wraps a lesson card link. Normally navigates to the lesson page. But when the
 * catalogue is embedded as a picker (inside an iframe opened with ?pick=1 from a
 * live room), a click instead postMessages the slug back to the room so the
 * lesson loads there for both participants — no navigation.
 */
export function PickLink({
  href,
  slug,
  title,
  className,
  children,
}: {
  href: string;
  slug: string;
  title: string;
  className?: string;
  children: ReactNode;
}) {
  function onClick(e: React.MouseEvent) {
    if (typeof window === "undefined") return;
    // If the catalogue is embedded in a room's picker iframe, hand the slug back
    // to the room instead of navigating. Keyed on "in an iframe" so it survives
    // navigation into category/search pages (which drop the ?pick=1 param).
    const inIframe = window.parent && window.parent !== window;
    if (inIframe) {
      e.preventDefault();
      window.parent.postMessage(
        { type: "francolink:pick-lesson", slug, title },
        window.location.origin
      );
    }
    // else: let the anchor navigate normally
  }

  return (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  );
}
