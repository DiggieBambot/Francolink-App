"use client";

// Mounts the DiggieChat widget in its default floating mode: a launcher pinned
// bottom-right that opens a slide-out panel over the page.
//
// Rendered only when NEXT_PUBLIC_DIGGIECHAT_SITE_ID is set.

import { useEffect } from "react";
import { DIGGIECHAT_SITE_ID, loadDiggieChat } from "@/lib/diggie-chat";

export function DiggieChat() {
  useEffect(() => {
    if (!DIGGIECHAT_SITE_ID) return;
    loadDiggieChat().catch(() => {
      /* widget unavailable — the rest of the page is unaffected */
    });
  }, []);

  if (!DIGGIECHAT_SITE_ID) return null;

  // The widget pins itself to bottom-right, where AITutorFab and the mobile
  // bottom nav already live. Lift and inset it so the launchers stack instead
  // of overlapping.
  return (
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
  );
}
