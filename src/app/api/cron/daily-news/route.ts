// Daily News generator cron.
// Vercel Cron: GET /api/cron/daily-news with Authorization: Bearer CRON_SECRET.
// Manual admin trigger: POST /api/cron/daily-news from /admin/daily-news.

import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { runDailyNewsPipeline } from "@/lib/daily-news/pipeline";
import { getDailyNewsConfig } from "@/lib/daily-news/config";

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
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase service credentials are not configured");
  }
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dry") === "1";

  if (!authorizedCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runDailyNewsPipeline(serviceClient(), {
    dryRun,
    config: getDailyNewsConfig(),
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

export async function POST(req: Request) {
  const auth = await assertAdmin();
  if (!("ok" in auth)) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const result = await runDailyNewsPipeline(serviceClient(), {
    dryRun: body?.dryRun === true,
    config: {
      ...(body?.targetLevel ? { targetLevel: body.targetLevel } : {}),
      ...(body?.lessonsPerDay ? { lessonsPerDay: Number(body.lessonsPerDay) } : {}),
      ...(body?.maxCandidatesPerCategory ? { maxCandidatesPerCategory: Number(body.maxCandidatesPerCategory) } : {}),
    },
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
