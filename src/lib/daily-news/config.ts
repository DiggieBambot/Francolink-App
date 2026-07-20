import type { CefrLevel, DailyNewsCategory, DailyNewsConfig } from "./types";

export const DAILY_NEWS_CATEGORIES: DailyNewsCategory[] = [
  "technology",
  "health",
  "sports",
  "entertainment",
  "world",
  "science",
];

export const GOOGLE_NEWS_TOPICS: Record<DailyNewsCategory, string> = {
  technology: "TECHNOLOGY",
  health: "HEALTH",
  sports: "SPORTS",
  entertainment: "ENTERTAINMENT",
  world: "WORLD",
  science: "SCIENCE",
};

export const CATEGORY_PLACEHOLDERS: Record<DailyNewsCategory, string> = {
  technology: "/daily-news/placeholders/technology.svg",
  health: "/daily-news/placeholders/health.svg",
  sports: "/daily-news/placeholders/sports.svg",
  entertainment: "/daily-news/placeholders/entertainment.svg",
  world: "/daily-news/placeholders/world.svg",
  science: "/daily-news/placeholders/science.svg",
};

const LEVELS = new Set<CefrLevel>(["A2", "B1", "B2", "C1"]);

function parseCategories(value?: string): DailyNewsCategory[] {
  if (!value) return DAILY_NEWS_CATEGORIES;
  const set = new Set(DAILY_NEWS_CATEGORIES);
  const parsed = value
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter((v): v is DailyNewsCategory => set.has(v as DailyNewsCategory));
  return parsed.length ? parsed : DAILY_NEWS_CATEGORIES;
}

function parseLevel(value?: string): CefrLevel {
  const level = (value || "B1").toUpperCase() as CefrLevel;
  return LEVELS.has(level) ? level : "B1";
}

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getDailyNewsConfig(overrides: Partial<DailyNewsConfig> = {}): DailyNewsConfig {
  return {
    categories: overrides.categories ?? parseCategories(process.env.CATEGORIES || process.env.DAILY_NEWS_CATEGORIES),
    targetLevel: overrides.targetLevel ?? parseLevel(process.env.TARGET_CEFR_LEVEL || process.env.DAILY_NEWS_TARGET_CEFR_LEVEL),
    minScoreThreshold: overrides.minScoreThreshold ?? intEnv("MIN_SCORE_THRESHOLD", 7),
    maxCandidatesPerCategory: overrides.maxCandidatesPerCategory ?? intEnv("MAX_CANDIDATES_PER_CATEGORY", 10),
    lessonsPerDay: overrides.lessonsPerDay ?? intEnv("LESSONS_PER_DAY", 6),
    autoPublish: overrides.autoPublish ?? (process.env.AUTO_PUBLISH === "true" || process.env.DAILY_NEWS_AUTO_PUBLISH === "true"),
    openaiModel: overrides.openaiModel ?? process.env.OPENAI_MODEL ?? process.env.DAILY_NEWS_OPENAI_MODEL ?? "gpt-4o-mini",
  };
}
