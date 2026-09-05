// /tutor/sessions/new — pick a student + a published tutor_lesson, create a
// tutor_lesson_sessions row, redirect to /room/[id].

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Sparkles } from "lucide-react";
import { sendLiveClassInvite } from "@/lib/notifications/live-invite";
import { MAX_GROUP_LEARNERS } from "@/lib/lessons/room-limits";
import { tutorCanRunGroups } from "@/lib/lessons/group-access";

export const dynamic = "force-dynamic";

async function createSessionAction(formData: FormData) {
  "use server";
  // getAll: the group form submits one student_id per checked learner.
  const studentIds = formData
    .getAll("student_id")
    .map((v) => String(v))
    .filter(Boolean);
  const lessonId = String(formData.get("lesson_id") || "");
  const title = String(formData.get("title") || "").trim() || null;
  if (studentIds.length === 0 || !lessonId) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const fail = (msg: string) =>
    redirect(`/tutor/sessions/new?error=${encodeURIComponent(msg)}`);

  if (studentIds.length > MAX_GROUP_LEARNERS) {
    fail(`A group class holds at most ${MAX_GROUP_LEARNERS} students.`);
  }

  // Every student must actually be this tutor's. The form only ever offers
  // their own, but the form is not the security boundary.
  const { data: mine } = await supabase
    .from("tutor_students")
    .select("student_id")
    .eq("tutor_id", user.id)
    .eq("status", "active")
    .in("student_id", studentIds);
  if ((mine?.length || 0) !== studentIds.length) {
    fail("One of those students is not assigned to you.");
  }

  const isGroup = studentIds.length > 1;

  // Group classes are a professional-tier feature. Checked server-side: the
  // form hides the control for everyone else, but that is presentation only.
  if (isGroup && !(await tutorCanRunGroups(user.id))) {
    fail("Group classes are available on the Professional tier.");
  }

  const { data: inserted, error } = await supabase
    .from("tutor_lesson_sessions")
    .insert({
      tutor_id: user.id,
      // A group has no single student. student_id is not nullable, so it holds
      // the established "no claimed student" sentinel: the tutor's own id.
      student_id: isGroup ? user.id : studentIds[0],
      tutor_lesson_id: lessonId,
      title,
      status: "active",
      is_group: isGroup,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !inserted) {
    fail(error?.message || "create failed");
  }

  // A 1:1 session gets its participant rows from the seeding trigger. A group
  // has to name its learners explicitly.
  if (isGroup) {
    const { error: partErr } = await supabase.from("lesson_room_participants").insert(
      studentIds.map((id) => ({
        session_id: inserted!.id,
        user_id: id,
        role: "student",
      }))
    );
    if (partErr) {
      fail(
        partErr.message.includes("session_full")
          ? `A group class holds at most ${MAX_GROUP_LEARNERS} students.`
          : partErr.message
      );
    }
  }

  // Ring everyone before we leave — redirect() throws, so it must come first.
  const { data: lesson } = await supabase
    .from("tutor_lessons")
    .select("title")
    .eq("id", lessonId)
    .maybeSingle();
  await Promise.all(
    studentIds.map((studentId) =>
      sendLiveClassInvite({
        tutorId: user.id,
        studentId,
        roomId: inserted!.id,
        lessonTitle: title || lesson?.title || null,
      })
    )
  );

  redirect(`/room/${inserted!.id}`);
}

export default async function NewSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; lesson?: string }>;
}) {
  const { error, lesson: lessonSlug } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/tutor/sessions/new");

  const canRunGroups = await tutorCanRunGroups(user.id);

  // Pull this tutor's students.
  const { data: students } = await supabase
    .from("tutor_students")
    .select("student_id, status, users:student_id(id, name, email)")
    .eq("tutor_id", user.id)
    .eq("status", "active");

  // Pull published lessons.
  const { data: lessons, error: lessonsErr } = await supabase
    .from("tutor_lessons")
    .select("id, slug, title, level, language, duration_minutes, topic_tags")
    .eq("status", "published")
    .order("level")
    .order("title");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/tutor/sessions"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to sessions
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Start a new session</h1>
        <p className="text-sm text-slate-600">
          Pick a student and a published lesson. You&apos;ll land in the live room.
        </p>
      </div>

      {error ? (
        <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {decodeURIComponent(error)}
        </div>
      ) : null}

      {lessonsErr?.code === "PGRST205" ? (
        <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Database not initialised.</p>
          <p className="mt-1">
            Apply <code>supabase/migrations/COMBINED.sql</code> in the Supabase dashboard first.
            See <code>supabase/APPLY_DB.md</code>.
          </p>
        </div>
      ) : null}

      <form action={createSessionAction} className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {canRunGroups ? "Students" : "Student"}
          </label>
          {students && students.length > 0 ? (
            canRunGroups ? (
              <>
                <p className="mb-2 text-xs text-slate-500">
                  Tick one student for a private lesson, or up to {MAX_GROUP_LEARNERS} for
                  a group class. Everyone you tick gets rung when the room opens.
                </p>
                <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-slate-200 p-2">
                  {students.map((s) => {
                    const u = s.users as unknown as {
                      id: string;
                      name?: string;
                      last_name?: string;
                      email?: string;
                    } | null;
                    if (!u) return null;
                    const name =
                      u.name?.trim() ||
                      u.email?.split("@")[0] ||
                      u.id.slice(0, 8);
                    return (
                      <label
                        key={u.id}
                        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          name="student_id"
                          value={u.id}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="font-medium text-slate-800">{name}</span>
                        {u.email ? (
                          <span className="text-xs text-slate-400">{u.email}</span>
                        ) : null}
                      </label>
                    );
                  })}
                </div>
              </>
            ) : (
              <select
                name="student_id"
                required
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="">— choose a student —</option>
                {students.map((s) => {
                  const u = s.users as unknown as {
                    id: string;
                    name?: string;
                    email?: string;
                  } | null;
                  if (!u) return null;
                  const name =
                    u.name?.trim() || u.email?.split("@")[0] || u.id.slice(0, 8);
                  return (
                    <option key={u.id} value={u.id}>
                      {name} {u.email ? `· ${u.email}` : ""}
                    </option>
                  );
                })}
              </select>
            )
          ) : (
            <p className="text-sm text-slate-500">
              No active students yet. Invite one from{" "}
              <Link href="/tutor/students" className="text-emerald-700 underline">
                Students
              </Link>
              .
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Lesson</label>
          {lessons && lessons.length > 0 ? (
            <select
              name="lesson_id"
              required
              defaultValue={lessons.find((l) => l.slug === lessonSlug)?.id || ""}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            >
              <option value="">— choose a lesson —</option>
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  [{l.level}] {l.title}
                  {l.duration_minutes ? ` · ${l.duration_minutes} min` : ""}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-slate-500">
              No published lessons yet. Import + review one at{" "}
              <Link href="/admin/tutor-lessons" className="text-emerald-700 underline">
                Admin → Tutor Lessons
              </Link>
              .
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Session title <span className="text-xs text-slate-400">(optional)</span>
          </label>
          <input
            type="text"
            name="title"
            placeholder="e.g. Week 3 — shopping vocabulary"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={!students?.length || !lessons?.length}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Sparkles className="h-4 w-4" />
          Start session
        </button>
      </form>
    </div>
  );
}
