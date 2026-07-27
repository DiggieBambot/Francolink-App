// Types for optional per-lesson homework (attached to /library tutor_lessons).

// "short"/"long" = free-text (tutor-graded). The rest are interactive and
// self-checkable: the student answer is still stored as a string and submitted
// to the tutor, but the panel can show instant right/wrong feedback and the
// tutor review sees whether it matched `answer`.
export type HomeworkQuestionType =
  | "short"
  | "long"
  | "fill_blank"
  | "mcq"
  | "reorder";

export interface HomeworkQuestion {
  prompt: string;
  prompt_translation?: string;
  hint?: string;
  type: HomeworkQuestionType;
  /** mcq: choices to pick from. reorder: the scrambled tokens (any order). */
  options?: string[];
  /** The correct answer (fill_blank / mcq / reorder), used for self-check +
   *  tutor reference. reorder: the correctly-ordered sentence. Omitted for
   *  free-text questions. */
  answer?: string;
  /** fill_blank: sentence containing "___" where the answer goes. */
  sentence?: string;
}

/** Normalise a homework answer for lenient comparison (case/space/punct). */
export function answerMatches(question: HomeworkQuestion, given: string): boolean | null {
  if (!question.answer || question.type === "short" || question.type === "long") return null;
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // strip accents so é === e
      .replace(/[.,!?;:'’"]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  return norm(given) === norm(question.answer);
}

export type HomeworkStatus = "draft" | "published";

export interface Homework {
  id: string;
  lesson_id: string;
  lesson_slug: string;
  title: string;
  instructions: string | null;
  questions: HomeworkQuestion[];
  status: HomeworkStatus;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type SubmissionStatus = "submitted" | "reviewed";

export interface HomeworkAnswer {
  answer: string;
}

export interface HomeworkSubmission {
  id: string;
  homework_id: string;
  lesson_id: string;
  student_id: string;
  tutor_id: string | null;
  answers: HomeworkAnswer[];
  status: SubmissionStatus;
  tutor_feedback: string | null;
  reviewed_at: string | null;
  submitted_at: string;
  updated_at: string;
}
