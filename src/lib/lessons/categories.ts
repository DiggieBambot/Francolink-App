// Lesson category taxonomy. Categories are derived from each lesson's source
// folder (+ topic tags as a fallback) so we don't need a DB column.

export interface Category {
  slug: string;
  name: string;
  description: string;
  /** Emoji used as the card illustration. */
  emoji: string;
  /** Tailwind gradient classes for the card header. */
  gradient: string;
  /** Which language this category belongs to. */
  language: "fr" | "en";
}

// ─── French categories ───────────────────────────────────────────────────────

export const FRENCH_CATEGORIES: Category[] = [
  {
    slug: "conversation",
    name: "Conversation",
    description: "Everyday French conversation practice — speak naturally and build confidence.",
    emoji: "💬",
    gradient: "from-sky-400 to-blue-500",
    language: "fr",
  },
  {
    slug: "business",
    name: "Business French",
    description: "Professional and workplace French — meetings, negotiation, careers.",
    emoji: "💼",
    gradient: "from-slate-500 to-slate-700",
    language: "fr",
  },
  {
    slug: "travel-culture",
    name: "Travel & Culture",
    description: "Useful phrases for travel plus French art, history and society.",
    emoji: "✈️",
    gradient: "from-amber-400 to-orange-500",
    language: "fr",
  },
  {
    slug: "french-for-kids",
    name: "French for Kids",
    description: "Fun, gentle French basics for young learners — colours, animals, numbers.",
    emoji: "🧒",
    gradient: "from-emerald-400 to-green-500",
    language: "fr",
  },
  {
    slug: "fr-grammar",
    name: "Grammar",
    description:
      "La grammaire française expliquée pas à pas — conjugaisons, accords et les erreurs à éviter, avec exercices et devoirs.",
    emoji: "📐",
    gradient: "from-violet-500 to-indigo-500",
    language: "fr",
  },
  {
    slug: "fr-daily-news",
    name: "Daily News",
    description: "Des actualités fraîches et réelles — tech, santé, sport, divertissement, monde et science — réécrites pour les apprenants.",
    emoji: "📰",
    gradient: "from-rose-500 to-orange-500",
    language: "fr",
  },
];

// ─── English categories ──────────────────────────────────────────────────────

export const ENGLISH_CATEGORIES: Category[] = [
  {
    slug: "en-conversation",
    name: "Conversation",
    description: "Everyday English conversation — build fluency and confidence for real-life situations.",
    emoji: "💬",
    gradient: "from-indigo-400 to-blue-500",
    language: "en",
  },
  {
    slug: "en-business",
    name: "Business English",
    description: "Professional English for the workplace — meetings, emails, presentations, interviews.",
    emoji: "💼",
    gradient: "from-slate-500 to-slate-700",
    language: "en",
  },
  {
    slug: "en-travel-culture",
    name: "Travel & Culture",
    description: "Essential English for travel, plus anglophone culture, history and society.",
    emoji: "✈️",
    gradient: "from-amber-400 to-orange-500",
    language: "en",
  },
  {
    slug: "en-kids",
    name: "English for Kids",
    description: "Fun, gentle English basics for young learners — colours, animals, numbers.",
    emoji: "🧒",
    gradient: "from-emerald-400 to-green-500",
    language: "en",
  },
  {
    slug: "daily-news",
    name: "Daily News",
    description: "Fresh, real-world stories across tech, health, sports, entertainment, world & science — rewritten for learners.",
    emoji: "📰",
    gradient: "from-rose-500 to-orange-500",
    language: "en",
  },
];

// ─── Combined ────────────────────────────────────────────────────────────────

/** All categories across all languages. */
export const CATEGORIES: Category[] = [...FRENCH_CATEGORIES, ...ENGLISH_CATEGORIES];

export const CATEGORY_BY_SLUG: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c])
);

/** Get categories for a specific language. */
export function categoriesForLanguage(lang: "fr" | "en"): Category[] {
  return CATEGORIES.filter((c) => c.language === lang);
}

/** Assign a lesson to a category slug from its language, source folder + topic tags. */
export function categoryForLesson(
  language?: string | null,
  sourceUrl?: string | null,
  topicTags?: string[]
): string {
  const lang = (language || "fr").toLowerCase();
  const path = (sourceUrl || "").toLowerCase();
  const tags = (topicTags || []).map((t) => t.toLowerCase()).join(" ");
  const hay = `${path} ${tags}`;

  // Daily News lessons carry a "Daily News" topic tag (see daily-news
  // pipeline). Route them to their own per-language section regardless of
  // sector (technology/health/etc.) — check this before the generic rules
  // below so a business or travel story doesn't get miscategorized away from it.
  if (/\bdaily news\b/.test(tags)) return lang === "en" ? "daily-news" : "fr-daily-news";

  // The curated grammar syllabus is seeded with source_url "seed:fr-grammar"
  // (see scripts/seed-fr-grammar). Route only those into the Grammar category —
  // matching on source keeps loosely "grammar"-tagged conversation lessons out.
  if (/seed:fr-grammar/.test(path)) return "fr-grammar";

  if (lang === "en") {
    if (/\bkid|young learner|english for kid/.test(hay)) return "en-kids";
    if (/\bbusiness|workplace|career|interview|meeting|email|professi/.test(hay))
      return "en-business";
    if (/\btravel|culture|touris|history|art\b/.test(hay)) return "en-travel-culture";
    return "en-conversation"; // default for English
  }

  // French (default)
  if (/\bkid|enfant|young learner|french for kid/.test(hay)) return "french-for-kids";
  if (/\bbusiness|affaires|travail|emploi|workplace|career|entretien|professionnel/.test(hay))
    return "business";
  if (/\btravel|voyage|culture|tourisme|avion|histoire|art\b/.test(hay)) return "travel-culture";
  if (/\bconversation|discussion|débutant|debutant|intermediaire|avancée|conversation/.test(hay))
    return "conversation";
  return "conversation"; // sensible default
}
