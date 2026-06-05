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
  // Tolerate both shapes: free_response uses `questions: string[]`, while many
  // `discussion` sections use `items: [{ question, question_translation }]`.
  const items = (section as { items?: { question?: string; question_translation?: string }[] }).items;
  const questions: string[] = Array.isArray(section.questions)
    ? section.questions
    : Array.isArray(items)
      ? items.map((it) => it?.question || "").filter(Boolean)
      : [];
  const questionTranslations: (string | undefined)[] = Array.isArray(section.question_translations)
    ? section.question_translations
    : Array.isArray(items)
      ? items.map((it) => it?.question_translation)
      : [];
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
              <span className="flex-1 text-sm text-slate-900">{q}</span>
              <SpeakButton text={q} size="sm" />
            </div>
            {questionTranslations?.[i] ? (
              <div className="ml-6">
                <RevealTranslation text={questionTranslations[i]!} />
              </div>
            ) : null}
          </li>
        ))}
      </ol>

      <TutorNotes view={view} instruction={section.tutor_instruction} />
    </SectionCard>
  );
}
