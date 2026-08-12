// src/lib/ai/tutor-context.ts
//
// Turns a student's curriculum progress into a compact block of prompt context.
//
// Without this the AI tutor is a generic chatbot: it cannot know the student's
// level, so "adjust to the student's level" is a guess, and it has no reason to
// steer towards the vocabulary the student is actually meant to be learning.
// With it, the tutor practises *this* student's current material — which is the
// one thing a general-purpose chatbot cannot do.
//
// Budget: this block is prepended to every single call, so it is pure recurring
// cost. Keep it small; the caps below exist for that reason, not for tidiness.

const MAX_RECENT_LESSONS = 5;
const MAX_VOCAB_ITEMS = 15;
const MAX_COVERAGE = 3;

export interface TutorContext {
  /** Ready-to-embed prompt section, or '' when there is nothing worth saying. */
  block: string;
  /** Student's CEFR level, defaulted to A1 when unknown. */
  level: string;
  studentName: string | null;
}

interface VocabRow {
  term?: string;
  translation?: string | Record<string, string>;
}

/** Vocabulary translations are either a plain string or a MultiLangString. */
function readTranslation(
  translation: VocabRow['translation'],
  uiLang: string
): string | null {
  if (!translation) return null;
  if (typeof translation === 'string') return translation;
  return translation[uiLang] || translation.en || null;
}

/**
 * Assemble the student's learning context.
 *
 * Every query here is best-effort: a student with no progress, no tutor, or a
 * course whose lessons carry no vocabulary must still get a usable tutor, so
 * failures degrade to a thinner block rather than an error.
 */
export async function buildTutorContext(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  learningLanguage: string
): Promise<TutorContext> {
  const [profileRes, langRes, progressRes, coverageRes] = await Promise.all([
    supabase
      .from('users')
      .select('name, placement_test_level, current_level, current_streak')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('user_languages')
      .select('language_code, placement_level')
      .eq('user_id', userId)
      .eq('language_code', learningLanguage)
      .maybeSingle(),
    supabase
      .from('lesson_progress')
      .select('lesson_id, status, updated_at, lessons:lesson_id (title, content)')
      .eq('user_id', userId)
      .eq('status', 'COMPLETED')
      .order('updated_at', { ascending: false })
      .limit(MAX_RECENT_LESSONS),
    supabase
      .from('lesson_coverage')
      .select('lesson_title, covered_on')
      .eq('student_id', userId)
      .order('covered_on', { ascending: false })
      .limit(MAX_COVERAGE),
  ]);

  const profile = profileRes?.data ?? null;
  const studentName = profile?.name ?? null;

  // Prefer the per-language placement, which is the most specific signal we
  // have, then the account-wide fields, then a safe beginner default.
  const level =
    langRes?.data?.placement_level ||
    profile?.placement_test_level ||
    profile?.current_level ||
    'A1';

  const progress = (progressRes?.data ?? []) as Array<{
    lessons?: { title?: string; content?: { vocabulary?: VocabRow[] } } | null;
  }>;

  const recentLessons: string[] = [];
  const vocab: string[] = [];
  const seenTerms = new Set<string>();

  for (const row of progress) {
    const lesson = row.lessons;
    if (!lesson) continue;
    if (lesson.title) recentLessons.push(lesson.title);

    for (const item of lesson.content?.vocabulary ?? []) {
      if (vocab.length >= MAX_VOCAB_ITEMS) break;
      const term = item.term?.trim();
      if (!term) continue;
      const key = term.toLowerCase();
      if (seenTerms.has(key)) continue;
      seenTerms.add(key);

      const translation = readTranslation(item.translation, 'en');
      vocab.push(translation ? `${term} (${translation})` : term);
    }
  }

  const coverage = ((coverageRes?.data ?? []) as Array<{ lesson_title?: string }>)
    .map((c) => c.lesson_title)
    .filter((t): t is string => Boolean(t));

  const lines: string[] = [];

  if (studentName) lines.push(`Student name: ${studentName}`);
  lines.push(`Current level: ${level} (CEFR)`);

  if (profile?.current_streak > 1) {
    lines.push(`Current practice streak: ${profile.current_streak} days`);
  }
  if (recentLessons.length > 0) {
    lines.push(`Recently completed lessons: ${recentLessons.join('; ')}`);
  }
  if (coverage.length > 0) {
    lines.push(`Recently covered with their human tutor: ${coverage.join('; ')}`);
  }
  if (vocab.length > 0) {
    lines.push(
      `Vocabulary they have been learning (work these into the conversation where it fits naturally): ${vocab.join(', ')}`
    );
  }

  return {
    block: `What you know about this student:\n${lines.map((l) => `- ${l}`).join('\n')}`,
    level,
    studentName,
  };
}
