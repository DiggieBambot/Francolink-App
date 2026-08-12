// The lesson worker's orchestrator: everything that happens to ONE lesson.
//
// Stages: validate (free) → critique (AI, read-only) → repair (AI, per section)
// → re-validate → write. A write is always preceded by a revision row, so any
// edit the worker makes can be undone from the admin UI.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import type { Lesson, Section } from "../types";
import { critiqueLesson, type Finding } from "./critique";
import { normalizeLesson } from "./normalize";
import { repairSection } from "./repair";
import { AUTO_FIXABLE, validateLesson, type Defect } from "./validate";

export function adminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export function contentHash(content: unknown): string {
  return createHash("sha256").update(JSON.stringify(content)).digest("hex").slice(0, 32);
}

export interface RunOptions {
  auto_apply: boolean;
  critique_model: string;
  repair_model: string;
  /** Skip the AI critique entirely — schema defects only. Much cheaper. */
  skip_critique?: boolean;
  /** Also act on subjective critique findings, not just provable defects. */
  apply_findings?: boolean;
}

export interface ItemOutcome {
  defects: Defect[];
  findings: Finding[];
  repairs: { section_index: number; kind: string; reason: string }[];
  applied: boolean;
  costUsd: number;
}

/** Which sections need a repair pass, and why. A section is repaired when it
 *  has an auto-fixable defect — or, if the run opted in, when the critic
 *  flagged it as an error/warn. */
function planRepairs(
  defects: Defect[],
  findings: Finding[],
  opts: RunOptions
): Map<number, { defects: Defect[]; findings: Finding[] }> {
  const plan = new Map<number, { defects: Defect[]; findings: Finding[] }>();

  for (const d of defects) {
    if (d.section_index === null) continue;
    if (!AUTO_FIXABLE.has(d.code)) continue;
    const entry = plan.get(d.section_index) ?? { defects: [], findings: [] };
    entry.defects.push(d);
    plan.set(d.section_index, entry);
  }

  if (opts.apply_findings) {
    for (const f of findings) {
      if (f.section_index === null || f.severity === "nit") continue;
      const entry = plan.get(f.section_index) ?? { defects: [], findings: [] };
      entry.findings.push(f);
      plan.set(f.section_index, entry);
    }
  } else {
    // Even when we don't act on findings alone, a section we're already
    // repairing benefits from the critic's notes.
    for (const f of findings) {
      if (f.section_index === null) continue;
      const entry = plan.get(f.section_index);
      if (entry) entry.findings.push(f);
    }
  }

  return plan;
}

/** Process one existing lesson. Returns what happened; the caller records it. */
export async function processLesson(
  supa: SupabaseClient,
  lessonRow: { id: string; slug: string; content: Lesson; level: string; language: string; title: string },
  opts: RunOptions,
  ctx: { runId: string; itemId: string }
): Promise<ItemOutcome> {
  const lesson: Lesson = {
    ...lessonRow.content,
    title: lessonRow.content?.title ?? lessonRow.title,
    level: lessonRow.content?.level ?? lessonRow.level,
    language: lessonRow.content?.language ?? lessonRow.language,
  };

  let costUsd = 0;

  // ── stage 0: free normalisation ───────────────────────────────────────────
  // Rename legacy vocabulary keys onto the ones the renderer reads. Must run
  // before validation, or thousands of items look like missing translations
  // and get sent to the model to be rewritten from scratch.
  const normalized = normalizeLesson(lesson);
  const working = normalized.lesson;
  const repairs: ItemOutcome["repairs"] = [];
  if (normalized.changed) {
    repairs.push({
      section_index: -1,
      kind: "normalize",
      reason: Object.entries(normalized.changes)
        .map(([k, n]) => `${k} ×${n}`)
        .join(", "),
    });
  }

  // ── stage 1: deterministic ────────────────────────────────────────────────
  const defects = validateLesson(working);

  // ── stage 2: critique ─────────────────────────────────────────────────────
  let findings: Finding[] = [];
  if (!opts.skip_critique) {
    const c = await critiqueLesson(working, opts.critique_model);
    findings = c.findings;
    costUsd += c.costUsd;
  }

  // ── stage 3: repair ───────────────────────────────────────────────────────
  const plan = planRepairs(defects, findings, opts);
  const sections: Section[] = [...(working.sections ?? [])];

  for (const [index, work] of plan) {
    const original = sections[index];
    if (!original) continue;

    try {
      const result = await repairSection(
        lesson,
        original,
        index,
        work.defects,
        work.findings,
        opts.repair_model
      );
      costUsd += result.costUsd;

      // ── stage 4: verify. Only keep the repair if it strictly improved the
      // section — a rewrite that introduces new errors is worse than the
      // defect it was fixing.
      const before = work.defects.filter((d) => d.severity === "error").length;
      const after = result.remaining.filter((d) => d.severity === "error").length;
      const beforeAll = work.defects.length;
      const afterAll = result.remaining.length;

      if (after > before || (after === before && afterAll > beforeAll)) {
        repairs.push({
          section_index: index,
          kind: original.kind,
          reason: `rejected — repair left ${afterAll} defects (was ${beforeAll})`,
        });
        continue;
      }

      sections[index] = result.section;
      repairs.push({
        section_index: index,
        kind: original.kind,
        reason: work.defects.map((d) => d.code).join(", ") || "editorial",
      });
    } catch (err) {
      repairs.push({
        section_index: index,
        kind: original.kind,
        reason: `failed — ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  const changed = repairs.some((r) => !r.reason.startsWith("rejected") && !r.reason.startsWith("failed"));

  // ── write ─────────────────────────────────────────────────────────────────
  let applied = false;
  if (changed && opts.auto_apply) {
    const nextContent: Lesson = { ...working, sections };

    // Undo log first — if the update fails we have a harmless orphan revision,
    // whereas the other order can lose the original.
    await supa.from("tutor_lesson_revisions").insert({
      lesson_id: lessonRow.id,
      run_id: ctx.runId,
      item_id: ctx.itemId,
      content: lessonRow.content,
      reason: repairs.map((r) => `§${r.section_index} ${r.reason}`).join("; ").slice(0, 500),
    });

    const { error } = await supa
      .from("tutor_lessons")
      .update({
        content: nextContent,
        ai_pass_hash: contentHash(nextContent),
        ai_pass_at: new Date().toISOString(),
      })
      .eq("id", lessonRow.id);

    if (error) throw new Error(`Write failed: ${error.message}`);
    applied = true;
  } else {
    // Nothing to write, but record that we looked, so a repeat sweep skips it.
    await supa
      .from("tutor_lessons")
      .update({ ai_pass_hash: contentHash(lessonRow.content), ai_pass_at: new Date().toISOString() })
      .eq("id", lessonRow.id);
  }

  return { defects, findings, repairs, applied, costUsd };
}
