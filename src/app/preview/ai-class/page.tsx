// Dev-only preview of a class with Professor Léon once a lesson is chosen:
// the live-class lesson on screen beside Léon, with a real published lesson.

import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { Lesson } from "@/lib/lessons/types";
import { AIClassPreview } from "./preview";

export default async function AIClassPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; lang?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { id, lang } = await searchParams;
  const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  let q = svc.from("tutor_lessons").select("id, content").eq("status", "published");
  q = id ? q.eq("id", id) : q.eq("language", lang || "fr").eq("level", "A1");
  const { data } = await q.limit(1).maybeSingle();
  if (!data) notFound();
  return <AIClassPreview id={data.id} lesson={data.content as Lesson} />;
}
