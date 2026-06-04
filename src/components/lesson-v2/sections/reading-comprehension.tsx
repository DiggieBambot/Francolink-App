import Image from "next/image";
import { SpeakButton } from "../speak-button";
import { SectionHeader } from "../section-header";
import { TutorNotes } from "../tutor-notes";
import { SectionCard } from "../section-card";
import { RevealTranslation } from "../reveal-translation";
import { Highlightable } from "../highlightable";
import type { LessonView, ReadingComprehensionSection } from "@/lib/lessons/types";
import type { LevelTheme } from "@/lib/lessons/level-theme";

interface Props {
  section: ReadingComprehensionSection;
  view: LessonView;
  sectionIdx?: number;
  theme?: LevelTheme;
}

export function ReadingComprehensionSectionComp({
  section,
  view,
  sectionIdx = 0,
  theme,
}: Props) {
  // Split the passage into paragraphs for cleaner display + per-paragraph audio.
  const paragraphs = section.passage
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

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

      {section.image_url ? (
        <div className="relative mb-4 aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-200">
          <Image
            src={section.image_url}
            alt={section.title || "Reading passage"}
            fill
            sizes="(max-width: 768px) 100vw, 720px"
            className="object-cover"
          />
        </div>
      ) : null}

      <article className="rounded-xl border bg-amber-50/30 p-5 leading-relaxed text-slate-800">
        <div className="mb-3 flex items-center justify-end gap-2">
          <SpeakButton text={section.passage} size="md" />
        </div>
        <div className="space-y-4 text-base">
          {paragraphs.map((p, i) => (
            <p key={i} className="relative">
              <Highlightable
                id={`s${sectionIdx}/p${i}/passage`}
                text={p}
                sectionIdx={sectionIdx}
              >
                {p}
              </Highlightable>
              {p.length > 100 ? (
                <span className="absolute right-0 top-0 -mr-2">
                  <SpeakButton text={p} size="sm" />
                </span>
              ) : null}
            </p>
          ))}
        </div>
        {section.passage_translation ? (
          <div className="mt-4 border-t border-amber-200 pt-3">
            <RevealTranslation text={section.passage_translation} size="sm" />
          </div>
        ) : null}
      </article>

      <TutorNotes view={view} instruction={section.tutor_instruction} />
    </SectionCard>
  );
}
