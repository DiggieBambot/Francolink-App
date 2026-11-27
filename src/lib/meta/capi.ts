// Meta Conversions API (server side).
//
// The browser pixel (components/analytics/meta-pixel.tsx) is blocked by ad
// blockers and Safari's tracking limits, so conversions that matter for ad
// optimisation are also sent from the server. When both sides send the same
// event they share an event_id and Meta keeps one.
//
// Never throws, never blocks for long: a tracking failure must not break a
// signup or a Stripe webhook. A no-op until both env vars are set.
//
//   NEXT_PUBLIC_META_PIXEL_ID   the dataset / pixel id (also used by the browser)
//   META_CAPI_ACCESS_TOKEN      generated in Events Manager > Settings
//   META_TEST_EVENT_CODE        optional; routes events to Test events while set

import { createHash } from "crypto";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const TEST_CODE = process.env.META_TEST_EVENT_CODE;
const API_VERSION = process.env.META_GRAPH_API_VERSION || "v24.0";

/** Filming accounts: never reported as conversions (see demo-accounts memo). */
const EXCLUDED_EMAIL_DOMAINS = ["demo.francolink.net"];

export type MetaEventName = "CompleteRegistration" | "Purchase" | "Subscribe" | "Lead";

/** What we know about the browser that caused the event. */
export interface MetaBrowserContext {
  fbp?: string | null;
  fbc?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

export interface MetaEventInput {
  name: MetaEventName;
  /** Shared with the browser pixel's eventID so Meta deduplicates. */
  eventId: string;
  email?: string | null;
  /** Our user id; hashed before it leaves the server. */
  externalId?: string | null;
  browser?: MetaBrowserContext;
  sourceUrl?: string;
  value?: number;
  currency?: string;
  contentName?: string;
  contentCategory?: string;
}

function sha256(v: string): string {
  return createHash("sha256").update(v.trim().toLowerCase()).digest("hex");
}

export function metaCapiEnabled(): boolean {
  return Boolean(PIXEL_ID && TOKEN);
}

export async function sendMetaEvent(input: MetaEventInput): Promise<void> {
  if (!PIXEL_ID || !TOKEN) return;
  const email = input.email?.trim().toLowerCase();
  if (email && EXCLUDED_EMAIL_DOMAINS.some((d) => email.endsWith(`@${d}`))) return;

  const b = input.browser ?? {};
  const user_data: Record<string, unknown> = {};
  if (email) user_data.em = [sha256(email)];
  if (input.externalId) user_data.external_id = [sha256(input.externalId)];
  if (b.fbp) user_data.fbp = b.fbp;
  if (b.fbc) user_data.fbc = b.fbc;
  if (b.ip) user_data.client_ip_address = b.ip;
  if (b.userAgent) user_data.client_user_agent = b.userAgent;

  const custom_data: Record<string, unknown> = {};
  if (typeof input.value === "number") {
    custom_data.value = Math.round(input.value * 100) / 100;
    custom_data.currency = (input.currency || "usd").toUpperCase();
  }
  if (input.contentName) custom_data.content_name = input.contentName;
  if (input.contentCategory) custom_data.content_category = input.contentCategory;

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: input.name,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        // "website" requires the browser fields; a webhook has none of its own,
        // but checkout carries them over in session metadata.
        action_source: "website",
        event_source_url: input.sourceUrl || process.env.NEXT_PUBLIC_APP_URL || "https://francolink.net",
        user_data,
        ...(Object.keys(custom_data).length ? { custom_data } : {}),
      },
    ],
  };
  if (TEST_CODE) body.test_event_code = TEST_CODE;

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(TOKEN)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(4000),
      },
    );
    if (!res.ok) {
      console.error("[meta-capi]", input.name, res.status, (await res.text()).slice(0, 300));
    }
  } catch (err) {
    console.error("[meta-capi]", input.name, err instanceof Error ? err.message : err);
  }
}

// ---------------------------------------------------------------------------
// Browser context from a request
// ---------------------------------------------------------------------------

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export function metaContextFromRequest(req: Request): MetaBrowserContext {
  const h = req.headers;
  const cookie = h.get("cookie");
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  return {
    fbp: readCookie(cookie, "_fbp"),
    fbc: readCookie(cookie, "_fbc"),
    ip,
    userAgent: h.get("user-agent"),
  };
}

/**
 * Stripe Checkout metadata carrying the buyer's browser context, so the
 * webhook (which has no browser) can still send a matchable Purchase.
 * Spread into the session's `metadata`. Stripe caps values at 500 chars.
 */
export function metaCheckoutMetadata(req: Request): Record<string, string> {
  const c = metaContextFromRequest(req);
  const out: Record<string, string> = {};
  if (c.fbp) out.meta_fbp = c.fbp.slice(0, 500);
  if (c.fbc) out.meta_fbc = c.fbc.slice(0, 500);
  if (c.ip) out.meta_ip = c.ip.slice(0, 500);
  if (c.userAgent) out.meta_ua = c.userAgent.slice(0, 500);
  return out;
}

export function metaContextFromMetadata(
  m: Record<string, string> | null | undefined,
): MetaBrowserContext {
  return {
    fbp: m?.meta_fbp || null,
    fbc: m?.meta_fbc || null,
    ip: m?.meta_ip || null,
    userAgent: m?.meta_ua || null,
  };
}
