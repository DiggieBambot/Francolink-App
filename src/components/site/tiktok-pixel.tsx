// TikTok Pixel, on the website (francolink.net) only -- never in the app,
// where students' lesson activity has no business going to an ad network.
//
// Off unless NEXT_PUBLIC_TIKTOK_PIXEL_ID is set, so previews and local dev
// send nothing. The base code fires one page view on load; client-side
// navigation does not reload it, so later route changes fire their own.
//
// Events sent (see lib/site/tiktok.ts):
//   ViewContent       the workbook sales page
//   InitiateCheckout  the buy button
//   SubmitForm        the free-chapter signup
//   CompletePayment   the download page, on arrival from Stripe

//
// A server component, like the Google Analytics one: an inline next/script
// rendered from a client component never reached the server HTML.

import Script from "next/script";
import { TIKTOK_PIXEL_ID } from "@/lib/site/tiktok";
import { TikTokPageViews } from "@/components/site/tiktok-events";

export function TikTokPixel() {
  if (!TIKTOK_PIXEL_ID) return null;

  // TikTok's standard base code, unchanged apart from the id.
  return (
    <>
    <TikTokPageViews />
    <Script id="tiktok-pixel" strategy="afterInteractive">
      {`!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
  ttq.load(${JSON.stringify(TIKTOK_PIXEL_ID)});
  ttq.page();
}(window, document, 'ttq');`}
    </Script>
    </>
  );
}
