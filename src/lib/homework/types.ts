// Types for optional per-lesson homework (attached to /library tutor_lessons).

export type HomeworkQuestionType = "short" | "long";

export interface HomeworkQuestion {
  prompt: string;
  prompt_translation?: string;
  hint?: string;
  type: HomeworkQuestionType;
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
