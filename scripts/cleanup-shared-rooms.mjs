// scripts/cleanup-shared-rooms.mjs
// Removes legacy "shared classroom" rooms left over from the old Meet-style model.
// Those rows used the sentinel student_id === tutor_id (one open room per tutor
// that every student joined — the source of cross-student chat bleed). Rooms are
// now one-per-pair and private, so the sentinel rows are dead.
//
// This also sweeps the messages and highlights that belonged to those rooms so we
// don't leave orphans behind.
//
// DRY-RUN by default (reports only). Pass --apply to actually delete.
// Usage:
//   node scripts/cleanup-shared-rooms.mjs           # report what would be deleted
//   node scripts/cleanup-shared-rooms.mjs --apply   # delete

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const APPLY = process.argv.includes("--apply");

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

function die(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    die("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (check .env.local).");
  }

  console.log(APPLY ? "🔴 APPLY mode — deleting.\n" : "🟢 DRY-RUN — nothing will be deleted. Pass --apply to delete.\n");

  // Find the legacy sentinel rooms: student_id equals tutor_id.
  // (Supabase can't compare two columns in a filter, so pull the candidates and
  //  filter in JS. There are at most a handful — one per tutor.)
  const { data: rooms, error } = await supa
    .from("tutor_lesson_sessions")
    .select("id, tutor_id, student_id, created_at");
  if (error) die(`Failed to read tutor_lesson_sessions: ${error.message}`);

  const shared = (rooms || []).filter((r) => r.student_id && r.tutor_id && r.student_id === r.tutor_id);

  if (shared.length === 0) {
    console.log("✅ No legacy shared-room rows found. Nothing to do.");
    return;
  }

  const ids = shared.map((r) => r.id);
  console.log(`Found ${shared.length} legacy shared room(s):`);
  for (const r of shared) console.log(`  • ${r.id}  tutor=${r.tutor_id}  created=${r.created_at}`);

  // Count dependent rows so the report is honest about the blast radius.
  const [{ count: msgCount }, { count: hlCount }] = await Promise.all([
    supa.from("tutor_lesson_messages").select("*", { count: "exact", head: true }).in("session_id", ids),
    supa.from("tutor_lesson_highlights").select("*", { count: "exact", head: true }).in("session_id", ids),
  ]);
  console.log(`\nDependent rows: ${msgCount ?? 0} message(s), ${hlCount ?? 0} highlight(s).`);

  if (!APPLY) {
    console.log("\n🟢 DRY-RUN complete. Re-run with --apply to delete the above.");
    return;
  }

  // Delete children first (FKs may or may not cascade — be explicit), then rooms.
  const delMsgs = await supa.from("tutor_lesson_messages").delete().in("session_id", ids);
  if (delMsgs.error) die(`Failed deleting messages: ${delMsgs.error.message}`);

  const delHls = await supa.from("tutor_lesson_highlights").delete().in("session_id", ids);
  if (delHls.error) die(`Failed deleting highlights: ${delHls.error.message}`);

  const delRooms = await supa.from("tutor_lesson_sessions").delete().in("id", ids);
  if (delRooms.error) die(`Failed deleting rooms: ${delRooms.error.message}`);

  console.log(`\n✅ Deleted ${shared.length} shared room(s) and their messages/highlights.`);
}

main().catch((e) => die(e.message || String(e)));
