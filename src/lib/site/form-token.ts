// Proof that a public form was actually rendered before it was submitted.
//
// The honeypot only catches bots that fill in the hidden field. The ones
// hitting francolink.net were POSTing straight at the API and never loading a
// page at all, so they never saw the honeypot — 44 of the first 45 waitlist
// signups were junk.
//
// The fix: every public form fetches a short-lived signed token on mount and
// sends it back. A script that skips the page has no token and is rejected.
// This is not a CAPTCHA and won't stop a determined attacker who fetches a
// token first — it stops indiscriminate drive-by posting, which is what this
// actually is.

import { createHmac, timingSafeEqual } from "node:crypto";

// Reuse an existing server secret rather than adding another env var to
// manage. Nothing derived from it is ever exposed — only the HMAC is.
function secret(): string {
  return (
    process.env.FORM_TOKEN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "francolink-form-token-fallback"
  );
}

/** Submitting faster than this means nobody read the form. */
const MIN_AGE_MS = 2_000;
/** Tokens go stale so one can't be minted and reused for a spam run. */
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** `<issuedAtMs>.<hmac>` */
export function issueFormToken(now = Date.now()): string {
  const ts = String(now);
  return `${ts}.${sign(ts)}`;
}

export type TokenVerdict = "ok" | "missing" | "malformed" | "bad-signature" | "too-fast" | "expired";

export function verifyFormToken(token: unknown, now = Date.now()): TokenVerdict {
  if (typeof token !== "string" || token.length === 0) return "missing";

  const [ts, mac] = token.split(".");
  if (!ts || !mac || !/^\d+$/.test(ts)) return "malformed";

  const expected = sign(ts);
  // Constant-time compare; lengths must match first or timingSafeEqual throws.
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return "bad-signature";

  const age = now - Number(ts);
  if (age < MIN_AGE_MS) return "too-fast";
  if (age > MAX_AGE_MS) return "expired";

  return "ok";
}

/**
 * True when the submission looks like a person.
 *
 * Deliberately returns a plain boolean for callers that just want to drop the
 * request — the specific verdict is for logging, not for telling the sender
 * which check they failed.
 */
export function looksHuman(token: unknown, now = Date.now()): boolean {
  return verifyFormToken(token, now) === "ok";
}
