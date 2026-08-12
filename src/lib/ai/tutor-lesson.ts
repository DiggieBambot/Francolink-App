// src/lib/ai/tutor-lesson.ts
//
// Lets the AI tutor teach an actual published lesson rather than improvise.
//
// `tutor_lessons.content` is already a fully structured LessonContent v2.0
// document (see src/types/lesson-content.ts): ordered, typed sections with
// per-role instructions, vocabulary with translations and examples, and tutor
// notes listing the mistakes students usually make. All of that was written for
// human tutors; none of it was reaching the AI one. This module flattens the
// section the student is currently on into prompt text.

import type {
  LessonContent,
  LessonSection,
  MultiLangString,
} from '@/types/lesson-content';

/** Sections the tutor should not try to run conversationally. */
const SKIPPED_SECTION_TYPES = new Set(['reading', 'listening']);

export interface TutorLessonState {
  lessonId: string;
  title: string;
  totalSections: number;
  sectionIndex: number;
  /** Prompt text describing the lesson and the current section. */
  block: string;
  /** True when `sectionIndex` is past the last runnable section. */
  finished: boolean;
}

function pick(value: MultiLangString | string | undefined, uiLang = 'en'): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[uiLang as keyof MultiLangString] || value.fr || '';
}

function describeSection(section: LessonSection, uiLang: string): string {
  const parts: string[] = [
    `Section ${section.order + 1} — ${pick(section.title, uiLang)} (${section.type})`,
  ];

  const instructions = pick(section.studentInstructions, uiLang);
  if (instructions) parts.push(`What the student should do: ${instructions}`);

  // Section content is a discriminated union; only pull out the shapes that
  // give the tutor something concrete to work with.
  const content = section.content as unknown as Record<string, unknown> | undefined;

  if (content?.type === 'vocabulary' && Array.isArray(content.items)) {
    const terms = (content.items as Array<{ term?: string; translation?: MultiLangString }>)
      .slice(0, 12)
      .map((i) => {
        const t = pick(i.translation, uiLang);
        return t ? `${i.term} (${t})` : i.term;
      })
      .filter(Boolean);
    if (terms.length) parts.push(`Vocabulary to drill: ${terms.join(', ')}`);
  }

  if (content?.type === 'dialogue' && Array.isArray(content.speakers)) {
    parts.push(
      `Run this as a dialogue. Take one role and have the student take the other.`
    );
  }

  if (content?.type === 'roleplay') {
    const setting = pick(content.setting as MultiLangString | undefined, uiLang);
    parts.push(`Role-play${setting ? ` — setting: ${setting}` : ''}.`);
  }

  if (content?.type === 'grammar') {
    const explanation = pick(content.explanation as MultiLangString | undefined, uiLang);
    if (explanation) parts.push(`Grammar point: ${explanation}`);
  }

  return parts.join('\n');
}

/**
 * Build the lesson-mode prompt block for the section the student is on.
 *
 * Returns null when the lesson has no usable structured content, so the caller
 * can fall back to open conversation rather than fail.
 */
export function buildLessonState(
  lessonId: string,
  content: LessonContent | null,
  sectionIndex: number,
  uiLang = 'en'
): TutorLessonState | null {
  if (!content) return null;

  const sections = [...(content.sections ?? [])]
    .filter((s) => !SKIPPED_SECTION_TYPES.has(s.type))
    .sort((a, b) => a.order - b.order);

  if (sections.length === 0) return null;

  const title = pick(content.title, uiLang) || 'this lesson';
  const finished = sectionIndex >= sections.length;

  const header = [
    `You are teaching a specific lesson: "${title}" (level ${content.targetLevel}).`,
    content.objectives?.length
      ? `Objectives: ${content.objectives.map((o) => pick(o, uiLang)).filter(Boolean).join('; ')}`
      : '',
    content.tutorNotes?.commonMistakes?.length
      ? `Watch for these common mistakes: ${content.tutorNotes.commonMistakes
          .map((m) => pick(m, uiLang))
          .filter(Boolean)
          .join('; ')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  const body = finished
    ? `The student has worked through every section. Wrap up: recap what they practised, praise something specific they did well, and name one thing to work on next.`
    : [
        describeSection(sections[sectionIndex], uiLang),
        '',
        `Work through this section conversationally — do not dump it as a list. When the student has genuinely practised it, set "sectionComplete" to true in your response so we advance to section ${sectionIndex + 2} of ${sections.length}. Until then, keep "sectionComplete" false.`,
      ].join('\n');

  return {
    lessonId,
    title,
    totalSections: sections.length,
    sectionIndex,
    block: `${header}\n\n${body}`,
    finished,
  };
}
