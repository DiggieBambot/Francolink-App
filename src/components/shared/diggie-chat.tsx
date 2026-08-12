"use client";

// Loads the DiggieChat widget (DiggieStack's AI chatbot) via next/script.
// The widget is an IIFE that reads window.DiggieChat at execution time and
// appends its own launcher (#_dc_fab) and panel (#_dc_win) to document.body,
// so config has to be in place *before* chat.js runs — hence the single
// inline script that sets the global and then injects the tag itself.
//
// Rendered only when NEXT_PUBLIC_DIGGIECHAT_SITE_ID is set.

import Script from "next/script";

const SITE_ID = process.env.NEXT_PUBLIC_DIGGIECHAT_SITE_ID;
const BASE_URL =
  process.env.NEXT_PUBLIC_DIGGIECHAT_BASE_URL || "https://diggiestack.com";

export function DiggieChat() {
  if (!SITE_ID) return null;

  return (
    <>
      {/*
        The widget pins itself to bottom-right, where AITutorFab and the mobile
        bottom nav already live. Lift and inset it so the two launchers stack
        instead of overlapping.
      */}
      <style>{`
        #_dc_fab._dc_right { right: 16px; bottom: 168px; }
        #_dc_win._dc_right { right: 16px; bottom: 230px; }
        #_dc_proactive._dc_right { right: 16px; bottom: 230px; }
        @media (min-width: 1024px) {
          #_dc_fab._dc_right { right: 24px; bottom: 96px; }
          #_dc_win._dc_right { right: 24px; bottom: 158px; }
          #_dc_proactive._dc_right { right: 24px; bottom: 158px; }
        }
      `}</style>

      <Script id="diggiechat-init" strategy="afterInteractive">
        {`
          window.DiggieChat = {
            siteId: ${JSON.stringify(SITE_ID)},
            baseUrl: ${JSON.stringify(BASE_URL)}
          };
          var s = document.createElement('script');
          s.src = ${JSON.stringify(BASE_URL)} + '/widget/chat.js';
          s.async = true;
          document.body.appendChild(s);
        `}
      </Script>
    </>
  );
}
