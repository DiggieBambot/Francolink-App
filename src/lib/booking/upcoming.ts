// The classes a person has coming up, and whether one is on right now.
//
// This exists because a student had no way to reach their own lesson. The
// dashboard's "View Sessions" button pointed at /student/sessions, which
// queried the LEGACY tutor_sessions table filtered by `tutor_id = <the
// student's own id>` — always empty, for every student, forever. The only
// page that has ever linked to a room is /lessons/booked, and the only thing
// that links to THAT is the booking confirmation email.
//
// So the entire route from "I have a lesson" to "I am in it" ran through an
// email a student may have deleted, filed, or never received. Everything here
// is in service of putting that link where they already are.

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { CLASS_CAP_MINUTES, OPEN_EARLY_MINUTES } from "@/lib/lessons/class-window";

export interface UpcomingClass {
  bookingId: string;
  roomId: string | null;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  /** Who you are meeting — the other person, whichever side you are. */
  partnerId: string;
  partnerName: string;
  /** Video is open: within OPEN_EARLY_MINUTES of the start, before the cap. */
  isOpen: boolean;
  /** The scheduled lesson has begun. */
  hasStarted: boolean;
  /** Seconds until the room opens; 0 once it has. */
  opensInSeconds: number;
}

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * Confirmed classes from now (less the grace) onward, soonest first.
 *
 * The window arithmetic is deliberately the SAME as resolveClassWindow's — a
 * dashboard that says "Join now" while the room says "no class on" is worse
 * than a dashboard that says nothing.
 */
export async function getUpcomingClasses(
  userId: string,
  role: "student" | "tutor",
  opts: { limit?: number; now?: Date } = {}
): Promise<UpcomingClass[]> {
  const now = opts.now ?? new Date();
  const db = service();

  // Reach back far enough to still catch a class that is running: the longest
  // room is 60 minutes from its scheduled start.
  const from = new Date(now.getTime() - 60 * 60_000).toISOString();

  const { data } = await db
    .from("bookings")
    .select("id, tutor_id, student_id, room_session_id, starts_at, ends_at, duration_minutes")
    .eq(role === "student" ? "student_id" : "tutor_id", userId)
    .eq("status", "confirmed")
    .gte("starts_at", from)
    .order("starts_at", { ascending: true })
    .limit(opts.limit ?? 10);

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const partnerIds = [
    ...new Set(rows.map((b) => (role === "student" ? b.tutor_id : b.student_id))),
  ];
  const { data: people } = await db
    .from("users")
    .select("id, name, first_name, last_name, email")
    .in("id", partnerIds);
  const nameById = new Map<string, string>();
  for (const p of people ?? []) {
    nameById.set(
      p.id,
      p.name ||
        [p.first_name, p.last_name].filter(Boolean).join(" ") ||
        p.email?.split("@")[0] ||
        (role === "student" ? "Your tutor" : "Your student")
    );
  }

  const t = now.getTime();
  return rows
    .map((b) => {
      const startsAt = new Date(b.starts_at).getTime();
      const cap = CLASS_CAP_MINUTES[b.duration_minutes] ?? b.duration_minutes;
      const opensAt = startsAt - OPEN_EARLY_MINUTES * 60_000;
      const closesAt = startsAt + cap * 60_000;
      const partnerId = role === "student" ? b.tutor_id : b.student_id;
      return {
        bookingId: b.id as string,
        roomId: (b.room_session_id as string) ?? null,
        startsAt: b.starts_at as string,
        endsAt: b.ends_at as string,
        durationMinutes: b.duration_minutes as number,
        partnerId,
        partnerName: nameById.get(partnerId) ?? "Someone",
        isOpen: t >= opensAt && t < closesAt,
        hasStarted: t >= startsAt,
        opensInSeconds: Math.max(0, Math.round((opensAt - t) / 1000)),
      };
    })
    // Drop anything already finished; the reach-back above is only there to
    // catch a class in progress, not to list this morning's.
    .filter((c) => c.isOpen || !c.hasStarted);
}
