import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BookOpen, Clock, Tag } from "lucide-react";

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-emerald-100 text-emerald-800",
  A2: "bg-teal-100 text-teal-800",
  B1: "bg-primary-100 text-primary-800",
  B2: "bg-indigo-100 text-indigo-800",
  C1: "bg-purple-100 text-purple-800",
  C2: "bg-rose-100 text-rose-800",
};

export default async function TutorLessonsPage() {
  const supabase = await createClient();

  const { data: lessons } = await supabase
    .from("tutor_lessons")
    .select("id, slug, title, level, language, topic_tags, duration_minutes, created_at")
    .eq("status", "published")
    .order("level", { ascending: true })
    .order("title", { ascending: true });

  // Group by level
  const byLevel: Record<string, typeof lessons> = {};
  for (const l of lessons || []) {
    const lvl = l.level || "Other";
    if (!byLevel[lvl]) byLevel[lvl] = [];
    byLevel[lvl]!.push(l);
  }

  const levelOrder = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const sortedLevels = Object.keys(byLevel).sort(
    (a, b) => (levelOrder.indexOf(a) ?? 99) - (levelOrder.indexOf(b) ?? 99)
  );

  const totalMinutes = (lessons || []).reduce(
    (s, l) => s + (l.duration_minutes || 0),
    0
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Lesson Library</h1>
        <p className="text-sm text-slate-500 mt-1">
          Teaching materials — open any lesson to review content, see tutor notes, and start a live session with a student.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-primary-600 shrink-0" />
          <div>
            <div className="text-2xl font-bold text-slate-900">{lessons?.length || 0}</div>
            <div className="text-xs text-slate-500">Published lessons</div>
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 flex items-center gap-3">
          <Tag className="w-5 h-5 text-secondary-600 shrink-0" />
          <div>
            <div className="text-2xl font-bold text-slate-900">{sortedLevels.length}</div>
            <div className="text-xs text-slate-500">CEFR levels</div>
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 flex items-center gap-3">
          <Clock className="w-5 h-5 text-purple-600 shrink-0" />
          <div>
            <div className="text-2xl font-bold text-slate-900">{totalMinutes}</div>
            <div className="text-xs text-slate-500">total minutes</div>
          </div>
        </div>
      </div>

      {/* Lessons by level */}
      {sortedLevels.length > 0 ? (
        <div className="space-y-10">
          {sortedLevels.map((level) => (
            <section key={level}>
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${LEVEL_COLORS[level] || "bg-slate-100 text-slate-700"}`}
                >
                  {level}
                </span>
                <h2 className="text-base font-semibold text-slate-700">
                  {byLevel[level]?.length} lesson{byLevel[level]?.length !== 1 ? "s" : ""}
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {byLevel[level]?.map((lesson) => (
                  <Link
                    key={lesson.id}
                    href={`/tutor/lessons/${lesson.id}`}
                    className="group rounded-2xl border bg-white p-5 hover:shadow-md hover:border-primary-200 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${LEVEL_COLORS[lesson.level] || "bg-slate-100 text-slate-700"}`}
                      >
                        {lesson.level}
                      </span>
                      {lesson.duration_minutes ? (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          {lesson.duration_minutes} min
                        </span>
                      ) : null}
                    </div>

                    <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-primary-700 transition-colors">
                      {lesson.title}
                    </h3>

                    {(lesson.topic_tags || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(lesson.topic_tags || []).slice(0, 3).map((tag: string) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {(lesson.topic_tags || []).length > 3 && (
                          <span className="text-[10px] text-slate-400">
                            +{(lesson.topic_tags || []).length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed bg-white py-16 text-center">
          <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No lessons published yet</p>
          <p className="text-sm text-slate-400 mt-1">
            The admin publishes lesson materials here from the admin panel.
          </p>
        </div>
      )}
    </div>
  );
}
