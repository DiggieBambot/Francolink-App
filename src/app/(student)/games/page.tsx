// src/app/(student)/games/page.tsx
//
// Top-level Games entry. Redirects to the user's current learning_language
// games lobby. Defaults to French if no preference is set.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { langSlug } from "@/lib/utils/language";

const DEFAULT_LANG = "french";

export default async function GamesEntryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: row } = await supabase
    .from("users")
    .select("learning_language")
    .eq("id", user.id)
    .maybeSingle();

  const code = row?.learning_language || "fr";
  const slug = langSlug(code) || DEFAULT_LANG;
  redirect(`/learn/${slug}/games`);
}
