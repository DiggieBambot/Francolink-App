// Data behind the admin Tutors panel.
//
// One place that answers, for every tutor: who are they, is their listing
// live, what tier are they on, and are they actually teaching anyone. The
// counts come from a handful of bulk reads grouped in memory rather than a
// query per tutor — at ~120 tutors that's one round trip instead of ~500.

import { createClient } from "@supabase/supabase-js";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export interface AdminTutor {
  id: string;
  name: string | null;
  email: string;
  role: string;
  invite_code: string | null;
  timezone: string | null;
  created_at: string | null;
  last_activity_date: string | null;

  // Listing (null when they have never created one).
  slug: string | null;
  tier: string | null;
  approval_status: string | null;
  is_public: boolean;
  accepts_bookings: boolean;
  has_photo: boolean;
  availability_slots: number;

  // Activity.
  students: number;
  rooms: number;
  homework: number;

  /** True when the listing is visible to the public right now. */
  live: boolean;
}

export interface AdminApplication {
  id: string;
  full_name: string;
  email: string;
  country: string | null;
  timezone: string | null;
  teaches: string[] | null;
  levels: string[] | null;
  years_experience: number | null;
  weekly_hours: number | null;
  qualifications: string | null;
  about: string;
  link: string | null;
  status: string;
  proposed_tier: string | null;
  review_notes: string | null;
  created_user_id: string | null;
  /** Set when the application came from a signed-in tutor, not the website. */
  applicant_user_id: string | null;
  source: string | null;
  created_at: string;
}

export interface TutorPanelData {
  tutors: AdminTutor[];
  applications: AdminApplication[];
  stats: {
    tutors: number;
    live: number;
    pendingReview: number;
    openApplications: number;
    teaching: number;
  };
}

/** Counts rows per key from a list of {key} objects. */
function tally<T extends Record<string, unknown>>(rows: T[] | null, key: keyof T) {
  const out = new Map<string, number>();
  for (const r of rows ?? []) {
    const k = r[key] as string | null;
    if (!k) continue;
    out.set(k, (out.get(k) ?? 0) + 1);
  }
  return out;
}

export async function getTutorPanelData(): Promise<TutorPanelData> {
  const db = serviceClient();

  const [
    { data: users },
    { data: profiles },
    { data: applications },
    { data: connections },
    { data: rooms },
    { data: homework },
    { data: availability },
  ] = await Promise.all([
    db
      .from("users")
      .select("id, name, email, role, tutor_invite_code, timezone, created_at, last_activity_date")
      .in("role", ["TUTOR", "ADMIN"])
      .order("name", { ascending: true }),
    db.from("tutor_public_profiles").select("*"),
    db
      .from("tutor_applications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300),
    db.from("tutor_students").select("tutor_id").eq("status", "active"),
    db.from("tutor_lesson_sessions").select("tutor_id"),
    db.from("homework_assignments").select("tutor_id"),
    db.from("tutor_availability").select("tutor_id"),
  ]);

  const byUser = new Map<string, Record<string, unknown>>();
  for (const p of profiles ?? []) byUser.set(p.user_id as string, p);

  const students = tally(connections, "tutor_id");
  const roomCount = tally(rooms, "tutor_id");
  const homeworkCount = tally(homework, "tutor_id");
  const slotCount = tally(availability, "tutor_id");

  const tutors: AdminTutor[] = (users ?? []).map((u) => {
    const p = byUser.get(u.id);
    const approval = (p?.approval_status as string) ?? null;
    const isPublic = Boolean(p?.is_public);
    const acceptsBookings = Boolean(p?.accepts_bookings);

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: (u.role || "").toUpperCase(),
      invite_code: u.tutor_invite_code,
      timezone: u.timezone,
      created_at: u.created_at,
      last_activity_date: u.last_activity_date,

      slug: (p?.slug as string) ?? null,
      tier: (p?.tier as string) ?? null,
      approval_status: approval,
      is_public: isPublic,
      accepts_bookings: acceptsBookings,
      has_photo: Boolean(p?.photo_url),
      availability_slots: slotCount.get(u.id) ?? 0,

      students: students.get(u.id) ?? 0,
      rooms: roomCount.get(u.id) ?? 0,
      homework: homeworkCount.get(u.id) ?? 0,

      // All three gates must be open for the public directory to show them.
      live: approval === "approved" && isPublic && acceptsBookings,
    };
  });

  const apps = (applications ?? []) as AdminApplication[];

  return {
    tutors,
    applications: apps,
    stats: {
      tutors: tutors.length,
      live: tutors.filter((t) => t.live).length,
      pendingReview: tutors.filter((t) => t.approval_status === "pending").length,
      openApplications: apps.filter((a) =>
        ["new", "reviewing", "interviewing"].includes(a.status)
      ).length,
      teaching: tutors.filter((t) => t.students > 0).length,
    },
  };
}
