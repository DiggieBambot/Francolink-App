"use client";

import { useEffect, useState } from "react";

/**
 * When a public page is embedded in an iframe (e.g. the in-room lesson picker),
 * hide the site navbar + footer so only the content shows. Keyed on "am I in an
 * iframe", so it persists as the user navigates into category/search pages.
 */
export function EmbedChrome() {
  const [embedded, setEmbedded] = useState(false);

  useEffect(() => {
    try {
      setEmbedded(window.self !== window.top);
    } catch {
      // Cross-origin access throws → we're definitely framed.
      setEmbedded(true);
    }
  }, []);

  if (!embedded) return null;
  return (
    <style>{`
      [data-site-chrome]{display:none !important}
      main[data-public-main]{padding-top:0 !important}
    `}</style>
  );
}
