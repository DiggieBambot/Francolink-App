// Shared types for tutor_lessons.content (v2 schema produced by the Gemini converter).

export type SectionKind =
  | "warmup_vocabulary"
  | "vocabulary_with_examples"
  | "fill_in_blank_dialogue"
  | "fill_in_blank_dialogue_extended"
  | "dialogue_read_aloud"
  | "reading_comprehension"
  | "matching_qa"
  | "word_order"
  | "image_question_prompts"
  | "free_response"
  | "grammar_explainer";

export type Skill = "speaking" | "listening" | "reading" | "writing" | "grammar" | "vocabulary";

export interface VocabItem {
  term: string;
  /** Optional override sent to TTS instead of `term` (e.g. alphabet cards where
   *  the displayed term is the bare letter "A" but the audio needs "Ache"). */
  tts_text?: string;
  translation?: string;
  part_of_speech?: string; // "noun", "verb", "adjective", "phrase", etc.
  pronunciation?: string; // IPA approximation, e.g. /ʃo.sy.ʁ/
  gender?: "m" | "f" | "m/f";
  example?: string;
  example_translation?: string;
  note?: string;
  image_query?: string; // concrete English scene query for Pexels
  image_url?: string; // populated by hydrator
}

export interface Exchange {
  speaker: string;
  speaker_role?: "tutor" | "student";
  avatar_seed?: string; // stable seed for DiceBear avatar
  text: string;
  translation?: string;
  blank?: number | number[];
}

export interface DialogueLine {
  speaker: string;
  role?: "tutor" | "student";
  avatar_seed?: string;
  text: string;
  translation?: string;
}

export interface MatchingPair {
  question: string;
  answer: string;
  question_translation?: string;
  answer_translation?: string;
}

export interface WordOrderItem {
  scrambled: string;
  /** The correct French ordering of the scrambled words (Gemini-generated). */
  correct?: string;
  expected_topic?: string;
}

export interface ImagePrompt {
  question: string;
  question_translation?: string;
  image_hint: string;
  image_url?: string; // populated by hydrator
}

export interface BaseSection {
  kind: SectionKind;
  number: number;
  title?: string;
  student_instruction?: string;
  tutor_instruction?: string;
}

export interface WarmupVocabSection extends BaseSection {
  kind: "warmup_vocabulary";
  items: VocabItem[];
}
export interface VocabExamplesSection extends BaseSection {
  kind: "vocabulary_with_examples";
  items: VocabItem[];
}
export interface FillBlankDialogueSection extends BaseSection {
  kind: "fill_in_blank_dialogue";
  example?: { tutor_line: string; student_line: string };
  exchanges: Exchange[];
  answer_pool: string[];
  valid_answers_by_blank: Record<string, string[]>;
}
export interface FillBlankDialogueExtendedSection extends BaseSection {
  kind: "fill_in_blank_dialogue_extended";
  example?: { tutor_line: string; student_line: string };
  exchanges: Exchange[];
  answer_pool: string[];
  valid_answers_by_blank: Record<string, string[]>;
  student_role?: string;
  tutor_role?: string;
}
export interface DialogueReadAloudSection extends BaseSection {
  kind: "dialogue_read_aloud";
  context?: string;
  context_image_url?: string;
  student_role?: string;
  tutor_role?: string;
  lines: DialogueLine[];
}
export interface MatchingQASection extends BaseSection {
  kind: "matching_qa";
  pairs: MatchingPair[];
  /** Set false to hide the audio buttons (e.g. drills whose text is English). */
  speak?: boolean;
}
export interface WordOrderSection extends BaseSection {
  kind: "word_order";
  example?: { scrambled: string; correct: string };
  items: WordOrderItem[];
}
export interface ImageQuestionPromptsSection extends BaseSection {
  kind: "image_question_prompts";
  example?: { student_question: string };
  prompts: ImagePrompt[];
}
export interface ReadingComprehensionSection extends BaseSection {
  kind: "reading_comprehension";
  passage: string;
  passage_translation?: string;
  /** Optional image to accompany the passage. */
  image_hint?: string;
  image_url?: string;
  /** Optional comprehension questions (answer shown in tutor view only). */
  questions?: { question: string; answer?: string }[];
}

export interface GrammarTableRow {
  /** Cells rendered left-to-right. The `speak` index (if set) gets a TTS button. */
  cells: string[];
}
export interface GrammarTable {
  headers: string[];
  rows: GrammarTableRow[];
  /** Column index whose cell is the French form to read aloud (0-based). */
  speak_col?: number;
}
export interface GrammarMistake {
  wrong: string;
  right: string;
  note?: string;
}
export interface GrammarExplainerSection extends BaseSection {
  kind: "grammar_explainer";
  /** Plain-language rule, may contain **bold** markers for key forms. */
  explanation: string;
  explanation_translation?: string;
  /** Optional conjugation / agreement table. */
  table?: GrammarTable;
  /** A second table (e.g. contrasting être vs avoir). */
  table_secondary?: GrammarTable;
  /** Short worked examples (French + gloss), each playable. */
  examples?: { text: string; translation?: string; note?: string }[];
  /** Student-visible "common mistakes" — the heart of the expert layer. */
  common_mistakes?: GrammarMistake[];
  /** Memory aids / pro tips (encouraging, practical). */
  tips?: string[];
  /** Exceptions & "good to know" — irregular cases, edge rules. */
  exceptions?: { title: string; detail: string }[];
}

export interface FreeResponseSection extends BaseSection {
  kind: "free_response";
  example_answer?: string;
  example_answer_translation?: string;
  questions: string[];
  question_translations?: string[];
}

export type Section =
  | WarmupVocabSection
  | VocabExamplesSection
  | FillBlankDialogueSection
  | FillBlankDialogueExtendedSection
  | DialogueReadAloudSection
  | ReadingComprehensionSection
  | MatchingQASection
  | WordOrderSection
  | ImageQuestionPromptsSection
  | FreeResponseSection
  | GrammarExplainerSection;

export interface Objective {
  student_label: string;
  skill: Skill;
  cefr_can_do: string;
}

export interface TutorOverview {
  skills_covered?: string[];
  estimated_minutes?: number;
  teaching_tips?: string[];
  common_mistakes?: string[];
}

export interface Lesson {
  slug: string;
  title: string;
  title_translation?: string;
  language: string;
  level: string;
  duration_minutes?: number;
  topic_tags: string[];
  objectives: Objective[];
  /** Student-facing tips for this lesson (2-4 short, encouraging notes). */
  learning_tips?: string[];
  tutor_overview?: TutorOverview;
  hero_image_hint?: string;
  hero_image_url?: string; // populated by hydrator
  sections: Section[];
}

export type LessonView = "student" | "tutor";
