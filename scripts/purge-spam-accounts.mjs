#!/usr/bin/env node
// scripts/purge-spam-accounts.mjs
//
// Permanently deletes bot accounts: the auth user, the public.users row, and
// every tutor_students link. Unlike backfill-signup-risk.mjs, which only
// demotes, THIS DESTROYS DATA AND CANNOT BE UNDONE from inside the app.
//
// Because of that, the safety rails matter more than the scoring:
//
//   - Dry run is the default. Deleting needs BOTH --apply and --confirm-delete.
//   - A JSON backup of every account is written before the first delete, so a
//     mistake is recoverable by hand even though the app can't undo it.
//   - Protected roles (tutor, admin, community manager) are never deleted.
//     They are reported instead — the flagged set does contain real people
//     with odd email addresses, and scoring is good enough to shortlist them,
//     not to judge them.
//   - Any account with evidence of real use is skipped whatever it scores.
//     Real students leave traces; the bots we're hunting leave none.
//
// Scoring is imported from src/lib/auth/signup-risk.ts rather than copied, so
// this cannot drift from the live gate.
//
// Usage:
//   npx tsx --env-file=.env.local scripts/purge-spam-accounts.mjs
//   npx tsx --env-file=.env.local scripts/purge-spam-accounts.mjs --min-score=8
//   npx tsx --env-file=.env.local scripts/purge-spam-accounts.mjs --include-tutors
//   npx tsx --env-file=.env.local scripts/purge-spam-accounts.mjs --apply --confirm-delete

import { writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import {
  assessSignup,
  canonicalEmail,
  AUTO_DECLINE_THRESHOLD,
} from "../src/lib/auth/signup-risk.ts";

const APPLY = process.argv.includes("--apply");
const CONFIRMED = process.argv.includes("--confirm-delete");
// Tutor-role accounts are protected by default. The bots register as tutors
// too — a tutor account mints an invite code and can be listed — so this opens
// a narrow path to them, gated on having no students, no public profile and no
// activity. A real teacher who has ever taught anyone is unreachable this way.
const INCLUDE_TUTORS = process.argv.includes("--include-tutors");
const MIN_SCORE = Number(
  process.argv.find((a) => a.startsWith("--min-score="))?.split("=")[1] ?? AUTO_DECLINE_THRESHOLD
);

const PROTECTED_ROLES = new Set(["TUTOR", "ADMIN", "COMMUNITY_MANAGER"]);

const svc = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

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

/** Any evidence of real use. This is the rail that matters most. */
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
  console.log(
    APPLY && CONFIRMED
      ? "MODE: APPLY — accounts will be permanently deleted"
      : "MODE: dry run (no writes). To delete: --apply --confirm-delete"
  );
  console.log(`threshold: score >= ${MIN_SCORE}\n`);

  const users = await readAll(
    "users",
    "id,email,name,role,total_xp,current_streak,last_activity_date,created_at"
  );
  const progress = await readAll("lesson_progress", "user_id").catch(() => []);
  const sessions = await readAll("tutor_lesson_sessions", "student_id").catch(() => []);
  const progressIds = new Set(progress.map((r) => r.user_id));
  const sessionIds = new Set(sessions.map((r) => r.student_id));

  // Accounts sharing one real inbox via gmail dot-aliasing. Three signups on
  // nouseybeats@gmail.com are one person or one script, not three students —
  // and the duplicate is evidence about the *set*, which no per-signup score
  // can see. Only counted for accounts that already score at review or above,
  // so a family sharing one mailbox is never swept up by this alone.
  const canonCount = new Map();
  for (const u of users) {
    if (!u.email) continue;
    const c = canonicalEmail(u.email);
    canonCount.set(c, (canonCount.get(c) || 0) + 1);
  }

  // Who has students, and who is publicly listed — the two things that make a
  // tutor account unmistakably real.
  const tutorLinks = await readAll("tutor_students", "tutor_id").catch(() => []);
  const hasStudents = new Set(tutorLinks.map((r) => r.tutor_id));
  const profiles = await readAll("tutor_public_profiles", "user_id").catch(() => []);
  const isListed = new Set(profiles.map((r) => r.user_id));

  const targets = [];
  const flaggedPrivileged = [];
  const skipped = { protected: 0, engaged: 0, clean: 0 };

  for (const u of users) {
    const risk = assessSignup({ email: u.email, name: u.name });
    const dupes = u.email ? canonCount.get(canonicalEmail(u.email)) || 1 : 1;
    const score = risk.score + (dupes > 1 && risk.score >= 4 ? 2 : 0);
    const reasons = dupes > 1 && risk.score >= 4
      ? [...risk.reasons, `shared_inbox_x${dupes}`]
      : risk.reasons;

    if (score < MIN_SCORE) { skipped.clean++; continue; }
    const role = String(u.role || "").toUpperCase();
    if (PROTECTED_ROLES.has(role)) {
      // A tutor with students or a public profile is real, full stop — no
      // score gets to overrule that.
      const deletableTutor =
        INCLUDE_TUTORS &&
        role === "TUTOR" &&
        !hasStudents.has(u.id) &&
        !isListed.has(u.id) &&
        !isEngaged(u, progressIds, sessionIds);

      if (!deletableTutor) {
        skipped.protected++;
        flaggedPrivileged.push({ u, score, reasons });
        continue;
      }
      targets.push({ u, score, reasons: [...reasons, "empty_tutor_account"] });
      continue;
    }
    if (isEngaged(u, progressIds, sessionIds)) { skipped.engaged++; continue; }
    targets.push({ u, score, reasons });
  }

  targets.sort((a, b) => b.score - a.score);

  console.log("name".padEnd(26) + "score".padStart(5) + "  email");
  for (const t of targets) {
    console.log(
      String(t.u.name ?? "(none)").slice(0, 24).padEnd(26) +
      String(t.score).padStart(5) + "  " +
      String(t.u.email).slice(0, 44)
    );
  }

  console.log(`\n${targets.length} account(s) would be deleted.`);
  console.log(
    `skipped: ${skipped.clean} clean, ${skipped.engaged} with activity, ${skipped.protected} privileged`
  );

  if (flaggedPrivileged.length) {
    console.log("\n⚠️  Flagged but NOT deleted (tutor/admin — review by hand):");
    for (const f of flaggedPrivileged) {
      console.log(`   ${f.u.email}  score ${f.score}  ${f.u.role}`);
    }
  }

  if (!targets.length) return;

  if (!APPLY || !CONFIRMED) {
    console.log("\nDry run — nothing deleted.");
    console.log("Review the list above carefully, then re-run with --apply --confirm-delete");
    return;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = `purged-accounts-${stamp}.json`;
  writeFileSync(backupPath, JSON.stringify(targets, null, 2));
  console.log(`\nBackup written to ${backupPath} — keep it until you're sure.`);

  let ok = 0;
  let failed = 0;
  for (const t of targets) {
    try {
      await svc.from("tutor_students").delete().eq("student_id", t.u.id);
      await svc.from("users").delete().eq("id", t.u.id);
      const { error } = await svc.auth.admin.deleteUser(t.u.id);
      // A missing auth user is fine — the row is what the tutor sees.
      if (error && !/not found/i.test(error.message)) throw new Error(error.message);
      ok++;
    } catch (err) {
      failed++;
      console.error(`   ✗ ${t.u.email}: ${err.message}`);
    }
  }

  console.log(`\nDeleted ${ok} account(s)${failed ? `, ${failed} failed` : ""}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
