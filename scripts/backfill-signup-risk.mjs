#!/usr/bin/env node
// scripts/backfill-signup-risk.mjs
//
// Re-scores accounts that signed up before the signup risk gate existed, and
// demotes the flagged ones from `active` to `pending` in tutor_students.
//
// "Demote", not "delete", on purpose. Every flagged account stays exactly where
// it is — it just stops counting as a confirmed student, which takes it out of
// class lists and homework flows and puts it in the tutor's pending queue.
// A tutor who recognises someone can accept them with one click through the
// existing /api/tutor/students/respond route, so a wrong call here costs a
// click and not a student. Nothing in this script destroys data.
//
// Scoring is imported from src/lib/auth/signup-risk.ts rather than copied, so
// this can never drift from what the live gate does.
//
// Usage:
//   npx tsx --env-file=.env.local scripts/backfill-signup-risk.mjs --dry
//   npx tsx --env-file=.env.local scripts/backfill-signup-risk.mjs --apply
//   npx tsx --env-file=.env.local scripts/backfill-signup-risk.mjs --apply --min-score=6
//   npx tsx --env-file=.env.local scripts/backfill-signup-risk.mjs --apply --undo

import { createClient } from "@supabase/supabase-js";
import { assessSignup, REVIEW_THRESHOLD } from "../src/lib/auth/signup-risk.ts";

const APPLY = process.argv.includes("--apply");
const UNDO = process.argv.includes("--undo");
const MIN_SCORE = Number(
  process.argv.find((a) => a.startsWith("--min-score="))?.split("=")[1] ?? REVIEW_THRESHOLD
);

// Roles this script must never touch. Demoting staff or a tutor would lock
// someone out of their own dashboard, and neither is what we're hunting.
const PROTECTED_ROLES = new Set(["TUTOR", "ADMIN", "COMMUNITY_MANAGER"]);

const svc = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

/** Read a whole table in pages — .select() caps at 1000 rows per request. */
async function readAll(table, columns) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await svc.from(table).select(columns).range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data?.length) break;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

/**
 * Has this account ever actually done anything? Real students leave traces;
 * the bots we're hunting leave none. This is the safety rail that matters —
 * any evidence of use means hands off, whatever the name scores.
 */
function isEngaged(u, progressIds, sessionIds) {
  return (
    (u.total_xp ?? 0) > 0 ||
    Boolean(u.last_activity_date) ||
    (u.current_streak ?? 0) > 0 ||
    progressIds.has(u.id) ||
    sessionIds.has(u.id)
  );
}

async function main() {
  console.log(APPLY ? "MODE: apply (writes)" : "MODE: dry run (no writes) — pass --apply to commit");
  if (UNDO) console.log("MODE: undo — restoring pending rows this script created back to active");
  console.log(`threshold: score >= ${MIN_SCORE}\n`);

  if (UNDO) return undo();

  const users = await readAll("users", "id,email,name,role,total_xp,current_streak,last_activity_date,created_at");

  // Engagement evidence from elsewhere, so a student who worked but never
  // earned XP still counts as real.
  const progress = await readAll("lesson_progress", "user_id").catch(() => []);
  const sessions = await readAll("tutor_lesson_sessions", "student_id").catch(() => []);
  const progressIds = new Set(progress.map((r) => r.user_id));
  const sessionIds = new Set(sessions.map((r) => r.student_id));

  const links = await readAll("tutor_students", "tutor_id,student_id,status");
  const activeByStudent = new Map();
  for (const l of links) {
    if (l.status === "active") {
      activeByStudent.set(l.student_id, (activeByStudent.get(l.student_id) || 0) + 1);
    }
  }

  const targets = [];
  const flaggedPrivileged = [];
  const skipped = { protected: 0, engaged: 0, clean: 0 };

  for (const u of users) {
    const risk = assessSignup({ email: u.email, name: u.name });
    if (risk.score < MIN_SCORE) { skipped.clean++; continue; }
    if (PROTECTED_ROLES.has(String(u.role || "").toUpperCase())) {
      // Reported, never auto-acted on. A tutor account is privileged, so a
      // false positive here locks a real teacher out of their own dashboard —
      // and the flagged set does contain real people with odd email addresses.
      // Scoring is good enough to shortlist these, not to judge them.
      skipped.protected++;
      flaggedPrivileged.push({ u, risk });
      continue;
    }
    if (isEngaged(u, progressIds, sessionIds)) { skipped.engaged++; continue; }
    targets.push({ u, risk, activeLinks: activeByStudent.get(u.id) || 0 });
  }

  targets.sort((a, b) => b.risk.score - a.risk.score);

  console.log("name".padEnd(26) + "score".padStart(5) + "  links  reasons");
  for (const t of targets) {
    console.log(
      String(t.u.name ?? "(none)").slice(0, 24).padEnd(26) +
      String(t.risk.score).padStart(5) +
      String(t.activeLinks).padStart(7) + "  " +
      t.risk.reasons.join(",")
    );
  }

  const demotable = targets.filter((t) => t.activeLinks > 0);
  console.log(`\nscanned            ${users.length}`);
  console.log(`skipped (clean)    ${skipped.clean}`);
  console.log(`skipped (engaged)  ${skipped.engaged}   <- real users, never touched`);
  console.log(`skipped (tutor/admin) ${skipped.protected}`);
  console.log(`flagged            ${targets.length}`);
  console.log(`  of those, holding an active tutor link: ${demotable.length}`);

  if (flaggedPrivileged.length > 0) {
    console.log(`\n⚠  ${flaggedPrivileged.length} flagged TUTOR/ADMIN accounts — REVIEW BY HAND, not touched by this script:`);
    console.log("   " + "name".padEnd(24) + "role".padEnd(8) + "score  created     reasons");
    for (const f of flaggedPrivileged.sort((a, b) => b.risk.score - a.risk.score)) {
      console.log(
        "   " + String(f.u.name ?? "(none)").slice(0, 22).padEnd(24) +
        String(f.u.role).padEnd(8) +
        String(f.risk.score).padStart(5) + "  " +
        String(f.u.created_at ?? "").slice(0, 10).padEnd(12) +
        f.risk.reasons.join(",")
      );
    }
    console.log("   A tutor account can issue invite codes, so these are worth a look —");
    console.log("   but some real teachers score badly on email rules alone.");
  }

  if (!APPLY) {
    console.log("\nDry run — nothing written. Re-run with --apply to commit.");
    return;
  }

  let marked = 0, demoted = 0;
  for (const t of targets) {
    const { error: uErr } = await svc.from("users").update({
      risk_score: t.risk.score,
      risk_reasons: t.risk.reasons,
      risk_status: "review",
      updated_at: new Date().toISOString(),
    }).eq("id", t.u.id);
    if (uErr) { console.error(`  ! users ${t.u.id}: ${uErr.message}`); continue; }
    marked++;

    if (t.activeLinks > 0) {
      const { error: lErr } = await svc.from("tutor_students")
        .update({ status: "pending" })
        .eq("student_id", t.u.id)
        .eq("status", "active");
      if (lErr) console.error(`  ! links ${t.u.id}: ${lErr.message}`);
      else demoted++;
    }

    await svc.from("signup_risk_log").insert({
      email: t.u.email,
      name: t.u.name,
      score: t.risk.score,
      verdict: "review",
      reasons: [...t.risk.reasons, "backfill"],
    });
  }

  console.log(`\nmarked ${marked} accounts, demoted ${demoted} tutor links to pending.`);
  console.log("Tutors can accept anyone real from their Students tab.");
  console.log("To reverse: re-run with --apply --undo");
}

/**
 * Put back what was demoted. Caveat worth knowing: this matches on
 * risk_status='review', which the live gate also sets. Run it soon after a
 * backfill you regret — run it weeks later and it will also clear flags the
 * live gate raised on genuinely new spam.
 */
async function undo() {
  const { data: flagged } = await svc.from("users").select("id").eq("risk_status", "review");
  const ids = (flagged || []).map((r) => r.id);
  console.log(`${ids.length} accounts currently marked for review.`);
  if (!APPLY) { console.log("Dry run — nothing written."); return; }

  for (const id of ids) {
    await svc.from("tutor_students").update({ status: "active" }).eq("student_id", id).eq("status", "pending");
    await svc.from("users").update({ risk_status: "clear", risk_score: 0, risk_reasons: [] }).eq("id", id);
  }
  console.log(`Restored ${ids.length} accounts to active/clear.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
