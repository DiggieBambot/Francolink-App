"use client";

import { Fragment } from "react";
import { AlertTriangle, ArrowRight, Sparkles, Lightbulb, KeyRound } from "lucide-react";
import { SectionHeader } from "../section-header";
import { SectionCard } from "../section-card";
import { TutorNotes } from "../tutor-notes";
import { SpeakButton } from "../speak-button";
import { RevealTranslation } from "../reveal-translation";
import { useLessonTTSLocale } from "../lesson-language-context";
import type { GrammarTable, GrammarExplainerSection, LessonView } from "@/lib/lessons/types";
import type { LevelTheme } from "@/lib/lessons/level-theme";

interface Props {
  section: GrammarExplainerSection;
  view: LessonView;
  sectionIdx?: number;
  theme?: LevelTheme;
}

/** Render **bold** (key forms, in brand colour) and *italic* markers. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-primary">
              {p.slice(2, -2)}
            </strong>
          );
        }
        if (p.startsWith("*") && p.endsWith("*") && p.length > 2) {
          return (
            <em key={i} className="font-medium italic text-gray-900">
              {p.slice(1, -1)}
            </em>
          );
        }
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

function ConjugationTable({ table }: { table: GrammarTable }) {
  const speakCol = table.speak_col ?? -1;
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-soft">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-primary/10">
            {table.headers.map((h, i) => (
              <th
                key={i}
                className="px-4 py-2.5 text-left font-heading text-xs font-bold uppercase tracking-wide text-primary"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, r) => (
            <tr
              key={r}
              className="border-t border-gray-100 odd:bg-white even:bg-gray-50/60"
            >
              {row.cells.map((cell, c) => (
                <td
                  key={c}
                  className={`px-4 py-2.5 align-middle ${c === speakCol ? "font-semibold text-gray-900"
                      : "text-gray-600"
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <RichText text={cell} />
                    {c === speakCol && cell.trim() ? (
                      <SpeakButton text={cell.replace(/\*\*/g, "")} size="sm" />
                    ) : null}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function GrammarExplainerSectionComp({ section, view, theme }: Props) {
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

      {/* The rule — a calm, magazine-style prose column. */}
      <article className="mx-auto max-w-[68ch]">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft">
          <p className="text-[15px] leading-relaxed text-gray-800">
            <RichText text={section.explanation} />
          </p>
          {section.explanation_translation ? (
            <div className="mt-4 border-t border-gray-100 pt-3">
              <RevealTranslation text={section.explanation_translation} size="sm" />
            </div>
          ) : null}
        </div>

        {/* Conjugation / agreement tables with per-form TTS. */}
        {section.table ? (
          <div className="mt-6">
            <ConjugationTable table={section.table} />
          </div>
        ) : null}
        {section.table_secondary ? (
          <div className="mt-4">
            <ConjugationTable table={section.table_secondary} />
          </div>
        ) : null}

        {/* Worked examples — each playable. */}
        {section.examples?.length ? (
          <div className="mt-6 space-y-2.5">
            {section.examples.map((ex, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-xl border border-primary/15 bg-primary/[0.04] px-4 py-3"
              >
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 font-medium text-gray-900">
                    <RichText text={ex.text} />
                    <SpeakButton text={ex.text.replace(/\*\*/g, "")} size="sm" />
                  </p>
                  {ex.translation ? (
                    <p className="mt-0.5 text-sm italic text-gray-500">
                      {ex.translation}
                    </p>
                  ) : null}
                  {ex.note ? (
                    <p className="mt-1 text-xs text-gray-500">
                      <RichText text={ex.note} />
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Common mistakes — student-visible, the expert layer. */}
        {section.common_mistakes?.length ? (
          <div className="mt-8">
            <h4 className="mb-3 flex items-center gap-2 font-heading text-lg font-bold text-amber-700">
              <AlertTriangle className="h-5 w-5" />
              {isEnglish ? "Common mistakes" : "Erreurs fréquentes"}
            </h4>
            <ul className="space-y-3">
              {section.common_mistakes.map((m, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-amber-200 bg-amber-50/70 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <span className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-700 line-through decoration-red-400">
                      <span aria-hidden className="not-line-through">✗</span>
                      <span className="line-through">{m.wrong}</span>
                    </span>
                    <ArrowRight className="hidden h-4 w-4 shrink-0 text-amber-500 sm:block" />
                    <span className="inline-flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700">
                      <span aria-hidden>✓</span>
                      {m.right}
                      <SpeakButton text={m.right} size="sm" />
                    </span>
                  </div>
                  {m.note ? (
                    <p className="mt-2 text-sm text-amber-900/80">
                      <RichText text={m.note} />
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Exceptions & good-to-know — irregular cases, edge rules. */}
        {section.exceptions?.length ? (
          <div className="mt-8">
            <h4 className="mb-3 flex items-center gap-2 font-heading text-lg font-bold text-indigo-700">
              <KeyRound className="h-5 w-5" />
              {isEnglish ? "Exceptions & good to know" : "Exceptions & à retenir"}
            </h4>
            <ul className="space-y-2.5">
              {section.exceptions.map((ex, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4"
                >
                  <p className="font-semibold text-indigo-900">
                    <RichText text={ex.title} />
                  </p>
                  <p className="mt-1 text-sm text-indigo-900/80">
                    <RichText text={ex.detail} />
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Tips / memory aids. */}
        {section.tips?.length ? (
          <div className="mt-8 rounded-2xl border border-primary-100 bg-primary-50/70 p-5">
            <h4 className="mb-2 flex items-center gap-2 font-heading text-lg font-bold text-primary-600">
              <Lightbulb className="h-5 w-5" />
              {isEnglish ? "Tips & memory aids" : "Astuces & mémo"}
            </h4>
            <ul className="space-y-1.5">
              {section.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span aria-hidden className="mt-0.5 text-secondary-500">✦</span>
                  <span><RichText text={tip} /></span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </article>

      <TutorNotes view={view} instruction={section.tutor_instruction} />
    </SectionCard>
  );
}
