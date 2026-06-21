// src/lib/email/resend.ts
//
// Single Resend client + tiny helpers used by transactional email senders.
// Reads RESEND_API_KEY from the environment. Throws clearly if the key is
// missing, so calling code doesn't silently no-op.

import { Resend } from "resend";

let cached: Resend | null = null;

export function getResend(): Resend {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error(
      "RESEND_API_KEY is not set. Add it to .env.local (and the Vercel env) before sending email."
    );
  }
  cached = new Resend(key);
  return cached;
}

/** Default From: header used by re-engagement and welcome emails. */
export const DEFAULT_FROM = "Tutor Njinu <njinu@francolink.net>";
