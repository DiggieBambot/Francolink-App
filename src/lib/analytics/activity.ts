// Server-only activity capture. Writes to the user_activity event log with the
// service role so it works from any authenticated route. Fire-and-forget — never
// throws into the caller's happy path.

import { createClient } from "@supabase/supabase-js";

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export type ActivityKind =
  | "active"          // daily heartbeat ping
  | "login"
  | "signup"
  | "lesson_view"
  | "homework_submit"
  | "homework_assign"
  | "class_request"
  | "room_join";

interface LogOpts {
  path?: string | null;
  metadata?: Record<string, unknown>;
}

/** Append one activity event. Never throws. */
export async function logActivity(userId: string, kind: ActivityKind, opts: LogOpts = {}): Promise<void> {
  if (!userId) return;
  try {
    await svc().from("user_activity").insert({
      user_id: userId,
      kind,
      path: opts.path ?? null,
      metadata: opts.metadata ?? null,
    });
  } catch (e) {
    console.error("[activity] log failed:", (e as Error).message);
  }
}

/** Update last_seen_at, and record one 'active' event per user per day. */
export async function heartbeat(userId: string): Promise<void> {
  if (!userId) return;
  const s = svc();
  try {
    const { data: u } = await s.from("users").select("last_seen_at").eq("id", userId).maybeSingle();
    const now = new Date();
    const lastSeen = u?.last_seen_at ? new Date(u.last_seen_at) : null;
    const isNewDay = !lastSeen || lastSeen.toISOString().slice(0, 10) !== now.toISOString().slice(0, 10);

    await s.from("users").update({ last_seen_at: now.toISOString() }).eq("id", userId);
    if (isNewDay) {
      await s.from("user_activity").insert({ user_id: userId, kind: "active" });
    }
  } catch (e) {
    console.error("[activity] heartbeat failed:", (e as Error).message);
  }
}
