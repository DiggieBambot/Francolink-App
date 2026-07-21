import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Newspaper } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RunDailyNewsButton } from "./run-button";

type NewsRow = {
  id: string;
  category: string;
  source_name: string | null;
  source_url: string;
  created_at: string;
  published_at: string | null;
  banner_image: { url?: string; credit_name?: string | null; credit_url?: string | null; query_used?: string };
  score: { total?: number } | null;
  tutor_lessons: {
    id: string;
    slug: string;
    title: string;
    status: string;
    level: string;
    language: string;
    topic_tags: string[];
  } | null;
};

type RunRow = {
  id: string;
  mode: string;
  fetched_count: number;
  selected_count: number;
  generated_count: number;
  failed_count: number;
  created_at: string;
};

export default async function AdminDailyNewsPage() {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("daily_news_lessons")
    .select(`
      id,
      category,
      source_name,
      source_url,
      created_at,
      published_at,
      banner_image,
      score,
      tutor_lessons:lesson_id(id, slug, title, status, level, language, topic_tags)
    `)
    .order("created_at", { ascending: false })
    .limit(80);

  const { data: runs } = await supabase
    .from("daily_news_runs")
    .select("id, mode, fetched_count, selected_count, generated_count, failed_count, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  // Supabase infers the tutor_lessons FK join as an array (it can't see the
  // unique constraint from here); it's actually one-to-one via lesson_id.
  const lessons = (rows || []) as unknown as NewsRow[];
  const recentRuns = (runs || []) as RunRow[];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase text-primary">
            <Newspaper className="h-3.5 w-3.5" />
            Daily News
          </div>
          <h1 className="text-2xl font-bold">Daily News Lessons</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Automated Google News lessons are generated as review items. Approve or reject them from the same tutor lesson workflow.
          </p>
        </div>
        <RunDailyNewsButton />
      </div>

      {error ? (
        <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Daily News tables are not available yet.</p>
          <p className="mt-1">
            Apply <code>supabase/migrations/20260720_daily_news_lessons.sql</code> in Supabase, then refresh this page.
          </p>
          <p className="mt-1 text-xs">{error.message}</p>
        </div>
      ) : null}

      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent Runs</h2>
        {recentRuns.length ? (
          <div className="grid gap-3 md:grid-cols-5">
            {recentRuns.map((run) => (
              <div key={run.id} className="rounded border bg-background p-3 text-sm">
                <div className="font-medium">{new Date(run.created_at).toLocaleString()}</div>
                <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  <span>Fetched</span><span className="text-right">{run.fetched_count}</span>
                  <span>Selected</span><span className="text-right">{run.selected_count}</span>
                  <span>Generated</span><span className="text-right">{run.generated_count}</span>
                  <span>Failed</span><span className="text-right">{run.failed_count}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No runs recorded yet.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Generated Lessons</h2>
        {lessons.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {lessons.map((row) => {
              const lesson = row.tutor_lessons;
              const imageUrl = row.banner_image?.url;
              return (
                <article key={row.id} className="overflow-hidden rounded-lg border bg-card">
                  {imageUrl ? (
                    <div className="relative aspect-[16/7] bg-muted">
                      <Image src={imageUrl} alt={lesson?.title || row.category} fill sizes="(max-width: 1280px) 100vw, 640px" className="object-cover object-top" />
                    </div>
                  ) : null}
                  <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-1">
                        {lesson?.language ? (
                          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                            {lesson.language === "fr" ? "🇫🇷 FR" : "🇬🇧 EN"}
                          </span>
                        ) : null}
                        <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold">{row.category}</span>
                        {lesson?.level ? <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold">{lesson.level}</span> : null}
                        {lesson?.status ? <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">{lesson.status}</span> : null}
                      </div>
                      {typeof row.score?.total === "number" ? (
                        <span className="text-xs text-muted-foreground">Score {row.score.total}/12</span>
                      ) : null}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{lesson?.title || "Untitled lesson"}</h3>
                      <p className="text-xs text-muted-foreground">
                        {row.source_name || "News source"} · {new Date(row.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      {lesson ? (
                        <Link href={`/admin/tutor-lessons/${lesson.id}`} className="font-medium text-primary hover:underline">
                          Review lesson →
                        </Link>
                      ) : null}
                      <a href={row.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                        Source <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      {row.banner_image?.credit_url ? (
                        <a href={row.banner_image.credit_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                          Photo credit <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded border border-dashed p-10 text-center text-muted-foreground">
            No Daily News lessons yet.
          </div>
        )}
      </section>
    </div>
  );
}
