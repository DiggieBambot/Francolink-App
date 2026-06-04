import { SpeakButton } from "../speak-button";
import { SectionHeader } from "../section-header";
import { TutorNotes } from "../tutor-notes";
import { RevealTranslation } from "../reveal-translation";
import { SectionCard } from "../section-card";
import type { LessonView, MatchingQASection } from "@/lib/lessons/types";
import type { LevelTheme } from "@/lib/lessons/level-theme";

interface Props {
  section: MatchingQASection;
  view: LessonView;
  theme?: LevelTheme;
}

export function MatchingQASectionComp({ section, view, theme }: Props) {
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

      <ul className="divide-y rounded-xl border">
        {section.pairs.map((p, i) => (
          <li key={i} className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 sm:gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Q{i + 1}</span>
                <span className="text-sm text-slate-900">{p.question}</span>
                <SpeakButton text={p.question} size="sm" />
              </div>
              {p.question_translation ? (
                <div className="ml-7">
                  <RevealTranslation text={p.question_translation} />
                </div>
              ) : null}
            </div>
            <div
              className={`rounded ${view === "tutor" ? "bg-emerald-50 px-2 py-1" : ""}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">A</span>
                <span
                  className={`text-sm ${
                    view === "tutor" ? "text-emerald-900" : "text-slate-400"
                  }`}
                >
                  {view === "tutor" ? p.answer : "____________"}
                </span>
                {view === "tutor" ? <SpeakButton text={p.answer} size="sm" /> : null}
              </div>
              {view === "tutor" && p.answer_translation ? (
                <div className="ml-6">
                  <RevealTranslation text={p.answer_translation} />
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <TutorNotes view={view} instruction={section.tutor_instruction} />
    </SectionCard>
  );
}
