"use client";

// Fire-once TikTok events for server-rendered pages. See lib/site/tiktok.ts.

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { WORKBOOK_CONTENT, ttqIdentifyEmail, ttqTrack } from "@/lib/site/tiktok";

/** Page views after client-side navigation; the base code counts the first. */
export function TikTokPageViews() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    window.ttq?.page();
  }, [pathname]);
  return null;
}

/** The workbook sales page was viewed. */
export function TikTokViewContent() {
  useEffect(() => {
    ttqTrack("ViewContent", { contents: [WORKBOOK_CONTENT], value: 27, currency: "USD" });
  }, []);
  return null;
}

/**
 * A completed purchase, on the download page when the buyer arrives from
 * Stripe. The order id is the event id, and a per-tab flag stops a refresh
 * from counting the sale twice.
 */
export function TikTokPurchase({
  orderId,
  value,
  currency,
  email,
  hasAudio,
}: {
  orderId: string;
  value: number;
  currency: string;
  email: string;
  hasAudio: boolean;
}) {
  useEffect(() => {
    const key = `ttq-purchase-${orderId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* storage blocked: the event id still lets TikTok dedupe */
    }
    void ttqIdentifyEmail(email).then(() =>
      ttqTrack(
        "CompletePayment",
        {
          contents: [
            WORKBOOK_CONTENT,
            ...(hasAudio
              ? [{ content_id: "audio_fpp", content_type: "product", content_name: "Audio pack" }]
              : []),
          ],
          value,
          currency,
        },
        orderId
      )
    );
  }, [orderId, value, currency, email, hasAudio]);
  return null;
}
