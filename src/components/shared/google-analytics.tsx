// src/components/shared/google-analytics.tsx
//
// Loads Google Analytics 4 (gtag.js) via next/script. Rendered only when
// NEXT_PUBLIC_GA_ID is set, so it's a no-op in environments without analytics.
//
// Note on privacy: this drops analytics cookies on load. If you need GDPR/
// consent-mode gating for EU/MENA visitors, wrap the config call in a consent
// check — out of scope for this initial setup.

import Script from "next/script";

export function GoogleAnalytics({ gaId }: { gaId: string }) {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`}
      </Script>
    </>
  );
}
