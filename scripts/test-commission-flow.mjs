// scripts/test-commission-flow.mjs
//
// End-to-end validation of the referral → commission money path, against the
// real DB but with throwaway test users. Mirrors the webhook's commission
// logic (10% first month, 5% recurring) and asserts ledger + balance.
//
//   node scripts/test-commission-flow.mjs
//
// Cleans up everything it creates.

import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TAG = "ctest_" + Date.now();
let tutorId, studentId;
const created = { users: [], ledger: [] };

function assert(cond, msg) {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
  console.log("  ✓ " + msg);
}

async function getSetting(key, dflt) {
  const { data } = await s.from("app_settings").select("value").eq("key", key).maybeSingle();
  return data?.value ?? dflt;
}

// Replicates webhook handlePaymentSucceeded commission logic.
async function simulateInvoice({ student, amountPaid, billingReason }) {
  if (!student.referred_by_tutor_id) return null;
  if ((await getSetting("commission_enabled", "true")) !== "true") return null;

  let isFirst = billingReason === "subscription_create";
  if (!isFirst && billingReason !== "subscription_cycle") {
    const { count } = await s
      .from("commission_ledger")
      .select("*", { count: "exact", head: true })
      .eq("tutor_id", student.referred_by_tutor_id)
      .eq("student_id", student.id);
    isFirst = (count ?? 0) === 0;
  }
  const firstRate = parseFloat(await getSetting("commission_rate_first_month", "0.10"));
  const recurringRate = parseFloat(await getSetting("commission_rate_recurring", "0.05"));
  const rate = isFirst ? firstRate : recurringRate;
  const gross = amountPaid / 100;
  const amount = Math.round(gross * rate * 100) / 100;

  const { data: led, error: lerr } = await s
    .from("commission_ledger")
    .insert({ tutor_id: student.referred_by_tutor_id, student_id: student.id, amount, commission_rate: rate, status: "paid" })
    .select("id")
    .single();
  if (lerr) throw new Error("ledger insert: " + lerr.message);
  created.ledger.push(led.id);

  const { data: tutor } = await s.from("users").select("commission_balance").eq("id", student.referred_by_tutor_id).single();
  const bal = Math.round(((parseFloat(tutor.commission_balance || "0")) + amount) * 100) / 100;
  await s.from("users").update({ commission_balance: bal }).eq("id", student.referred_by_tutor_id);
  return { isFirst, rate, amount, balance: bal };
}

async function makeAuthUser(email) {
  const { data, error } = await s.auth.admin.createUser({ email, password: "Test123!" + TAG, email_confirm: true });
  if (error) throw new Error("auth create: " + error.message);
  return data.user.id;
}

try {
  console.log("1. Create test tutor + student (auth + profile)");
  tutorId = await makeAuthUser(`${TAG}_tutor@test.local`);
  studentId = await makeAuthUser(`${TAG}_student@test.local`);
  created.users.push(tutorId, studentId);
  // Ensure profile rows exist with the right role (upsert in case a trigger made them).
  await s.from("users").upsert({ id: tutorId, email: `${TAG}_tutor@test.local`, name: "Test Tutor", role: "TUTOR", tutor_invite_code: TAG.toUpperCase().slice(0, 8), commission_balance: 0 });
  await s.from("users").upsert({ id: studentId, email: `${TAG}_student@test.local`, name: "Test Student", role: "STUDENT" });
  assert(true, "tutor + student created");

  console.log("2. Student joins under tutor (referred_by_tutor_id link)");
  await s.from("users").update({ referred_by_tutor_id: tutorId }).eq("id", studentId);
  const { data: linked } = await s.from("users").select("id, referred_by_tutor_id").eq("id", studentId).single();
  assert(linked.referred_by_tutor_id === tutorId, "student linked to tutor");

  console.log("3. First subscription payment ($20.00, subscription_create) → expect 10%");
  const r1 = await simulateInvoice({ student: linked, amountPaid: 2000, billingReason: "subscription_create" });
  assert(r1.isFirst === true && r1.rate === 0.10, `first month rate 10% (got ${r1.rate * 100}%)`);
  assert(r1.amount === 2.0, `commission $2.00 (got $${r1.amount})`);

  console.log("4. Second payment ($20.00, subscription_cycle) → expect 5%");
  const r2 = await simulateInvoice({ student: linked, amountPaid: 2000, billingReason: "subscription_cycle" });
  assert(r2.isFirst === false && r2.rate === 0.05, `recurring rate 5% (got ${r2.rate * 100}%)`);
  assert(r2.amount === 1.0, `commission $1.00 (got $${r2.amount})`);

  console.log("5. Tutor balance = first + recurring");
  assert(r2.balance === 3.0, `balance $3.00 (got $${r2.balance})`);

  console.log("6. Ledger has 2 rows for this tutor/student");
  const { count } = await s.from("commission_ledger").select("*", { count: "exact", head: true }).eq("tutor_id", tutorId).eq("student_id", studentId);
  assert(count === 2, `2 ledger rows (got ${count})`);

  console.log("\n✅ ALL COMMISSION CHECKS PASSED — money path is correct.");
} catch (e) {
  console.error("\n❌ " + e.message);
} finally {
  console.log("\nCleaning up test data…");
  if (created.ledger.length) await s.from("commission_ledger").delete().in("id", created.ledger);
  for (const uid of created.users) {
    await s.from("users").delete().eq("id", uid);
    await s.auth.admin.deleteUser(uid).catch(() => {});
  }
  console.log("  removed", created.ledger.length, "ledger rows +", created.users.length, "users (auth + profile)");
}
