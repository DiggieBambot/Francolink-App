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

/** Lessons are 50 minutes; the room outlives that comfortably then expires. */
const ROOM_TTL_SECONDS = 4 * 60 * 60;

/** A token is for one person joining one room, and is short-lived. */
const TOKEN_TTL_SECONDS = 4 * 60 * 60;

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
export async function ensureRoom(sessionId: string): Promise<string> {
  const name = roomName(sessionId);

  try {
    const existing = await daily(`/rooms/${name}`);
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
        exp: Math.floor(Date.now() / 1000) + ROOM_TTL_SECONDS,
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
}): Promise<string> {
  const res = await daily("/meeting-tokens", {
    method: "POST",
    body: JSON.stringify({
      properties: {
        room_name: roomName(opts.sessionId),
        user_id: opts.userId,
        user_name: opts.userName,
        is_owner: opts.isTutor,
        exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
      },
    }),
  });

  return res.token as string;
}
