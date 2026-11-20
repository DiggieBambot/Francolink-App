// src/lib/email/resend.ts
//
// Single Resend client + tiny helpers used by transactional email senders.
// Reads RESEND_API_KEY from the environment. Throws clearly if the key is
// missing, so calling code doesn't silently no-op.

import { Resend } from "resend";
import { isDemoEmail } from "@/lib/demo";

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
  // Demo accounts use a domain with no mailbox: drop them from every send so
  // filming the dashboards never emails anyone or bounces.
  const send = cached.emails.send.bind(cached.emails);
  cached.emails.send = (async (payload, options) => {
    const to = [payload.to].flat().filter((e) => !isDemoEmail(e));
    if (to.length === 0) return { data: { id: "demo-skipped" }, error: null, headers: null };
    return send({ ...payload, to } as typeof payload, options);
  }) as typeof cached.emails.send;
  return cached;
}

/** Default From: header used by re-engagement and welcome emails. */
export const DEFAULT_FROM = "Francolink Team <support@francolink.net>";
