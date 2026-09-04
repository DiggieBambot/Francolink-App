// Video for the lesson room, on Daily.
//
// Why a provider at all: building WebRTC ourselves is months of work and a
// permanent maintenance burden, and the hard parts are not the parts that look
// hard. Device pickers, permission prompts, "your mic is muted", recovering
// from a dropped network — that is where the hours go, and it is what a
// student blames the platform for when it breaks.
//
// Why Daily rather than Google Meet: the lesson does not happen on a video
// call, it happens in OUR room, next to the whiteboard, the lesson content,
// the homework and the AI tutor. Sending people to Meet would abandon all of
// it the moment class starts.
//
// One Daily room per lesson session, named after the session id so it is
// idempotent — creating it twice is not an error, and we never have to store
// a mapping.

const API = "https://api.daily.co/v1";

/**
 * Fallback lifetime for a room with no scheduled class — an independent
 * tutor's own classroom, which has no booking to derive a deadline from.
 */
const ROOM_TTL_SECONDS = 4 * 60 * 60;

/** Fallback token lifetime, used on the same unscheduled rooms. */
const TOKEN_TTL_SECONDS = 4 * 60 * 60;

/**
 * Grace on the ROOM's own expiry, past the class deadline.
 *
 * The token is the hard stop — it is per-person and cut exactly at
 * hardEndsAt. The room outlives it by a minute so that the last seconds of a
 * class are ended by "your token expired", which the client handles as a clean
 * leave, rather than by the room vanishing under everyone at once.
 */
const ROOM_GRACE_SECONDS = 60;

export class DailyNotConfigured extends Error {
  constructor() {
    super("DAILY_API_KEY is not set");
    this.name = "DailyNotConfigured";
  }
}

function key(): string {
  const k = process.env.DAILY_API_KEY;
  if (!k) throw new DailyNotConfigured();
  return k;
}

async function daily(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Daily ${init?.method ?? "GET"} ${path} -> ${res.status} ${body}`);
  }
  return res.json();
}

/** Daily room names allow letters, digits, dash and underscore. */
function roomName(sessionId: string): string {
  return `lesson-${sessionId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

/**
 * The room for a session, created on first use.
 *
 * `privacy: private` matters: without a token nobody can join, so a leaked
 * room URL on its own is not a way into somebody's lesson. Membership is
 * decided by us, in lesson_room_participants, and expressed as a token.
 */
export async function ensureRoom(sessionId: string, hardEndsAt?: Date | null): Promise<string> {
  const name = roomName(sessionId);
  // A scheduled class expires with the class. Everything else keeps the flat
  // TTL, refreshed on entry, because there is no deadline to derive.
  const expiry = hardEndsAt
    ? Math.floor(hardEndsAt.getTime() / 1000) + ROOM_GRACE_SECONDS
    : Math.floor(Date.now() / 1000) + ROOM_TTL_SECONDS;

  try {
    const existing = await daily(`/rooms/${name}`);
    const exp = existing?.config?.exp as number | undefined;

    // An expired Daily room still answers GET but refuses joins, so returning
    // it unchanged would break video permanently for any session older than
    // the TTL — and it would fail as a long hang, not a clear error. Push the
    // expiry out instead of recreating: the room name is derived from the
    // session, so the same room is the right one for the whole lesson.
    // Push the expiry when it is about to lapse, and also whenever a class
    // deadline says a different instant — a booking that moved must move the
    // room with it, in both directions.
    const needsPush = !exp || exp * 1000 < Date.now() + 5 * 60_000 || exp !== expiry;
    if (needsPush) {
      await daily(`/rooms/${name}`, {
        method: "POST",
        body: JSON.stringify({ properties: { exp: expiry } }),
      });
    }

    return existing.url as string;
  } catch {
    // Not found (or unreadable) — fall through and create it.
  }

  const created = await daily("/rooms", {
    method: "POST",
    body: JSON.stringify({
      name,
      privacy: "private",
      properties: {
        exp: expiry,
        // A 1:1 lesson. Group rooms raise this from the session row.
        max_participants: 10,
        enable_screenshare: true,
        enable_chat: false, // the room has its own chat, tied to the lesson
        start_video_off: false,
        start_audio_off: false,
      },
    }),
  });

  return created.url as string;
}

/**
 * A join token for one person.
 *
 * `is_owner` is given to the tutor: it is what allows them to mute or eject a
 * participant, which is the one moderation power a teacher genuinely needs.
 */
export async function meetingToken(opts: {
  sessionId: string;
  userId: string;
  userName: string;
  isTutor: boolean;
  /**
   * The class deadline, for a room that has one. This is THE enforcement of
   * the time cap: a browser clock can be wrong or lied to, and a client-side
   * countdown can be stopped with devtools, but Daily refuses a token past its
   * exp and drops the participant when it lapses mid-call.
   */
  hardEndsAt?: Date | null;
}): Promise<string> {
  const res = await daily("/meeting-tokens", {
    method: "POST",
    body: JSON.stringify({
      properties: {
        room_name: roomName(opts.sessionId),
        user_id: opts.userId,
        user_name: opts.userName,
        is_owner: opts.isTutor,
        exp: opts.hardEndsAt
          ? Math.floor(opts.hardEndsAt.getTime() / 1000)
          : Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
      },
    }),
  });

  return res.token as string;
}
