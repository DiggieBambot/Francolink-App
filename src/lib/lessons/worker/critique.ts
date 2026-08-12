// Stage 2 of the lesson worker: AI critique.
//
// This stage is read-only on purpose. It judges only what code cannot — is the
// French correct, is it at the right CEFR level, do the comprehension answers
// actually appear in the passage, is the vocabulary on-topic. It never returns
// rewritten content; it returns findings that stage 3 acts on.

// `any` is deliberate: condense() walks arbitrary jsonb section shapes.
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Lesson } from "../types";
import { askJson } from "./ai";

export type FindingSeverity = "error" | "warn" | "nit";

export interface Finding {
  section_index: number | null;
  severity: FindingSeverity;
  /** Machine-ish category: "language", "level", "accuracy", "pedagogy". */
  category: string;
  issue: string;
  suggestion?: string;
}

const SYSTEM = `You are a senior CEFR curriculum reviewer. You review a language lesson and report problems.
You do NOT rewrite content. You report findings only.
Output ONLY valid JSON: { "findings": [ { "section_index": <int|null>, "severity": "error"|"warn"|"nit", "category": "language"|"level"|"accuracy"|"pedagogy", "issue": "...", "suggestion": "..." } ] }

Report a finding only when you are confident. An empty findings array is a valid and common answer for a good lesson.
Severity:
- "error": the target-language text is wrong, or an exercise cannot be completed as written, or an answer is factually incorrect.
- "warn": clearly the wrong CEFR level, unnatural phrasing, or an exercise that does not teach what the lesson claims.
- "nit": style only. Use sparingly.
Do NOT report missing images, missing pronunciation, or missing instructions — those are checked elsewhere.`;

/** Strip everything the critic doesn't need, so a 400-lesson sweep stays cheap:
 *  urls, avatar seeds, and the hydrator's bookkeeping. */
function condense(value: any): any {
  if (Array.isArray(value)) return value.map(condense);
  if (value && typeof value === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === "image_url" || k === "context_image_url" || k === "avatar_seed" || k === "image_query" || k === "image_hint") continue;
      out[k] = condense(v);
    }
    return out;
  }
  return value;
}

export async function critiqueLesson(
  lesson: Lesson,
  model: string
): Promise<{ findings: Finding[]; costUsd: number }> {
  const payload = {
    title: lesson.title,
    language: lesson.language,
    level: lesson.level,
    objectives: lesson.objectives,
    sections: condense(lesson.sections),
  };

  const { data, costUsd } = await askJson<{ findings: Finding[] }>(
    model,
    SYSTEM,
    `Review this lesson. The learner is at CEFR level ${lesson.level}.

${JSON.stringify(payload, null, 2)}`,
    { temperature: 0.2, maxTokens: 2000 }
  );

  const findings = Array.isArray(data?.findings) ? data.findings : [];

  // Normalise: the model occasionally returns a section index out of range or
  // omits severity. Anything unusable becomes a lesson-level warning rather
  // than being silently dropped.
  const max = lesson.sections?.length ?? 0;
  return {
    costUsd,
    findings: findings
      .filter((f) => f && typeof f.issue === "string" && f.issue.trim())
      .map((f) => ({
        section_index:
          typeof f.section_index === "number" && f.section_index >= 0 && f.section_index < max
            ? f.section_index
            : null,
        severity: (["error", "warn", "nit"] as const).includes(f.severity) ? f.severity : "warn",
        category: typeof f.category === "string" ? f.category : "pedagogy",
        issue: f.issue.trim(),
        suggestion: typeof f.suggestion === "string" ? f.suggestion.trim() : undefined,
      })),
  };
}
