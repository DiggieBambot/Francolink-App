// A student's lessons — the ones they have actually booked.
//
// What this replaces: a page that queried the LEGACY tutor_sessions table
// filtered by `tutor_id = user.id`. On a student's account that predicate is
// empty by construction, so every student who ever pressed "View Sessions" on
// their dashboard got an empty page — and since /lessons/booked is linked from
// nothing but the confirmation email, this was the end of the only path they
// had to their own class.
//
// Bookings are the real table. tutor_sessions is a different, older scheduling
// flow (tutor creates a session and assigns students) that this page was
// pointed at by inheritance rather than by intent.

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUpcomingClasses } from "@/lib/booking/upcoming";
import { UpcomingClasses } from "@/components/dashboard/upcoming-classes";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { CalendarClock, History } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentSessionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/student/sessions");

  const upcoming = await getUpcomingClasses(user.id, "student", { limit: 20 });

  // Past lessons, so the page is a record and not only a diary. Service client:
  // a student reading their booking's tutor crosses an RLS boundary.
  const svc = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  const { data: past } = await svc
    .from("bookings")
    .select("id, starts_at, duration_minutes, status, tutor_id")
    .eq("student_id", user.id)
    .in("status", ["completed", "no_show_student", "no_show_tutor"])
    .order("starts_at", { ascending: false })
    .limit(20);

  const tutorIds = [...new Set((past ?? []).map((b) => b.tutor_id))];
  const nameById = new Map<string, string>();
  if (tutorIds.length > 0) {
    const { data: tutors } = await svc
      .from("users")
      .select("id, name, email")
      .in("id", tutorIds);
    for (const t of tutors ?? []) {
      nameById.set(t.id, t.name || t.email?.split("@")[0] || "Your tutor");
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">My lessons</h1>

      <UpcomingClasses classes={upcoming} role="student" />

      {upcoming.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-soft">
          <CalendarClock className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="text-sm font-semibold text-gray-900">No lessons booked</p>
          <p className="mt-1 text-sm text-gray-500">
            Book one and it will appear here, with a button to join when it starts.
          </p>
          <Link
            href="/tutors"
            className="mt-4 inline-flex h-10 items-center rounded-full bg-primary-500 px-5 text-sm font-semibold text-white transition hover:bg-primary-600"
          >
            Find a tutor
          </Link>
        </div>
      ) : null}

      {(past ?? []).length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
            <History className="h-4 w-4 text-gray-400" />
            Past lessons
          </h2>
          <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white shadow-soft">
            {(past ?? []).map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {new Date(b.starts_at).toLocaleString([], {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {nameById.get(b.tutor_id) ?? "Your tutor"} · {b.duration_minutes} min
                  </p>
                </div>
                {b.status !== "completed" ? (
                  <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500">
                    {b.status === "no_show_student" ? "Missed" : "Tutor absent"}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
