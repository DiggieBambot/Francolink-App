import Image from "next/image";
import { SpeakButton } from "../speak-button";
import { SectionHeader } from "../section-header";
import { TutorNotes } from "../tutor-notes";
import { Avatar } from "../avatar";
import { Highlightable } from "../highlightable";
import { RevealTranslation } from "../reveal-translation";
import { SectionCard } from "../section-card";
import type { DialogueReadAloudSection, LessonView } from "@/lib/lessons/types";
import type { LevelTheme } from "@/lib/lessons/level-theme";

interface Props {
  section: DialogueReadAloudSection;
  view: LessonView;
  sectionIdx?: number;
  theme?: LevelTheme;
}

export function DialogueReadAloudSectionComp({ section, view, sectionIdx = 0, theme }: Props) {
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

      {section.context_image_url ? (
        <div className="relative mb-4 aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-200">
          <Image
            src={section.context_image_url}
            alt={section.context || section.title || ""}
            fill
            sizes="(max-width: 768px) 100vw, 720px"
            className="object-cover"
          />
          {section.context ? (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-sm text-white">
              {section.context}
            </div>
          ) : null}
        </div>
      ) : null}

      {section.student_role || section.tutor_role ? (
        <div className="mb-3 text-xs text-slate-600">
          <strong>You:</strong> {section.student_role}
          {section.tutor_role ? <> · <strong>Tutor:</strong> {section.tutor_role}</> : null}
        </div>
      ) : null}

      <div className="space-y-3">
        {section.lines.map((line, i) => {
          const isTutor = line.role === "tutor";
          return (
            <div
              key={i}
              className={`flex items-start gap-2 ${isTutor ? "" : "flex-row-reverse"}`}
            >
              <Avatar seed={line.avatar_seed || line.speaker} size={36} />
              <div className={`max-w-[78%] ${isTutor ? "items-start" : "items-end"} flex flex-col`}>
                <div className="mb-0.5 text-[11px] font-semibold text-slate-500">
                  {line.speaker}
                </div>
                <div
                  className={`rounded-2xl px-3.5 py-2 text-sm ${
                    isTutor
                      ? "rounded-tl-sm bg-amber-100 text-amber-950"
                      : "rounded-tr-sm bg-emerald-100 text-emerald-950"
                  }`}
                >
                  <div className="flex items-start gap-1.5">
                    <Highlightable
                      id={`s${sectionIdx}/l${i}/text`}
                      text={line.text}
                      sectionIdx={sectionIdx}
                      className="flex-1"
                    >
                      {line.text}
                    </Highlightable>
                    <SpeakButton text={line.text} size="sm" />
                  </div>
                  {line.translation ? (
                    <div className="mt-1 border-t border-black/5 pt-1">
                      <RevealTranslation text={line.translation} />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <TutorNotes view={view} instruction={section.tutor_instruction} />
    </SectionCard>
  );
}
