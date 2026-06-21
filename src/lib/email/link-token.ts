// src/lib/email/link-token.ts
//
// Tiny HMAC signer for one-click email links (unsubscribe). Keeps the link
// tamper-proof without a DB round-trip: the token is HMAC(userId:campaign).
//
// Secret precedence: EMAIL_LINK_SECRET if set, otherwise the service-role key
// (server-only, always present). Never reaches the client.

import { createHmac, timingSafeEqual } from "node:crypto";

function secret(): string {
  const s = process.env.EMAIL_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("EMAIL_LINK_SECRET / SUPABASE_SERVICE_ROLE_KEY not set");
  return s;
}

export function signLinkToken(userId: string, campaign: string): string {
  return createHmac("sha256", secret())
    .update(`${userId}:${campaign}`)
    .digest("base64url");
}

export function verifyLinkToken(userId: string, campaign: string, token: string): boolean {
  const expected = signLinkToken(userId, campaign);
  const a = Buffer.from(expected);
  const b = Buffer.from(token || "");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Absolute unsubscribe URL for a given user + campaign. */
export function unsubscribeUrl(userId: string, campaign: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://app.francolink.net";
  const t = signLinkToken(userId, campaign);
  return `${base}/api/email/unsubscribe?u=${encodeURIComponent(userId)}&c=${encodeURIComponent(campaign)}&t=${t}`;
}
