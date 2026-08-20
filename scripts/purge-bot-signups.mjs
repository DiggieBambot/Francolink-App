// scripts/purge-bot-signups.mjs
//
// Finds and removes the scripted signups that started arriving in bulk around
// 2026-08-16. Their signature is a name made of random consonant runs
// ("Dgqglt Dcbqongf", "Xgdwtv Dlsyjnlnl") paired with a harvested real-looking
// address — often a dotted Gmail alias. They confirm instantly because email
// confirmation is off, so "confirmed" tells us nothing.
//
// The heuristic is deliberately narrow and every candidate is cross-checked for
// real activity first: an account that booked, taught, was linked to a tutor,
// or submitted homework is never deleted no matter how odd its name looks.
//
// DRY-RUN by default. Review the printed list, then re-run with --apply.
// Usage:
//   node scripts/purge-bot-signups.mjs            # report only
//   node scripts/purge-bot-signups.mjs --apply    # delete the listed accounts

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const APPLY = process.argv.includes("--apply");

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// A token is "gibberish" when it is long enough to judge and either has almost
// no vowels or carries a consonant run no natural name produces.
function gibberishToken(t) {
  if (t.length < 4) return false;
  const vowels = (t.match(/[aeiouyAEIOUY]/g) || []).length;
  return /[^aeiouyAEIOUY]{4,}/.test(t) || vowels <= 1;
}

function looksScripted(name) {
  if (!name) return false;
  const tokens = name.trim().split(/\s+/).filter(Boolean);
  if (tokens.length < 2) return false;
  // Both halves have to look wrong. One odd token is a real foreign name.
  return tokens.every(gibberishToken);
}

async function activeUserIds(ids) {
  const active = new Set();
  const checks = [
    ["bookings", "student_id"],
    ["bookings", "tutor_id"],
    ["tutor_students", "student_id"],
    ["tutor_students", "tutor_id"],
    ["tutor_lessons", "created_by"],
    ["homework_submissions", "student_id"],
    ["tutor_lesson_sessions", "tutor_id"],
  ];
  for (const [table, col] of checks) {
    const { data, error } = await supa.from(table).select(col).in(col, ids);
    if (error) {
      // A missing table or column shouldn't silently weaken the safety check.
      console.warn(`  ⚠️  could not check ${table}.${col}: ${error.message}`);
      continue;
    }
    for (const row of data || []) if (row[col]) active.add(row[col]);
  }
  return active;
}

async function main() {
  let authUsers = [];
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await supa.auth.admin.listUsers({ page, perPage: 200 });
    if (error) { console.error(`❌ ${error.message}`); process.exit(1); }
    if (!data.users.length) break;
    authUsers = authUsers.concat(data.users);
  }
  console.log(`Scanned ${authUsers.length} auth users.`);

  const candidates = authUsers.filter((u) => {
    // Google accounts carry a Google-verified profile name; the flood came in
    // through email/password. Restrict to that to avoid false positives.
    const providers = u.app_metadata?.providers || [];
    if (!providers.includes("email") || providers.includes("google")) return false;
    return looksScripted(u.user_metadata?.full_name || u.user_metadata?.name);
  });

  if (!candidates.length) { console.log("✅ No scripted signups matched."); return; }

  const active = await activeUserIds(candidates.map((u) => u.id));
  const doomed = candidates.filter((u) => !active.has(u.id));
  const spared = candidates.filter((u) => active.has(u.id));

  console.log(`\nMatched ${candidates.length}; ${spared.length} spared for having real activity.\n`);
  for (const u of doomed) {
    console.log(`  ${u.created_at.slice(0, 10)}  ${String(u.user_metadata?.full_name || "").padEnd(26)} ${u.email}`);
  }
  for (const u of spared) console.log(`  SPARED (has activity): ${u.email}`);

  if (!APPLY) {
    console.log(`\nDRY RUN — ${doomed.length} accounts would be deleted. Re-run with --apply.`);
    return;
  }

  let ok = 0;
  for (const u of doomed) {
    // Deleting the auth user cascades to public.users via its FK.
    const { error } = await supa.auth.admin.deleteUser(u.id);
    if (error) console.error(`  ❌ ${u.email}: ${error.message}`);
    else ok++;
  }
  console.log(`\n✅ Deleted ${ok}/${doomed.length} accounts.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
