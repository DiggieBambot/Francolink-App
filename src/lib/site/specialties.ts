// Tutor specialties and the student-facing goals built on them — one list.
//
// Tutors pick specialties from SPECIALTY_OPTIONS; free text is no longer
// accepted (it produced "conversation" next to "Conversation", and goals that
// only one profile ever used). Students never see that list in the "help me
// choose" card: they pick a plain-language GOAL, and a tutor matches a goal if
// any of their specialties is in it.
//
// Matching is case-insensitive throughout, so profiles saved before the list
// was locked still match until the cleanup migration has been run.

export const SPECIALTY_OPTIONS = [
  // Exams
  "DELF",
  "DALF",
  "TEF",
  "TCF",
  "TEFAQ",
  "Exam prep",
  "TOEIC",
  "IELTS",
  "TOEFL",
  // Speaking
  "Conversation",
  "Pronunciation",
  "Travel French",
  // Foundations
  "French for beginners",
  "English for beginners",
  "Grammar",
  "Writing and essays",
  "Reading comprehension",
  "Listening comprehension",
  // Work
  "Business French",
  "Business English",
  "Interview preparation",
  "Medical French",
  "Legal French",
  // Immigration
  "Immigration French",
  // School
  "Kids and teens",
  "Academic French",
  "Homework help",
] as const;

const CANONICAL = new Map(SPECIALTY_OPTIONS.map((s) => [s.toLowerCase(), s as string]));

/** The canonical spelling of a specialty, or null if it isn't on the list. */
export function canonicalSpecialty(raw: string): string | null {
  return CANONICAL.get(raw.trim().toLowerCase()) ?? null;
}

export interface Goal {
  key: string;
  label: string;
  /** Lower-cased specialties that count as serving this goal. */
  specialties: string[];
}

/**
 * What students choose from. Deliberately few, and worded as outcomes rather
 * than course names. A specialty may serve more than one goal (TCF is both an
 * exam and the Canada-immigration test).
 */
export const GOALS: Goal[] = [
  {
    key: "speak",
    label: "Speak with confidence",
    specialties: ["conversation", "pronunciation", "travel french"],
  },
  {
    key: "exam",
    label: "Pass an exam (DELF, TCF, TEF…)",
    specialties: ["delf", "dalf", "tef", "tcf", "tefaq", "exam prep", "toeic", "ielts", "toefl", "tcf canada"],
  },
  {
    key: "immigration",
    label: "Move to Canada or France",
    specialties: ["immigration french", "tcf", "tef", "tefaq", "tcf canada"],
  },
  {
    key: "work",
    label: "Use it at work",
    specialties: ["business french", "business english", "interview preparation", "medical french", "legal french"],
  },
  {
    key: "basics",
    label: "Build strong basics",
    specialties: [
      "french for beginners",
      "english for beginners",
      "grammar",
      "writing and essays",
      "reading comprehension",
      "listening comprehension",
    ],
  },
  {
    key: "school",
    label: "School, kids or homework",
    specialties: ["kids and teens", "academic french", "homework help"],
  },
];

const GOAL_BY_KEY = new Map(GOALS.map((g) => [g.key, g]));

export function goalByKey(key: string): Goal | undefined {
  return GOAL_BY_KEY.get(key);
}

/** Whether a tutor with these specialties serves the goal. Unknown goal → true. */
export function tutorHasGoal(specialties: string[], goalKey: string): boolean {
  const goal = GOAL_BY_KEY.get(goalKey);
  if (!goal) return true;
  return specialties.some((s) => goal.specialties.includes(s.trim().toLowerCase()));
}
