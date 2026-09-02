// The online workbook.
//
// The sales page promises that "the online version marks every exercise like
// this, instantly, with the reason behind it" -- so this has to actually mark
// them, or the page is selling something that does not exist. 190 of the 216
// exercise items have a clean answer mapping and are interactive; the rest are
// multi-blank or free-writing and are shown as plain text with the answer, so
// nothing is ever marked wrong on a guess.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { loadBook, loadExercises, loadAudio } from "@/lib/workbook/book";
import { ReaderShell } from "@/components/workbook/reader-shell";

export const metadata: Metadata = {
  title: "Le Français Pas à Pas | FrancoLink",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

interface PageProps { searchParams: Promise<{ s?: string }> }

export default async function ReadPage({ searchParams }: PageProps) {
  const { s } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login/student?next=/workbook/read");

  const { data: orders } = await service()
    .from("digital_orders")
    .select("id, digital_order_items(product_key)")
    .eq("user_id", user.id)
    .eq("status", "paid");

  const owned = new Set<string>();
  for (const o of orders ?? []) {
    for (const i of (o.digital_order_items ?? []) as { product_key: string }[]) {
      owned.add(i.product_key);
    }
  }
  if (!owned.has("workbook_fpp")) redirect("/workbook");

  const [sections, exercises, audio] = await Promise.all([
    loadBook(),
    loadExercises(),
    loadAudio(),
  ]);

  return (
    <ReaderShell
      sections={sections.map(({ id, title, part, html }) => ({ id, title, part, html }))}
      exercises={exercises}
      audio={audio}
      current={s}
      hasAudio={owned.has("audio_fpp")}
    />
  );
}
