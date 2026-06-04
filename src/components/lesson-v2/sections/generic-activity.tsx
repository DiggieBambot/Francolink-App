import { SpeakButton } from "../speak-button";
import { SectionHeader } from "../section-header";
import { TutorNotes } from "../tutor-notes";
import { SectionCard } from "../section-card";
import { RevealTranslation } from "../reveal-translation";
import type { LessonView } from "@/lib/lessons/types";
import type { LevelTheme } from "@/lib/lessons/level-theme";

// A flexible renderer for section kinds that don't have a dedicated component
// (debate, role_play, research, case_study, presentation, conversation, etc.).
// It inspects the section's fields and renders whatever recognizable content
// is present, so no lesson section ever shows as a raw "unknown" box.

interface GenericSection {
  kind: string;
  number: number;
  title?: string;
  student_instruction?: string;
  tutor_instruction?: string;
  theme?: string;
  scenario?: string;
  context?: string;
  instructions?: string;
  instruction?: string;
  roles?: string[];
  questions?: string[];
  question_translations?: string[];
  prompts?: string[];
  example_answer?: string;
  example_answer_translation?: string;
  [key: string]: unknown;
}

interface Props {
  section: GenericSection;
  view: LessonView;
  theme?: LevelTheme;
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

export function GenericActivitySection({ section, view, theme }: Props) {
  const extraInstruction = section.instructions || section.instruction;

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

      {section.theme ? (
        <div className="mb-3 rounded-lg bg-slate-100 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Theme
          </div>
          <p className="mt-0.5 text-sm font-medium text-slate-900">{section.theme}</p>
        </div>
      ) : null}

      {section.scenario ? (
        <div className="mb-3 rounded-lg bg-slate-50 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Scenario
          </div>
          <p className="mt-0.5 text-sm text-slate-800">{section.scenario}</p>
        </div>
      ) : null}

      {section.context ? (
        <p className="mb-3 text-sm text-slate-700">{section.context}</p>
      ) : null}

      {extraInstruction ? (
        <p className="mb-3 text-sm text-slate-700">{extraInstruction}</p>
      ) : null}

      {isStringArray(section.roles) && section.roles.length ? (
        <div className="mb-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Roles
          </div>
          <ul className="mt-1 space-y-1">
            {section.roles.map((r, i) => (
              <li key={i} className="flex items-start gap-2 rounded-lg border bg-white px-3 py-2 text-sm">
                <span className="flex-1">{r}</span>
                <SpeakButton text={r} size="sm" />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {isStringArray(section.questions) && section.questions.length ? (
        <ol className="space-y-2">
          {section.questions.map((q, i) => (
            <li key={i} className="rounded-lg border bg-slate-50 px-3 py-2">
              <div className="flex items-start gap-2">
                <span className="text-xs font-semibold text-slate-400">{i + 1}.</span>
                <span className="flex-1 text-sm text-slate-900">{q}</span>
                <SpeakButton text={q} size="sm" />
              </div>
              {section.question_translations?.[i] ? (
                <div className="ml-6">
                  <RevealTranslation text={section.question_translations[i]} />
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}

      {isStringArray(section.prompts) && section.prompts.length ? (
        <ol className="space-y-2">
          {section.prompts.map((p, i) => (
            <li key={i} className="flex items-start gap-2 rounded-lg border bg-slate-50 px-3 py-2">
              <span className="text-xs font-semibold text-slate-400">{i + 1}.</span>
              <span className="flex-1 text-sm text-slate-900">{p}</span>
              <SpeakButton text={p} size="sm" />
            </li>
          ))}
        </ol>
      ) : null}

      {section.example_answer ? (
        <div className="mt-3 rounded-lg bg-slate-100 p-3 text-sm">
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

      <TutorNotes view={view} instruction={section.tutor_instruction} />
    </SectionCard>
  );
}
