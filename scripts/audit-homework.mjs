import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });
const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// All homework rows
const { data: hw, error } = await supa.from("lesson_homework").select("lesson_slug, title, status, enabled, questions");
if (error) throw error;
console.log("Total lesson_homework rows:", hw.length);

const tally = {};
for (const h of hw) {
  const k = `${h.status}/enabled=${h.enabled}`;
  tally[k] = (tally[k] || 0) + 1;
}
console.log("By status/enabled:", JSON.stringify(tally, null, 2));

// Grammar-specific
const gram = hw.filter((h) => (h.lesson_slug || "").startsWith("fr-grammar-"));
console.log(`\nGrammar homework rows: ${gram.length}`);
const gtally = {};
for (const h of gram) {
  const k = `${h.status}/enabled=${h.enabled}`;
  gtally[k] = (gtally[k] || 0) + 1;
}
console.log("Grammar by status/enabled:", JSON.stringify(gtally, null, 2));

// How many grammar lessons exist in tutor_lessons vs have published+enabled homework
const { data: lessons } = await supa.from("tutor_lessons").select("slug, title, level").like("slug", "fr-grammar-%");
const publishedHwSlugs = new Set(gram.filter((h) => h.status === "published" && h.enabled).map((h) => h.lesson_slug));
console.log(`\nGrammar lessons in tutor_lessons: ${lessons?.length || 0}`);
const missing = (lessons || []).filter((l) => !publishedHwSlugs.has(l.slug));
console.log(`Grammar lessons WITHOUT published+enabled homework: ${missing.length}`);
for (const l of missing.slice(0, 60)) console.log(`   [${l.level}] ${l.slug}`);

// Question counts for grammar homework
console.log("\n=== Grammar homework question counts ===");
let empty = 0;
for (const h of gram.sort((a,b)=>a.lesson_slug.localeCompare(b.lesson_slug))) {
  const n = Array.isArray(h.questions) ? h.questions.length : 0;
  if (n === 0) empty++;
}
console.log("Grammar homework sets with 0 questions:", empty, "of", gram.length);
const dist = {};
for (const h of gram) { const n = Array.isArray(h.questions)?h.questions.length:0; dist[n]=(dist[n]||0)+1; }
console.log("Question-count distribution:", JSON.stringify(dist));
