// Thin Google OAuth + Calendar API client over fetch — no googleapis
// dependency for the four calls we make.
//
// Scopes are the narrowest that do the job, because each one is listed on the
// consent screen and justified in Google's verification review:
//   calendar.events   — create/update/delete the lesson events we own
//   calendar.freebusy — busy/free blocks only; never event titles or details
//   email             — so the settings page can say which account is linked
//
// Calendar access is asked for only when a tutor clicks "Connect Google
// Calendar" — the normal Google sign-in is untouched, so students never see a
// calendar consent screen.

import { APP_URL } from "@/lib/site/hosts";

export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.freebusy",
];

export const REDIRECT_PATH = "/api/calendar/google/callback";

function clientId() {
  const v = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!v) throw new Error("GOOGLE_OAUTH_CLIENT_ID is not set");
  return v;
}
function clientSecret() {
  const v = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!v) throw new Error("GOOGLE_OAUTH_CLIENT_SECRET is not set");
  return v;
}

export function isGoogleCalendarConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
      process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
      process.env.GOOGLE_TOKEN_ENCRYPTION_KEY
  );
}

export function redirectUri(): string {
  return `${APP_URL}${REDIRECT_PATH}`;
}

export function authorizeUrl(state: string, loginHint?: string): string {
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    // offline + consent: Google only returns a refresh token on a fresh
    // consent, and without one the sync stops when the hour-long access token
    // expires.
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  if (loginHint) params.set("login_hint", loginHint);
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/** Raised when Google says the refresh token is no longer any good. */
export class GoogleAuthRevoked extends Error {}

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  id_token?: string;
}

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId(),
      client_secret: clientSecret(),
      ...body,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (data?.error === "invalid_grant") throw new GoogleAuthRevoked(data.error_description || "invalid_grant");
    throw new Error(`Google token error ${res.status}: ${data?.error || "unknown"}`);
  }
  return data as TokenResponse;
}

export function exchangeCode(code: string) {
  return tokenRequest({ code, grant_type: "authorization_code", redirect_uri: redirectUri() });
}

/**
 * Access tokens are cached per process for most of their hour, so a page that
 * computes slots for one tutor doesn't refresh on every request.
 */
const accessCache = new Map<string, { token: string; until: number }>();

export async function accessTokenFor(userId: string, refreshToken: string): Promise<string> {
  const hit = accessCache.get(userId);
  if (hit && hit.until > Date.now()) return hit.token;
  const t = await tokenRequest({ refresh_token: refreshToken, grant_type: "refresh_token" });
  accessCache.set(userId, { token: t.access_token, until: Date.now() + (t.expires_in - 120) * 1000 });
  return t.access_token;
}

export function forgetAccessToken(userId: string) {
  accessCache.delete(userId);
}

export async function revokeToken(token: string): Promise<void> {
  await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
    method: "POST",
  }).catch(() => {});
}

/** Reads the email claim out of an id_token we just received from Google over TLS. */
export function emailFromIdToken(idToken: string | undefined): string | null {
  if (!idToken) return null;
  try {
    const payload = JSON.parse(Buffer.from(idToken.split(".")[1], "base64url").toString("utf8"));
    return typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------- Calendar API ---- */

const API = "https://www.googleapis.com/calendar/v3";

export class GoogleApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function api(token: string, path: string, init: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    // Never let a slow Google stall a student's booking page for long.
    signal: init.signal ?? AbortSignal.timeout(8000),
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new GoogleApiError(res.status, data?.error?.message || `Google Calendar error ${res.status}`);
  }
  return data;
}

export interface GoogleEventBody {
  id?: string;
  summary: string;
  description: string;
  location: string;
  start: { dateTime: string };
  end: { dateTime: string };
  source?: { title: string; url: string };
  extendedProperties?: { private: Record<string, string> };
  reminders?: { useDefault: boolean };
}

export async function upsertEvent(token: string, calendarId: string, eventId: string, body: GoogleEventBody) {
  const cal = encodeURIComponent(calendarId);
  try {
    // PUT first: the common case after the first sync is an update.
    return await api(token, `/calendars/${cal}/events/${eventId}?sendUpdates=none`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  } catch (e) {
    if (!(e instanceof GoogleApiError) || (e.status !== 404 && e.status !== 410)) throw e;
  }
  try {
    return await api(token, `/calendars/${cal}/events?sendUpdates=none`, {
      method: "POST",
      body: JSON.stringify({ ...body, id: eventId }),
    });
  } catch (e) {
    // 409: the id exists but was deleted by the tutor in Google (ids can't be
    // reused until purged). PUT with status confirmed restores it.
    if (e instanceof GoogleApiError && e.status === 409) {
      return api(token, `/calendars/${cal}/events/${eventId}?sendUpdates=none`, {
        method: "PUT",
        body: JSON.stringify({ ...body, status: "confirmed" }),
      });
    }
    throw e;
  }
}

export async function deleteEvent(token: string, calendarId: string, eventId: string) {
  try {
    await api(token, `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}?sendUpdates=none`, {
      method: "DELETE",
    });
  } catch (e) {
    // Already gone — the tutor deleted it, or a retry beat us to it.
    if (e instanceof GoogleApiError && (e.status === 404 || e.status === 410)) return;
    throw e;
  }
}

export async function freeBusy(
  token: string,
  calendarId: string,
  timeMin: Date,
  timeMax: Date
): Promise<{ start: Date; end: Date }[]> {
  const data = await api(token, "/freeBusy", {
    method: "POST",
    body: JSON.stringify({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: calendarId }],
    }),
  });
  const cal = data?.calendars?.[calendarId];
  if (cal?.errors?.length) throw new GoogleApiError(400, cal.errors[0].reason || "freeBusy error");
  return ((cal?.busy ?? []) as { start: string; end: string }[]).map((b) => ({
    start: new Date(b.start),
    end: new Date(b.end),
  }));
}
