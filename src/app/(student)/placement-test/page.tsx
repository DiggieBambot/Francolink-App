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

  // Check if user already took the placement test
  const { data: userData } = await supabase
    .from("users")
    .select("id, name, placement_test_taken, placement_test_level, learning_language")
    .eq("id", user.id)
    .single();

  // Get language from query params, fallback to user's saved language, then default to French
  let language = params.lang || userData?.learning_language || "fr";
  
  // Validate language
  if (!validLanguages.includes(language)) {
    language = "fr";
  }

  // If already taken, redirect to their recommended course in the correct language
  if (userData?.placement_test_taken) {
    const level = userData.placement_test_level?.toLowerCase() || "a1";
    const userLanguage = userData.learning_language || "fr";
    const languageSlug = languageSlugMap[userLanguage] || userLanguage;
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
