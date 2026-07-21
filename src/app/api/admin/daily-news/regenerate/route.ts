// One-off admin utility: regenerate existing Daily News drafts (still in
// `review`) with the current pipeline — used after prompt/image-sourcing
// improvements so previously-generated drafts aren't stuck with the old,
// less accurate output. Re-extracts each lesson's original source article
// and rebuilds it (title/content/banner image) in place; slug/id unchanged.
import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { getDailyNewsConfig } from "@/lib/daily-news/config";
import { buildDailyNewsLesson } from "@/lib/daily-news/pipeline";
import type { CefrLevel, DailyNewsCategory, DailyNewsLanguage } from "@/lib/daily-news/types";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

function bearerToken(req: Request): string {
  const header = req.headers.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

function authorizedCron(req: Request): boolean {
  const token = bearerToken(req);
  return (
    (!!process.env.CRON_SECRET && token === process.env.CRON_SECRET) ||
    (!!process.env.SUPABASE_SERVICE_ROLE_KEY && token === process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 } as const;
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if ((profile?.role || "").toUpperCase() !== "ADMIN") {
    return { error: "Forbidden", status: 403 } as const;
  }
  return { ok: true as const };
}

function serviceClient() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

type DailyNewsRow = {
  id: string;
  category: DailyNewsCategory;
  source_name: string | null;
  source_url: string;
  published_at: string;
  feed_rank: number | null;
  content_hash: string;
  tutor_lessons: { id: string; slug: string; title: string; status: string; level: CefrLevel; language: DailyNewsLanguage } | null;
};

async function regenerate(req: Request) {
  const url = new URL(req.url);
  const lang = url.searchParams.get("lang");
  const limit = Number(url.searchParams.get("limit") || "0") || undefined;

  const supabase = serviceClient();
  const { data: rows, error } = await supabase
    .from("daily_news_lessons")
    .select(`
      id, category, source_name, source_url, published_at, feed_rank, content_hash,
      tutor_lessons:lesson_id(id, slug, title, status, level, language)
    `)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Supabase infers this FK join as an array; it's one-to-one via lesson_id.
  let targets = (rows || []) as unknown as DailyNewsRow[];
  targets = targets.filter((r) => r.tutor_lessons?.status === "review");
  if (lang === "en" || lang === "fr") targets = targets.filter((r) => r.tutor_lessons?.language === lang);
  if (limit) targets = targets.slice(0, limit);

  const results: Array<{ slug: string; ok: boolean; title?: string; image?: string; error?: string }> = [];

  for (const row of targets) {
    const lesson = row.tutor_lessons!;
    try {
      const config = getDailyNewsConfig({ language: lesson.language, targetLevel: lesson.level });
      const candidate = {
        category: row.category,
        title: lesson.title,
        snippet: "",
        sourceName: row.source_name,
        sourceUrl: row.source_url,
        googleUrl: row.source_url,
        publishedAt: row.published_at,
        feedRank: row.feed_rank ?? 0,
        contentHash: row.content_hash,
      };

      const built = await buildDailyNewsLesson(getOpenAI(), candidate, config);
      built.lesson.slug = lesson.slug;

      const { error: updateError } = await supabase
        .from("tutor_lessons")
        .update({ title: built.lesson.title, content: built.lesson })
        .eq("id", lesson.id);
      if (updateError) throw new Error(updateError.message);

      const { error: metaError } = await supabase
        .from("daily_news_lessons")
        .update({ banner_image: built.bannerImage })
        .eq("id", row.id);
      if (metaError) throw new Error(metaError.message);

      results.push({ slug: lesson.slug, ok: true, title: built.lesson.title, image: built.bannerImage.source });
    } catch (err) {
      results.push({ slug: lesson.slug, ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return NextResponse.json({
    total: targets.length,
    ok: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}

function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function GET(req: Request) {
  if (!authorizedCron(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return regenerate(req);
}

export async function POST(req: Request) {
  const auth = await assertAdmin();
  if (!("ok" in auth)) return NextResponse.json({ error: auth.error }, { status: auth.status });
  return regenerate(req);
}
