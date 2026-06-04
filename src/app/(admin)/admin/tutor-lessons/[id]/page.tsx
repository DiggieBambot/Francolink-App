// Admin detail / review page for a single tutor lesson.

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, AlertTriangle, Eye } from "lucide-react";
import { LessonStatusActions } from "./status-actions";
import { RehydrateImagesButton } from "./rehydrate-button";

type Section = {
  kind: string;
  number: number;
  title?: string;
  student_instruction?: string;
  tutor_instruction?: string;
  [key: string]: unknown;
};

export default async function AdminTutorLessonDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: lesson, error } = await supabase
    .from("tutor_lessons")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !lesson) notFound();

  const content = lesson.content as {
    objectives?: Array<{ student_label: string; skill: string; cefr_can_do: string }>;
    tutor_overview?: {
      skills_covered?: string[];
      estimated_minutes?: number;
      teaching_tips?: string[];
      common_mistakes?: string[];
    };
    sections?: Section[];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/admin/tutor-lessons?status=${lesson.status}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Back to {lesson.status}
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/tutor-lessons/${lesson.id}/preview`}
            className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Eye className="w-4 h-4" /> Preview lesson
          </Link>
          <RehydrateImagesButton lessonId={lesson.id} />
          {lesson.source_doc_id ? (
            <a
              href={`https://docs.google.com/document/d/${lesson.source_doc_id}/edit`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View source doc <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : null}
        </div>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold">{lesson.level}</span>
            <span className="text-xs text-muted-foreground">{lesson.language}</span>
            {lesson.duration_minutes ? (
              <span className="text-xs text-muted-foreground">· {lesson.duration_minutes} min</span>
            ) : null}
          </div>
          <h1 className="text-2xl font-bold">{lesson.title}</h1>
          <div className="mt-2 flex flex-wrap gap-1">
            {(lesson.topic_tags || []).map((t: string) => (
              <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-xs">{t}</span>
            ))}
          </div>
        </div>
        <LessonStatusActions id={lesson.id} status={lesson.status} />
      </div>

      {lesson.conversion_notes ? (
        <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm">
          <div className="flex items-center gap-2 font-medium text-amber-900">
            <AlertTriangle className="w-4 h-4" /> Conversion warnings
          </div>
          <p className="mt-1 text-amber-900">{lesson.conversion_notes}</p>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border bg-card p-4">
          <h2 className="font-semibold mb-3">Objectives</h2>
          <ul className="space-y-2 text-sm">
            {(content.objectives || []).map((o, i) => (
              <li key={i}>
                <div className="font-medium">{o.student_label}</div>
                <div className="text-xs text-muted-foreground">
                  {o.skill} · {o.cefr_can_do}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border bg-card p-4">
          <h2 className="font-semibold mb-3">Tutor overview</h2>
          {content.tutor_overview?.skills_covered ? (
            <div className="mb-3">
              <div className="text-xs font-semibold uppercase text-muted-foreground">Skills</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {content.tutor_overview.skills_covered.map((s) => (
                  <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-xs">{s}</span>
                ))}
              </div>
            </div>
          ) : null}
          <div className="mb-3">
            <div className="text-xs font-semibold uppercase text-muted-foreground">Teaching tips</div>
            <ul className="mt-1 list-disc pl-5 text-sm space-y-1">
              {(content.tutor_overview?.teaching_tips || []).map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase text-muted-foreground">Common mistakes</div>
            <ul className="mt-1 list-disc pl-5 text-sm space-y-1">
              {(content.tutor_overview?.common_mistakes || []).map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Sections</h2>
        {(content.sections || []).map((s, i) => (
          <details key={i} className="rounded-lg border bg-card p-4" open={i < 2}>
            <summary className="cursor-pointer font-medium">
              <span className="mr-2 inline-block w-10 rounded bg-muted px-1.5 py-0.5 text-center text-xs">
                {String(s.number)}
              </span>
              <span className="mr-2 text-xs text-muted-foreground">{s.kind}</span>
              {s.title}
            </summary>
            <div className="mt-3 grid gap-3 md:grid-cols-2 text-sm">
              <div>
                <div className="text-xs font-semibold uppercase text-muted-foreground">Student instruction</div>
                <p>{s.student_instruction}</p>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-muted-foreground">Tutor instruction</div>
                <p className="text-emerald-900">{s.tutor_instruction}</p>
              </div>
            </div>
            <pre className="mt-3 overflow-x-auto rounded bg-muted p-3 text-xs">
              {JSON.stringify(s, null, 2)}
            </pre>
          </details>
        ))}
      </section>
    </div>
  );
}
