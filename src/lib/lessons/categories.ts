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
}

export const CATEGORIES: Category[] = [
  {
    slug: "conversation",
    name: "Conversation",
    description: "Everyday French conversation practice — speak naturally and build confidence.",
    emoji: "💬",
    gradient: "from-sky-400 to-blue-500",
  },
  {
    slug: "business",
    name: "Business French",
    description: "Professional and workplace French — meetings, negotiation, careers.",
    emoji: "💼",
    gradient: "from-slate-500 to-slate-700",
  },
  {
    slug: "travel-culture",
    name: "Travel & Culture",
    description: "Useful phrases for travel plus French art, history and society.",
    emoji: "✈️",
    gradient: "from-amber-400 to-orange-500",
  },
  {
    slug: "french-for-kids",
    name: "French for Kids",
    description: "Fun, gentle French basics for young learners — colours, animals, numbers.",
    emoji: "🧒",
    gradient: "from-emerald-400 to-green-500",
  },
];

export const CATEGORY_BY_SLUG: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c])
);

/** Assign a lesson to a category slug from its source folder + topic tags. */
export function categoryForLesson(sourceUrl?: string | null, topicTags?: string[]): string {
  const path = (sourceUrl || "").toLowerCase();
  const tags = (topicTags || []).map((t) => t.toLowerCase()).join(" ");
  const hay = `${path} ${tags}`;

  if (/\bkid|enfant|young learner|french for kid/.test(hay)) return "french-for-kids";
  if (/\bbusiness|affaires|travail|emploi|workplace|career|entretien|professionnel/.test(hay))
    return "business";
  if (/\btravel|voyage|culture|tourisme|avion|histoire|art\b/.test(hay)) return "travel-culture";
  if (/\bconversation|discussion|débutant|debutant|intermediaire|avancée|conversation/.test(hay))
    return "conversation";
  return "conversation"; // sensible default
}
