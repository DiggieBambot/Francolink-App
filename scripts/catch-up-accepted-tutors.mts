// Catch up tutors accepted before acceptance sent a "finish your profile" email.
//
//   npx tsx scripts/catch-up-accepted-tutors.mts          # dry run: who and what
//   npx tsx scripts/catch-up-accepted-tutors.mts --send
//
// Two groups:
//   - accepted with an account: emailed how to finish their profile (plus the
//     bell notification), unless their listing is already live.
//   - accepted from the Website dropdown, which only set a label: run through
//     the full acceptance now (account/invite, draft listing, email).

import { config } from "dotenv";
config({ path: process.env.ENV_FILE ?? ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { acceptApplication, sendAcceptedWelcome } from "../src/lib/tutors/accept";

const send = process.argv.includes("--send");
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

const { data: apps, error } = await db
  .from("tutor_applications")
  .select("id, full_name, email, created_user_id, applicant_user_id")
  .eq("status", "accepted");
if (error) throw error;

for (const app of apps ?? []) {
  const userId = app.created_user_id || app.applicant_user_id;
  if (!userId) {
    console.log(`ACCEPT  ${app.email} (${app.full_name}) — label only, no account yet`);
    if (send) {
      const r = await acceptApplication(db, app.id);
      console.log("        →", "error" in r ? `FAILED: ${r.error}` : r.message);
    }
    continue;
  }

  const [{ data: profile }, { data: authUser }] = await Promise.all([
    db.from("tutor_public_profiles").select("approval_status, is_public, accepts_bookings").eq("user_id", userId).maybeSingle(),
    db.auth.admin.getUserById(userId),
  ]);
  if (profile?.approval_status === "approved" && profile.is_public && profile.accepts_bookings) {
    console.log(`SKIP    ${app.email} — already live`);
    continue;
  }
  // Never signed in: they likely missed the invite, so the email tells them
  // how to set a password.
  const neverSignedIn = !authUser?.user?.last_sign_in_at;
  console.log(`EMAIL   ${app.email} (${app.full_name})${neverSignedIn ? " — never signed in" : ""}`);
  if (send) {
    await sendAcceptedWelcome(db, { userId, email: app.email, name: app.full_name, invited: neverSignedIn });
  }
}

if (!send) console.log("\nDry run. Re-run with --send to do it.");
process.exit(0);
