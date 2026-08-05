import type { Lesson } from "@/lib/lessons/types";

export type DailyNewsCategory =
  | "technology"
  | "health"
  | "sports"
  | "entertainment"
  | "world"
  | "science";

export type CefrLevel = "A2" | "B1" | "B2" | "C1";

export type DailyNewsLanguage = "en" | "fr";

export interface DailyNewsConfig {
  language: DailyNewsLanguage;
  categories: DailyNewsCategory[];
  targetLevel: CefrLevel;
  minScoreThreshold: number;
  maxCandidatesPerCategory: number;
  lessonsPerDay: number;
  autoPublish: boolean;
  openaiModel: string;
}

export interface NewsCandidate {
  category: DailyNewsCategory;
  title: string;
  snippet: string;
  sourceName: string | null;
  sourceUrl: string;
  googleUrl: string;
  publishedAt: string;
  feedRank: number;
  contentHash: string;
}

export interface CandidateScore {
  index: number;
  significance: number;
  discussability: number;
  global_intelligibility: number;
  self_contained: number;
  appropriate: boolean;
  total: number;
}

export interface GeneratedDailyNewsLesson {
  title: string;
  article_body: string;
  vocabulary: Array<{
    word: string;
    ipa: string;
    part_of_speech: string;
    definition: string;
    example: string;
  }>;
  /** Each comprehension question with its own model answer grounded in the
   *  article. (Legacy generations may be plain strings — handled defensively.) */
  comprehension_questions: Array<{ question: string; answer: string }>;
  discussion_questions: string[];
  further_discussion_questions: string[];
  image_query?: string;
  /** The specific real named person/place/organization/event the story is
   *  about, if any (e.g. "Andy Burnham", "NASA Psyche spacecraft"). Used to
   *  find an actual accurate photo on Wikimedia Commons before falling back
   *  to generic stock. */
  image_subject?: string;
}

export interface BannerImage {
  url: string;
  credit_name: string | null;
  credit_url: string | null;
  query_used: string;
  source: "source-article" | "wikimedia" | "pexels" | "placeholder";
  /** License short name (e.g. "CC BY-SA 4.0"), only set for Wikimedia images. */
  license?: string;
}

export interface DailyNewsRunResult {
  ok: boolean;
  runId?: string;
  mode: "dry-run" | "live";
  fetched: number;
  selected: number;
  generated: number;
  failed: number;
  published: number;
  candidates: NewsCandidate[];
  selectedCandidates: Array<NewsCandidate & { score: CandidateScore }>;
  lessons: Array<{ id: string; slug: string; title: string; category: DailyNewsCategory }>;
  errors: string[];
}

export interface BuiltLesson {
  lesson: Lesson;
  generated: GeneratedDailyNewsLesson;
  bannerImage: BannerImage;
}
