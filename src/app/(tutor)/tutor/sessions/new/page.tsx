// /tutor/sessions/new — pick a student + a published tutor_lesson, create a
// tutor_lesson_sessions row, redirect to /room/[id].

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

async function createSessionAction(formData: FormData) {
  "use server";
  const studentId = String(formData.get("student_id") || "");
  const lessonId = String(formData.get("lesson_id") || "");
  const title = String(formData.get("title") || "").trim() || null;
  if (!studentId || !lessonId) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: inserted, error } = await supabase
    .from("tutor_lesson_sessions")
    .insert({
      tutor_id: user.id,
      student_id: studentId,
      tutor_lesson_id: lessonId,
      title,
      status: "active",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !inserted) {
    redirect(`/tutor/sessions/new?error=${encodeURIComponent(error?.message || "create failed")}`);
  }
  redirect(`/room/${inserted!.id}`);
}

export default async function NewSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/tutor/sessions/new");

  // Pull this tutor's students.
  const { data: students } = await supabase
    .from("tutor_students")
    .select("student_id, status, users:student_id(id, first_name, last_name, email)")
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
          <label className="mb-1 block text-sm font-medium text-slate-700">Student</label>
          {students && students.length > 0 ? (
            <select
              name="student_id"
              required
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            >
              <option value="">— choose a student —</option>
              {students.map((s) => {
                const u = s.users as unknown as {
                  id: string;
                  first_name?: string;
                  last_name?: string;
                  email?: string;
                } | null;
                if (!u) return null;
                const name =
                  [u.first_name, u.last_name].filter(Boolean).join(" ") ||
                  u.email?.split("@")[0] ||
                  u.id.slice(0, 8);
                return (
                  <option key={u.id} value={u.id}>
                    {name} {u.email ? `· ${u.email}` : ""}
                  </option>
                );
              })}
            </select>
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
