import Image from "next/image";
import { SpeakButton } from "../speak-button";
import { SectionHeader } from "../section-header";
import { TutorNotes } from "../tutor-notes";
import { RevealTranslation } from "../reveal-translation";
import { SectionCard } from "../section-card";
import type { ImageQuestionPromptsSection, LessonView } from "@/lib/lessons/types";
import type { LevelTheme } from "@/lib/lessons/level-theme";

interface Props {
  section: ImageQuestionPromptsSection;
  view: LessonView;
  theme?: LevelTheme;
}

export function ImageQuestionPromptsSectionComp({ section, view, theme }: Props) {
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

      {section.example?.student_question ? (
        <div className="mb-4 rounded-lg bg-slate-100 p-3 text-sm italic">
          <strong className="not-italic">Ex.</strong> {section.example.student_question}
        </div>
      ) : null}

      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {section.prompts.map((p, i) => (
          <li key={i} className="overflow-hidden rounded-xl border bg-slate-50">
            <div className="relative aspect-[4/3] w-full bg-slate-200">
              {p.image_url ? (
                <Image
                  src={p.image_url}
                  alt={p.image_hint}
                  fill
                  sizes="(max-width: 640px) 100vw, 400px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  {p.image_hint}
                </div>
              )}
            </div>
            <div className="p-3">
              <div className="text-xs font-semibold text-slate-400">#{i + 1}</div>
              <div className="mt-1 flex items-start gap-2">
                <p className="flex-1 text-sm text-slate-900">{p.question}</p>
                <SpeakButton text={p.question} size="sm" />
              </div>
              {p.question_translation ? (
                <div className="mt-0.5">
                  <RevealTranslation text={p.question_translation} />
                </div>
              ) : null}
              {view === "tutor" ? (
                <div className="mt-2 text-xs italic text-emerald-700">
                  image hint: {p.image_hint}
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      <TutorNotes view={view} instruction={section.tutor_instruction} />
    </SectionCard>
  );
}
