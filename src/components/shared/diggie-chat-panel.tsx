"use client";

// Docks the DiggieChat panel into a host container instead of letting it float.
// Used by the lesson room tools rail so the AI assistant sits beside the
// material, Engoo-classroom style.
//
// The widget owns a single panel element, so only one DiggieChatPanel can be
// docked at a time. On unmount the panel returns to the floating launcher.

import { useEffect, useRef, useState } from "react";
import {
  DIGGIECHAT_SITE_ID,
  loadDiggieChat,
  type DiggieChatApi,
} from "@/lib/diggie-chat";

export function DiggieChatPanel() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!DIGGIECHAT_SITE_ID) return;

    let api: DiggieChatApi | null = null;
    let cancelled = false;

    loadDiggieChat()
      .then((a) => {
        if (cancelled || !hostRef.current) return;
        api = a;
        a.mount(hostRef.current);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
      api?.unmount();
    };
  }, []);

  if (!DIGGIECHAT_SITE_ID) {
    return (
      <p className="mt-6 px-4 text-center text-xs text-slate-400">
        AI assistant is not configured.
      </p>
    );
  }

  if (error) {
    return (
      <p className="mt-6 px-4 text-center text-xs text-slate-400">
        Could not load the AI assistant.
      </p>
    );
  }

  // Fills the rail; the widget's docked CSS makes the panel 100% of this box.
  return <div ref={hostRef} className="h-full w-full overflow-hidden" />;
}
