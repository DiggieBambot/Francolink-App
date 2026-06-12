// src/app/(student)/placement-test/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PlacementTestFlow from "@/components/placement-test/placement-test-flow";

// Valid languages
const validLanguages = ["fr", "es", "en", "de"];

// Map short codes to URL slugs used in course slugs
const languageSlugMap: Record<string, string> = {
  fr: "french",
  es: "spanish",
  en: "english",
  de: "german",
};

interface PlacementTestPageProps {
  searchParams: Promise<{ lang?: string }>;
}

export default async function PlacementTestPage({ searchParams }: PlacementTestPageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get user profile
  const { data: userData } = await supabase
    .from("users")
    .select("id, name, learning_language")
    .eq("id", user.id)
    .single();

  // Get language from query params, fallback to user's saved language, then default to French
  let language = params.lang || userData?.learning_language || "fr";

  // Validate language
  if (!validLanguages.includes(language)) {
    language = "fr";
  }

  // Check if user already took the placement test for THIS specific language
  const { data: langPlacement } = await supabase
    .from("user_languages")
    .select("placement_taken, placement_level")
    .eq("user_id", user.id)
    .eq("language_code", language)
    .single();

  // If already taken for this language, redirect to their course
  if (langPlacement?.placement_taken) {
    const level = langPlacement.placement_level?.toLowerCase() || "a1";
    const languageSlug = languageSlugMap[language] || language;
    redirect(`/learn/${languageSlug}/${level}`);
  }

  // Convert short code to full slug for routing
  const languageSlug = languageSlugMap[language] || language;

  return (
    <div className="min-h-screen bg-gray-50">
      <PlacementTestFlow 
        userId={user.id} 
        userName={userData?.name || "there"}
        language={languageSlug}
        languageShortCode={language}
      />
    </div>
  );
}
