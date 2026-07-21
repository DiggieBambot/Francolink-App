import Image from "next/image";
import { ReadAloud } from "../read-aloud";
import { SectionHeader } from "../section-header";
import { TutorNotes } from "../tutor-notes";
import { SectionCard } from "../section-card";
import { RevealTranslation } from "../reveal-translation";
import { useLessonTTSLocale } from "../lesson-language-context";
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
  const ttsLocale = useLessonTTSLocale();
  const isEnglish = ttsLocale.toLowerCase().startsWith("en");
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
        <figure className="mb-6">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-gray-100 shadow-soft">
            <Image
              src={section.image_url}
              alt={section.title || "Reading passage"}
              fill
              sizes="(max-width: 768px) 100vw, 720px"
              className="object-cover object-top"
            />
          </div>
          {section.image_hint ? (
            <figcaption className="mt-2 text-center text-xs italic text-gray-400">{section.image_hint}</figcaption>
          ) : null}
        </figure>
      ) : null}

      {/* Magazine-style reading column — ReadAloud renders the paragraphs and
          washes a highlight across them as it reads aloud. */}
      <article className="mx-auto max-w-[68ch]">
        <ReadAloud text={section.passage} lang={ttsLocale} />
        {section.passage_translation ? (
          <div className="mt-5 border-t border-gray-100 pt-4">
            <RevealTranslation text={section.passage_translation} size="sm" />
          </div>
        ) : null}
      </article>

      {/* Comprehension questions (answers shown in tutor view only) */}
      {section.questions?.length ? (
        <div className="mx-auto mt-8 max-w-[68ch]">
          <h4 className="mb-3 font-heading text-lg font-bold text-primary">
            {isEnglish ? "Comprehension" : "Compréhension"}
          </h4>
          <ol className="space-y-3">
            {section.questions.map((q, i) => (
              <li key={i} className="rounded-xl border border-gray-100 bg-white p-4 shadow-soft">
                <p className="font-medium text-gray-800">
                  <span className="mr-2 font-bold text-primary">{i + 1}.</span>
                  {q.question}
                </p>
                {view === "tutor" && q.answer ? (
                  <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                    <span className="font-semibold">{isEnglish ? "Answer: " : "Réponse : "}</span>
                    {q.answer}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <TutorNotes view={view} instruction={section.tutor_instruction} />
    </SectionCard>
  );
}
