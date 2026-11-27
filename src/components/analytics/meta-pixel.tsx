"use client";

// Meta (Facebook/Instagram) pixel. Loads fbevents.js, fires PageView on the
// first load and on every client-side navigation. Conversions that matter are
// also sent server-side (lib/meta/capi.ts) with the same event id, so an ad
// blocker here costs nothing but page views.
//
// Rendered only when NEXT_PUBLIC_META_PIXEL_ID is set. Like GA, it sets
// cookies on load; consent gating is not in place yet.

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

type Fbq = (...args: unknown[]) => void;
declare global {
  interface Window {
    fbq?: Fbq;
  }
}

/** Fire a pixel event. Safe to call when the pixel is absent or blocked. */
export function metaTrack(
  name: string,
  params: Record<string, unknown> = {},
  eventId?: string,
): void {
  try {
    if (typeof window === "undefined" || !window.fbq) return;
    if (eventId) window.fbq("track", name, params, { eventID: eventId });
    else window.fbq("track", name, params);
  } catch {
    /* ignore */
  }
}

function RouteChangePageView() {
  const pathname = usePathname();
  const search = useSearchParams();
  const first = useRef(true);
  useEffect(() => {
    // The init snippet already sent the first PageView.
    if (first.current) {
      first.current = false;
      return;
    }
    metaTrack("PageView");
  }, [pathname, search]);
  return null;
}

export function MetaPixel({ pixelId }: { pixelId: string }) {
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');`}
      </Script>
      <Suspense fallback={null}>
        <RouteChangePageView />
      </Suspense>
    </>
  );
}
