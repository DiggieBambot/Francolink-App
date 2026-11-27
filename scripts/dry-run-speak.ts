// Read-only dry run of the engagement cron's student "speak" sequence and the
// tutor marketing pause, against whatever DB the env points at. Sends nothing,
// writes nothing. Ignores the 10am local-time gate (like ?dry=1 does).
//
//   set -a; source .env.local; set +a
//   node -e 'const p=require("path");require("jiti").createJiti(p.resolve("scripts/x.js"),{alias:{"@":p.resolve("src")}}).import("./dry-run-speak.ts")'
import { createClient } from "@supabase/supabase-js";
import { nextSpeakStep, renderSpeak, SPEAK_STEPS, SPEAK_STEP_NUMBER, type SpeakPlan, type SpeakStepKey } from "@/lib/email/campaigns/speak";
import { languageName } from "@/lib/email/campaigns/learning-tips";

const DAY = 86400_000;
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function all<T>(q: () => any): Promise<T[]> {
  let out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await q().range(from, from + 999);
    if (error) throw error;
    out = out.concat(data);
    if (data.length < 1000) return out;
  }
}
const isTest = (e: string) => !e.includes("@") || /\.(test|local)$/.test(e) || e.endsWith("@example.com") || /^test\d*@/.test(e) || e.endsWith("@demo.francolink.net");
const mask = (e: string) => e.replace(/^(.).*?(.)@/, "$1***$2@");

async function main() {
  const now = Date.now();
  const users = await all<any>(() => s.from("users").select("id,email,name,role,learning_language,subscription_plan,created_at,last_seen_at").eq("is_active", true).eq("email_marketing_opt_out", false).not("email", "is", null).in("role", ["USER", "TUTOR"]));
  const students = users.filter((u) => u.role === "USER" && !isTest(u.email.toLowerCase()));
  const tutors = users.filter((u) => u.role === "TUTOR" && !isTest(u.email.toLowerCase()));
  const [convs, bookings, plans, credits, links, ledger, hwA, hwS] = await Promise.all([
    all<any>(() => s.from("ai_tutor_conversations").select("user_id")),
    all<any>(() => s.from("bookings").select("student_id").not("status", "in", "(pending_payment,expired)")),
    all<any>(() => s.from("user_subscriptions").select("user_id").in("status", ["active", "past_due"])),
    all<any>(() => s.from("lesson_credits").select("user_id,delta")),
    all<any>(() => s.from("tutor_students").select("tutor_id,student_id").eq("status", "active")),
    all<any>(() => s.from("email_campaign_sends").select("user_id,step,sent_at").eq("campaign", "speak")),
    all<any>(() => s.from("homework_assignments").select("student_id,homework_id")),
    all<any>(() => s.from("homework_submissions").select("student_id,homework_id")),
  ]);
  const leon = new Set(convs.map((r) => r.user_id));
  const live = new Set([...bookings.map((r) => r.student_id), ...plans.map((r) => r.user_id)]);
  const bal = new Map<string, number>();
  for (const c of credits) bal.set(c.user_id, (bal.get(c.user_id) || 0) + Number(c.delta || 0));
  for (const [id, b] of bal) if (b > 0) live.add(id);
  const linked = new Set(links.filter((l) => l.tutor_id !== l.student_id).map((l) => l.student_id));
  const done = new Set(hwS.map((r) => `${r.student_id}:${r.homework_id}`));
  const pendingHw = new Set(hwA.filter((a) => !done.has(`${a.student_id}:${a.homework_id}`)).map((a) => a.student_id));
  const keyOf = new Map(SPEAK_STEPS.map((k) => [SPEAK_STEP_NUMBER[k], k]));
  const sent = new Map<string, Partial<Record<SpeakStepKey, number>>>();
  for (const r of ledger) { const k = keyOf.get(r.step); if (k) sent.set(r.user_id, { ...(sent.get(r.user_id) || {}), [k]: new Date(r.sent_at).getTime() }); }

  const byStep: Record<string, number> = {};
  const rows: string[] = [];
  let notYet = 0, homework = 0, activeToday = 0;
  for (const u of students) {
    if (pendingHw.has(u.id)) { homework++; continue; }
    const seen = u.last_seen_at ? (now - new Date(u.last_seen_at).getTime()) / DAY : Infinity;
    if (seen < 1) { activeToday++; continue; }
    const plan: SpeakPlan = u.subscription_plan === "PREMIUM" || u.subscription_plan === "PREMIUM_PLUS" ? u.subscription_plan : "FREE";
    const firstName = (u.name || u.email.split("@")[0]).split(/\s+/)[0];
    const lang = languageName(u.learning_language);
    const age = (now - new Date(u.created_at).getTime()) / DAY;
    const step = nextSpeakStep({ firstName, lang, plan, accountAgeDays: age, usedLeon: leon.has(u.id), hasLiveLessons: live.has(u.id), hasTutorLink: linked.has(u.id), sent: sent.get(u.id) || {} }, now);
    if (!step) { notYet++; continue; }
    byStep[step] = (byStep[step] || 0) + 1;
    rows.push(`${step}  ${plan.padEnd(12)} ${mask(u.email).padEnd(28)} "${renderSpeak(step, { firstName, lang, plan }).subject}"`);
  }
  console.log(`STUDENTS reachable: ${students.length}`);
  console.log(`  would get a speak email on their next slot: ${rows.length}`, byStep);
  console.log(`  skipped: homework first ${homework}, active today ${activeToday}, nothing due yet ${notYet}`);
  console.log(rows.sort().join("\n"));
  console.log(`\nTUTORS reachable: ${tutors.length}: every engagement email paused except "requests" (students waiting to join).`);
}
main();
