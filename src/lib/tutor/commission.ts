// Who earns commission on a student — one rule, one place.
//
// `users.referred_by_tutor_id` is the commission field: the Stripe webhook and
// the lesson-plan referral bounty both pay whoever it names. It is set ONLY
// when the student came in through a tutor's private invite code — a link or
// code the tutor themselves handed out. That is the tutor bringing a student
// to FrancoLink, which is what commission pays for.
//
// Everything else connects the student without attributing them:
//   - the public profile / directory slug (/join/<slug>, "Register free"),
//   - booking a lesson from the marketplace (lib/booking/confirm.ts),
//   - a tutor accepting a pending request (the request's own join decided it).
// Those students found FrancoLink, and the tutor, on their own.
//
// First touch still wins among invites: once set it is never overwritten, so a
// student invited by a second tutor later doesn't move the commission.
//
// "Who is this student's tutor" is NOT this field. A student can have many
// teachers; that is tutor_students (status 'active'). See primaryTutorId().

import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { JoinTarget } from "@/lib/auth/join-target";

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * Attribute `studentId` to the tutor for commission, if and only if they
 * joined through that tutor's invite code and nobody holds the attribution
 * yet. Returns true when it wrote the attribution. Throws on a write error so
 * callers can decide whether that fails the join.
 */
export async function attributeCommission(
  studentId: string,
  tutorId: string,
  via: JoinTarget["via"]
): Promise<boolean> {
  if (via !== "invite") return false;
  if (!studentId || !tutorId || studentId === tutorId) return false;

  const db = svc();
  const { data: student } = await db
    .from("users")
    .select("referred_by_tutor_id")
    .eq("id", studentId)
    .maybeSingle();
  if (student?.referred_by_tutor_id) return false;

  const { error } = await db
    .from("users")
    .update({ referred_by_tutor_id: tutorId, updated_at: new Date().toISOString() })
    .eq("id", studentId)
    .is("referred_by_tutor_id", null); // a concurrent invite can't be overwritten
  if (error) throw error;
  return true;
}

/**
 * The tutor to treat as "this student's tutor" where only one makes sense
 * (a class request with no tutor named, the class leaderboard). Prefers the
 * commission tutor when they are still an active connection, otherwise the
 * most recent active connection. Null when the student has no active tutor.
 */
export async function primaryTutorId(studentId: string): Promise<string | null> {
  const db = svc();
  const [{ data: me }, { data: links }] = await Promise.all([
    db.from("users").select("referred_by_tutor_id").eq("id", studentId).maybeSingle(),
    db
      .from("tutor_students")
      .select("tutor_id, assigned_at")
      .eq("student_id", studentId)
      .eq("status", "active")
      .order("assigned_at", { ascending: false }),
  ]);
  const active = (links || []).map((l) => l.tutor_id as string).filter((id) => id && id !== studentId);
  if (me?.referred_by_tutor_id && active.includes(me.referred_by_tutor_id)) return me.referred_by_tutor_id;
  return active[0] ?? null;
}
