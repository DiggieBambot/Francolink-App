// scripts/fix-reorder-tiles.mjs
//
// Makes every REORDER exercise solvable.
//
// The player (src/components/exercises/reorder.tsx) marks an answer correct only
// when the tapped tiles, joined with spaces, equal correctOrder joined with
// spaces. So every token of correctOrder must exist among `words`. Generated
// content sometimes dropped one ("It" in "It is ten to six", the second "à" in
// "je suis allé à la gare à pied", a ","), which left the exercise impossible.
//
// Fix: add the missing tokens to `words`. Extra tiles are left alone — they act
// as decoys and do not stop the learner from building the sentence. If a decoy
// differs from a missing token only by case ("it" vs "It"), it is replaced
// rather than kept alongside.
//
//   node --env-file=.env.local scripts/fix-reorder-tiles.mjs          # report only
//   node --env-file=.env.local scripts/fix-reorder-tiles.mjs --apply

import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");

// Answers that were ungrammatical or off-topic, not just short a tile ("You
// should breathe help", "Ever have they seen such a performance"). Adding tiles
// would only make a wrong sentence solvable, so these are rewritten outright,
// keeping to what each lesson teaches. Keyed by exercise id.
const REWRITES = {
  "5997ca23-4f40-41fa-abc1-bd6526da5fac": "We are making plans for this weekend", // en-making-plans
  "6735b031-4150-4f8d-8230-fb29fb54a130": "My family is relaxing on the weekend", // en-weekend-activities
  "dbb561f9-136b-4c05-9bdf-405961ca6401": "Networking is important for meeting new people", // en-b1-professional-vocab
  "cab6ae20-0d4c-49e3-abda-454defcad1f5": "Understanding the culture is important when traveling", // en-b1-travel-stories
  "87bfc8a1-c51f-46b7-9f81-414cd839b542": "Take a deep breath and stay calm", // en-imperatives
  "17338e75-876d-4315-a5e2-8622ec4fdb05": "These shoes cost a lot of money", // en-demonstratives
  "98713dc5-2a71-43ec-9f48-dee4066b2009": "I had never had such an experience before", // en-b2-perfect-tenses
  "f43ff718-b2f6-4858-921d-f445c423513c": "We went on a family vacation every summer", // en-a2-childhood
  "cd481189-28e8-4af6-acda-687857e6f773": "The English alphabet has 26 letters", // en-alphabet
  "4b73d24f-3275-4089-98dd-55d1dbb9c220": "It is raining heavily today", // en-weather-climate
  "fbe73630-6d47-44e6-b1ef-9404f449852b": "We should support the local community project", // en-b1-opinions
  "d464da30-dbba-495e-aba6-787017129455": "They were playing cards while it was raining outside", // en-b1-past-continuous
  "f690f720-5658-42b2-bf20-075938a7c6cd": "Never have they seen such a performance", // en-b2-inversion
  "6d14d442-597b-4781-9e35-1d5857fd7ae1": "You must try this dish", // en-b1-modals
  "a77065ee-8e0e-4131-b2c0-3862dbeaa207": "He is very articulate about difficult subjects", // en-b2-error-correction
  "fb7b67de-0906-4f42-a947-56cf79025906": "If I could travel the world I would go to Japan", // en-b1-second-conditional
  "00aaf8cd-65f2-4645-b9d0-f2becc5bbbe3": "If I had more money I would buy a faster car", // en-b1-what-would
  "a98838f4-389e-4dbb-af53-166daf225d66": "If it is sunny we will go to the beach", // en-b1-first-conditional
  "4c3f4f18-5106-4349-b807-7c562df14f7e": "If I were you I would take the job", // en-b1-unit4-review
  "ec7bdaf8-092b-45e9-bdc7-5f3812428842": "A concise summary captures the main idea", // en-b2-summarize
  "99b25e27-f1f1-4b9b-b0db-f3848ed7a03e": "The panda is an animal that is endangered", // en-b1-relative-clauses
  "9389b087-d525-420b-90ce-f4c50144402a": "It is important to visit the doctor", // en-a2-unit5-review
  "4bb3cb08-843f-4b71-8642-69af0ebbf80e": "Scientists conduct experiments to test their ideas", // en-b2-unit6-review
  "6bed2dcb-f3ce-4ec9-bc64-d2ea550564d7": "A literature symposium will be held at the university", // en-b2-arts-vocab
  "48d380aa-17c6-43d4-bf94-9758cff10b14": "We can enjoy a conversation", // en-a2-unit7-review
  "1c6d5028-291c-404e-8b80-bc94ad5714b5": "We must discuss the economic consequences of the crisis", // en-b2-panel
  "b089b527-1bfa-45f6-994f-3977f6393795": "Presenting clearly is an important skill", // en-b1-presentation
  "4814926a-72ec-4d46-bbc4-6d3c39c2339f": "I have plans to achieve my goals", // en-b1-final-review
};

function shuffled(a) {
  const out = [...a];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function page(table, cols, filter) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    let q = s.from(table).select(cols).order("id").range(from, from + 999);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}

/** Tokens of `need` not covered by `have`, respecting multiplicity. */
function missingTokens(have, need) {
  const pool = [...have];
  const missing = [];
  for (const t of need) {
    const i = pool.indexOf(t);
    if (i >= 0) pool.splice(i, 1);
    else missing.push(t);
  }
  return { missing, leftovers: pool };
}

async function main() {
  const [exercises, lessons] = await Promise.all([
    page("exercises", "id,lesson_id,content", (q) => q.eq("exercise_type", "REORDER")),
    page("lessons", "id,slug"),
  ]);
  const slug = Object.fromEntries(lessons.map((l) => [l.id, l.slug]));

  let fixed = 0, skipped = 0;
  for (const ex of exercises) {
    const c = ex.content ?? {};
    const words = Array.isArray(c.words) ? c.words.map(String) : [];
    const order = Array.isArray(c.correctOrder) ? c.correctOrder.map(String) : [];
    if (!order.length) continue;

    if (REWRITES[ex.id]) {
      const sentence = REWRITES[ex.id];
      const tokens = sentence.split(" ");
      if (order.join(" ") === sentence) continue; // already applied
      console.log(`${slug[ex.lesson_id]} ${ex.id} REWRITE\n   was    ${order.join(" ")}\n   now    ${sentence}`);
      if (APPLY) {
        const content = { ...c, words: shuffled(tokens), correctOrder: tokens, meaning: `${sentence}.`, translation: `${sentence}.` };
        const { error } = await s.from("exercises").update({ content }).eq("id", ex.id);
        if (error) console.log(`   ⚠️  update failed: ${error.message}`);
        else fixed++;
      } else fixed++;
      continue;
    }

    if (order.every((o) => /^\d+$/.test(o))) {
      // Index-form answers are the auditor's job (audit-learn-content --fix).
      console.log(`skip ${slug[ex.lesson_id]} ${ex.id}: correctOrder is numeric`);
      skipped++;
      continue;
    }

    const { missing, leftovers } = missingTokens(words, order);
    if (!missing.length) continue;

    const next = [...words];
    for (const m of missing) {
      const caseTwin = leftovers.findIndex((w) => w.toLowerCase() === m.toLowerCase());
      if (caseTwin >= 0) {
        next[next.indexOf(leftovers[caseTwin])] = m;
        leftovers.splice(caseTwin, 1);
      } else {
        next.push(m);
      }
    }

    console.log(`${slug[ex.lesson_id]} ${ex.id}\n   words ${JSON.stringify(words)}\n   →     ${JSON.stringify(next)}\n   answer ${order.join(" ")}`);
    if (APPLY) {
      const { error } = await s.from("exercises").update({ content: { ...c, words: next } }).eq("id", ex.id);
      if (error) console.log(`   ⚠️  update failed: ${error.message}`);
      else fixed++;
    } else fixed++;
  }

  console.log(`\n${APPLY ? "fixed" : "would fix"} ${fixed} of ${exercises.length} REORDER exercises (${skipped} skipped as numeric)`);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
