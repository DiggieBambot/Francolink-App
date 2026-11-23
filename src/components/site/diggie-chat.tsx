// src/components/site/diggie-chat.tsx
//
// DiggieStack live-chat widget for the marketing website. The config global
// must exist before chat.js runs, so it is set as soon as the page hydrates;
// the widget itself loads lazily (once the browser is idle) so it never
// competes with LCP on the SEO pages.

import Script from "next/script";
import { DIGGIECHAT_SITE_ID as SITE_ID } from "@/lib/diggie-chat";

export function DiggieChat() {
  return (
    <>
      <Script id="diggie-chat-config" strategy="afterInteractive">
        {`window.DiggieChat = { siteId: "${SITE_ID}", color: "#0EA5E9" };`}
      </Script>
      <Script src="https://chat.diggiestack.com/widget/chat.js" strategy="lazyOnload" />
    </>
  );
}
