// src/lib/ai/class-plan.ts
//
// Turns an AI tutoring session into a class that follows the curriculum.
//
// Professor Léon used to open every session with small talk and improvise from
// there. Now each class is built on one of FrancoLink's published live-tutor
// lessons (tutor_lessons — the same lessons human tutors teach in the lesson
// room, not the self-study course):
//
//   1. On opening, Léon offers a few lessons that fit the student's level and
//      goals and that they have not done yet (or offers to finish one).
//   2. The student picks one by tapping it or by saying it.
//   3. That lesson is taught section by section (see tutor-lesson.ts).

import type OpenAI from "openai";
import { categoryForLesson } from "@/lib/lessons/categories";

export interface ClassTopic {
  id: string;
  /** Title in the language being learned, as written in the lesson. */
  title: string;
  /** The title's English translation, when the lesson has one. */
  translation: string | null;
  level: string;
  category: string;
  minutes: number | null;
}

export interface ResumableLesson extends ClassTopic {
  /** 0-based section the student stopped on, and the lesson's section count. */
  sectionIndex: number;
  totalSections: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Svc = any;

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

/** Onboarding goals → the lesson categories that serve them best. */
const GOAL_CATEGORIES: Record<string, string[]> = {
  career: ["business", "en-business"],
  exam: ["fr-grammar", "en-grammar", "conversation", "en-conversation"],
  university: ["conversation", "en-conversation", "fr-grammar"],
  travel: ["travel-culture", "en-travel-culture"],
  family: ["conversation", "en-conversation"],
  fun: ["conversation", "en-conversation", "travel-culture", "en-travel-culture"],
};

/** Categories never offered as a class: dated news and children's lessons. */
const EXCLUDED_CATEGORIES = new Set(["daily-news", "fr-daily-news", "french-for-kids", "en-kids"]);

const OFFER_COUNT = 4;

/** conversion_notes prefix marking a lesson with no real content. */
const FILLER_NOTE = "template-filler";

/** The student's level and the one below it (the one above for A1). */
function nearbyLevels(level: string): string[] {
  const i = Math.max(0, LEVELS.indexOf(level));
  return i === 0 ? ["A1", "A2"] : [LEVELS[i], LEVELS[i - 1]];
}

interface LessonRow {
  id: string;
  title: string;
  title_translation: string | null;
  level: string;
  topic_tags: string[] | null;
  source_url: string | null;
  section_count: number | null;
  duration_minutes: number | null;
}

function toTopic(row: LessonRow, language: string): ClassTopic {
  return {
    id: row.id,
    title: row.title,
    translation: row.title_translation || null,
    level: row.level,
    category: categoryForLesson(language, row.source_url, row.topic_tags ?? []),
    minutes: row.duration_minutes ?? null,
  };
}

/** Lessons the student has already finished with Léon or covered with a tutor. */
async function doneLessonIds(svc: Svc, userId: string): Promise<Set<string>> {
  const since = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const [ai, live] = await Promise.all([
    svc
      .from("ai_tutor_conversations")
      .select("tutor_lesson_id")
      .eq("user_id", userId)
      .not("lesson_completed_at", "is", null),
    svc
      .from("lesson_coverage")
      .select("tutor_lesson_id")
      .eq("student_id", userId)
      .gte("covered_on", since),
  ]);
  const ids = new Set<string>();
  for (const r of [...(ai.data ?? []), ...(live.data ?? [])]) {
    if (r.tutor_lesson_id) ids.add(r.tutor_lesson_id);
  }
  return ids;
}

/**
 * Pick a handful of live-class lessons to offer at the start of a class:
 * the student's level first, matched to their goals, nothing they have done,
 * and from different categories so the choice feels like a real choice.
 */
export async function pickClassTopics(opts: {
  svc: Svc;
  userId: string;
  language: string;
  level: string;
  goals: string[];
  exclude?: string[];
}): Promise<ClassTopic[]> {
  const { svc, userId, language, level, goals } = opts;
  const levels = nearbyLevels(level);

  const [{ data: rows }, done] = await Promise.all([
    svc
      .from("tutor_lessons")
      .select("id, title, title_translation, level, topic_tags, source_url, section_count, duration_minutes")
      .eq("status", "published")
      .eq("language", language)
      .in("level", levels)
      .gte("section_count", 3)
      // Lessons generated from a filler template (no real content) are kept
      // in the library but never offered as a class until they are rewritten.
      .or(`conversion_notes.is.null,conversion_notes.not.like.${FILLER_NOTE}*`)
      .limit(400),
    doneLessonIds(svc, userId),
  ]);
  if (!rows?.length) return [];

  const skip = new Set([...(opts.exclude ?? []), ...done]);
  const wanted = new Set(goals.flatMap((g) => GOAL_CATEGORIES[g] ?? []));

  const scored = (rows as LessonRow[])
    .filter((r) => !skip.has(r.id))
    .map((r) => toTopic(r, language))
    .filter((t) => !EXCLUDED_CATEGORIES.has(t.category))
    .map((t) => ({
      t,
      score:
        (t.level === level ? 3 : 0) +
        (wanted.has(t.category) ? 2 : 0) +
        // Variety between classes: the same student should not see the same
        // four lessons every time they open a class.
        Math.random() * 2.5,
    }))
    .sort((a, b) => b.score - a.score);

  // One per category first, then fill up with the best of the rest.
  const picked: ClassTopic[] = [];
  const seen = new Set<string>();
  for (const { t } of scored) {
    if (picked.length >= OFFER_COUNT) break;
    if (seen.has(t.category)) continue;
    seen.add(t.category);
    picked.push(t);
  }
  for (const { t } of scored) {
    if (picked.length >= OFFER_COUNT) break;
    if (!picked.includes(t)) picked.push(t);
  }
  return picked;
}

/** The most recent lesson the student started with Léon and did not finish. */
export async function findResumableLesson(
  svc: Svc,
  userId: string,
  language: string
): Promise<ResumableLesson | null> {
  const since = new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString();
  const { data: convo, error } = await svc
    .from("ai_tutor_conversations")
    .select("tutor_lesson_id, section_index")
    .eq("user_id", userId)
    .eq("language", language)
    .not("tutor_lesson_id", "is", null)
    .is("lesson_completed_at", null)
    .gt("section_index", 0)
    .gte("last_message_at", since)
    .order("last_message_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !convo?.tutor_lesson_id) return null;

  const { data: row } = await svc
    .from("tutor_lessons")
    .select("id, title, title_translation, level, topic_tags, source_url, section_count, duration_minutes")
    .eq("id", convo.tutor_lesson_id)
    .eq("status", "published")
    .maybeSingle();
  if (!row) return null;
  return {
    ...toTopic(row as LessonRow, language),
    sectionIndex: convo.section_index,
    totalSections: (row as LessonRow).section_count ?? 0,
  };
}

/** Whether the student has never had a class with Léon before this one. */
export async function isFirstClass(svc: Svc, userId: string, currentId?: string | null): Promise<boolean> {
  let q = svc
    .from("ai_tutor_conversations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (currentId) q = q.neq("id", currentId);
  const { count, error } = await q;
  return !error && (count ?? 0) === 0;
}

const LANG_NAMES: Record<string, string> = {
  en: "English",
  fr: "French",
  es: "Spanish",
  de: "German",
  ar: "Arabic",
  pt: "Portuguese",
  it: "Italian",
};

/**
 * The language Léon should use to introduce himself: the student's own
 * (from their browser), unless that is the language they are learning, in
 * which case English (or French for someone learning English).
 */
export function studentLanguageName(browserLang: unknown, learning: string): string {
  const code = typeof browserLang === "string" ? browserLang.slice(0, 2).toLowerCase() : "";
  if (code && code !== learning && LANG_NAMES[code]) return LANG_NAMES[code];
  return learning === "en" ? "French" : "English";
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Work out which offered lesson the student chose from what they said
 * ("the weather one", "numéro deux", "let's finish the last one"), or null if
 * they have not chosen yet. `options[0]` may be the resumable lesson.
 */
export async function matchTopicChoice(opts: {
  openai: OpenAI;
  model: string;
  said: string;
  options: { id: string; title: string; translation: string | null; resume?: boolean }[];
}): Promise<{ id: string | null; tokensIn: number; tokensOut: number }> {
  const { said, options } = opts;
  if (!said.trim() || options.length === 0) return { id: null, tokensIn: 0, tokensOut: 0 };

  // Cheap path: they said a title outright.
  const heard = normalize(said);
  const direct = options.find(
    (o) =>
      (normalize(o.title).length > 3 && heard.includes(normalize(o.title))) ||
      (o.translation && normalize(o.translation).length > 3 && heard.includes(normalize(o.translation)))
  );
  if (direct) return { id: direct.id, tokensIn: 0, tokensOut: 0 };

  const list = options
    .map(
      (o, i) =>
        `${i + 1}. ${o.title}${o.translation ? ` (${o.translation})` : ""}${o.resume ? " — the unfinished lesson from last time" : ""}`
    )
    .join("\n");
  const completion = await opts.openai.chat.completions.create({
    model: opts.model,
    response_format: { type: "json_object" },
    temperature: 0,
    max_tokens: 20,
    messages: [
      {
        role: "system",
        content: `A tutor offered a language student these lessons:\n${list}\nFrom the student's reply, return JSON {"choice": n} with the number of the lesson they chose, or {"choice": null} if they did not clearly choose one (a question, a greeting, "I don't know"). "You choose" / "any" / "surprise me" counts as choosing 1.`,
      },
      { role: "user", content: said },
    ],
  });
  let id: string | null = null;
  try {
    const n = JSON.parse(completion.choices[0]?.message?.content || "{}").choice;
    if (typeof n === "number" && n >= 1 && n <= options.length) id = options[n - 1].id;
  } catch {
    /* treat as no choice */
  }
  return {
    id,
    tokensIn: completion.usage?.prompt_tokens ?? 0,
    tokensOut: completion.usage?.completion_tokens ?? 0,
  };
}
