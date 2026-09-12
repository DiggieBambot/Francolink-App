import { SpeakButton } from "../speak-button";
import { SectionHeader } from "../section-header";
import { TutorNotes } from "../tutor-notes";
import { RevealTranslation } from "../reveal-translation";
import { SectionCard } from "../section-card";
import type { FreeResponseSection, LessonView } from "@/lib/lessons/types";
import type { LevelTheme } from "@/lib/lessons/level-theme";

interface Props {
  section: FreeResponseSection;
  view: LessonView;
  theme?: LevelTheme;
}

export function FreeResponseSectionComp({ section, view, theme }: Props) {
  // Tolerate every shape this section has ever been generated in:
  // `questions: string[]`, `questions: [{ question, answer }]` (some Daily News
  // generations come back that way), or `items: [{ question, question_translation }]`
  // on `discussion` sections. An object reaching the JSX crashes the whole page,
  // so each entry is flattened to its text here, answer and translation kept
  // alongside it so nothing can fall out of step.
  const items = (section as { items?: { question?: string; question_translation?: string }[] }).items;
  const raw: unknown[] = Array.isArray(section.questions)
    ? (section.questions as unknown[])
    : Array.isArray(items)
      ? items
      : [];
  const str = (v: unknown): string | undefined =>
    typeof v === "string" && v.trim() ? v : undefined;
  const questions = raw
    .map((q, i) => {
      const o = (q ?? {}) as { question?: unknown; question_translation?: unknown; answer?: unknown };
      return {
        text: typeof q === "string" ? str(q) : str(o.question),
        translation:
          str(Array.isArray(section.question_translations) ? section.question_translations[i] : undefined) ||
          str(o.question_translation),
        // Object-shaped questions may carry a model answer. Tutor view only,
        // same as reading comprehension.
        answer: str(o.answer),
      };
    })
    .filter((q) => Boolean(q.text))
    .map((q) => ({ ...q, text: q.text as string }));

  return (
    <SectionCard theme={theme}>
      <SectionHeader
        view={view}
        number={section.number}
        kind={section.kind}
        title={section.title}
        student_instruction={section.student_instruction}
        theme={theme}
      />

      {section.example_answer ? (
        <div className="mb-4 rounded-lg bg-slate-100 p-3 text-sm">
          <div className="flex items-center gap-2 italic">
            <strong className="not-italic">Ex.</strong>
            <span>{section.example_answer}</span>
            <SpeakButton text={section.example_answer} size="sm" />
          </div>
          {section.example_answer_translation ? (
            <div className="mt-0.5 ml-6">
              <RevealTranslation text={section.example_answer_translation} />
            </div>
          ) : null}
        </div>
      ) : null}

      <ol className="space-y-2">
        {questions.map((q, i) => (
          <li
            key={i}
            className="rounded-lg border bg-slate-50 px-3 py-2"
          >
            <div className="flex items-start gap-2">
              <span className="text-xs font-semibold text-slate-400">{i + 1}.</span>
              <span className="flex-1 text-sm text-slate-900">{q.text}</span>
              <SpeakButton text={q.text} size="sm" />
            </div>
            {q.translation ? (
              <div className="ml-6">
                <RevealTranslation text={q.translation} />
              </div>
            ) : null}
            {view === "tutor" && q.answer ? (
              <p className="ml-6 mt-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm text-emerald-900">
                {q.answer}
              </p>
            ) : null}
          </li>
        ))}
      </ol>

      <TutorNotes view={view} instruction={section.tutor_instruction} />
    </SectionCard>
  );
}
