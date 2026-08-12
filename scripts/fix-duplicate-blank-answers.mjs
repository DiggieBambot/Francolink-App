// scripts/fix-duplicate-blank-answers.mjs
// Hand-verified fixes for the "misplaced/misattributed blank" content bug found
// by scan-duplicate-blank-answers.mjs. Each fix below was individually reviewed
// against the full dialogue context — this is NOT a generic regex transform.
//
// Two bug shapes, both content-authoring issues (not rendering bugs):
//   A) The blank sits adjacent to a redundant literal copy of its own answer
//      (e.g. "(2) mes amis s'appellent Eli et Sophie." for answer "s'appellent")
//      → strip the redundant literal text so only the blank remains.
//   B) The blank's mapped "valid answer" is wrong — it points at a word that's
//      already elsewhere in the sentence, while the REAL missing word sits
//      unused in the pool (e.g. blank mapped to "marié" when "marié(e)" is
//      already visible in the text, but pool has an unused "Etes-vous")
//      → remap valid_answers_by_blank (and top up the pool) to the real word.
//
// Explicitly EXCLUDED (verified as grammatically correct, not bugs):
//   - Reflexive verbs: "Nous (3) couchons tard." → "nous nous couchons" is
//     correct French (nous-form reflexive pronoun is "nous").
//   - Noun gender & number: "une souris → des (4)" → "souris" is invariable
//     in the plural; "des souris" is correct.
//   - Direct object pronouns: "Il connaît les élèves. → Il (2) connaît." →
//     "il les connaît" correctly reuses "les" as a pronoun.
//   - Reported speech: "Léa demande (2) j'habite." → "où j'habite" correctly
//     echoes the question word from the quoted question.
// Also EXCLUDED (deeper garbled-dialogue issues beyond simple duplication —
// flagged for a full reconvert, not mechanically patched):
//   - "Urgences de Voyage - Objets Perdus et Trouvés" → Remplissez les Blancs
//   - "Mauvais temps" → Remplissez les blancs
//
// DRY-RUN by default. Pass --apply to write.

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

// Each fix: locate the lesson by id + section title, then apply a mutator.
const FIXES = [
  {
    lessonId: "419c1b0d-5cfc-4e31-8529-4790e9f858bb",
    lessonTitle: "Décrivez les membres de votre famille",
    sectionTitle: "Remplissez les blancs",
    describe: "blank(2): remap 'marié' → 'Etes-vous' (was pointing at the wrong word)",
    mutate: (section) => {
      section.valid_answers_by_blank["2"] = ["Etes-vous"];
      // pool already contains "Etes-vous" unused — nothing to add.
    },
  },
  {
    lessonId: "6e151983-7a6d-4d2f-a6c6-c67ac5f00714",
    lessonTitle: "À quelle fréquence faites-vous du sport ?",
    sectionTitle: "Remplissez les blancs",
    describe: "blank(1): drop redundant leading 'Je '; blank(4): remap 'parfois' → 'sens'",
    mutate: (section) => {
      const ex1 = section.exchanges[1];
      ex1.text = ex1.text.replace("Je (1)_________ tous les jours.", "(1)_________ tous les jours.");
      section.valid_answers_by_blank["1"] = ["Je fais"];
      section.valid_answers_by_blank["4"] = ["sens"];
      const pool = section.answer_pool;
      const i1 = pool.indexOf("je fais");
      if (i1 !== -1) pool[i1] = "Je fais";
      // second "parfois" (index after the first) was meant to be "sens" for blank 4.
      const firstParfois = pool.indexOf("parfois");
      const secondParfois = pool.indexOf("parfois", firstParfois + 1);
      if (secondParfois !== -1) pool[secondParfois] = "sens";
    },
  },
  {
    lessonId: "29614910-fd17-4f4a-a3bd-3cc962511571",
    lessonTitle: "Quels plats et boissons préférez-vous ?",
    sectionTitle: "Remplissez les blancs",
    sectionKind: "fill_in_blank_dialogue_extended", // lesson has two sections with this title
    describe: "blank(3) and blank(4): drop redundant literal text after the blank",
    mutate: (section) => {
      const e5 = section.exchanges[5];
      e5.text = e5.text.replace("(3) Quelles boissons aimes-tu ?", "(3) boissons aimes-tu ?");
      const e7 = section.exchanges[7];
      e7.text = e7.text.replace("(4) Je déteste le café.", "(4) le café.");
    },
  },
  {
    lessonId: "1270d04d-fc59-4e5f-a3ba-b29dba4f4936",
    lessonTitle: "Quels sports aimez-vous ?",
    sectionTitle: "Remplissez les blancs",
    describe: "blank(3): remap 'plus'→'que'; blank(4): remap 'est'→'plus'; blank(5): drop redundant text",
    mutate: (section) => {
      section.valid_answers_by_blank["3"] = ["que"];
      section.valid_answers_by_blank["4"] = ["plus"];
      const pool = section.answer_pool;
      const iEst = pool.indexOf("est");
      if (iEst !== -1) pool[iEst] = "que";
      const e7 = section.exchanges[7];
      e7.text = e7.text.replace("Parce que c'est (5) _______ amusant.", "Parce que c'est (5) _______.");
    },
  },
  {
    lessonId: "4ae1e206-92a0-455b-b95c-d9b0c658817a",
    lessonTitle: "Partagez vos activités préférées par temps",
    sectionTitle: "Remplissez les blancs",
    sectionKind: "fill_in_blank_dialogue_extended", // lesson has two sections with this title
    describe: "blank(4): drop redundant trailing 'le matin'",
    mutate: (section) => {
      const e6 = section.exchanges[6];
      e6.text = e6.text.replace(
        "Je fais du vélo (4)___________ le matin.",
        "Je fais du vélo (4)___________."
      );
    },
  },
  {
    lessonId: "50df5ac0-b9d7-461b-a489-006bfc90e4f1",
    lessonTitle: "Discutez de vos récents achats",
    sectionTitle: "Remplissez les blancs",
    describe: "blank(4): drop redundant trailing 'une robe'",
    mutate: (section) => {
      const e4 = section.exchanges[4];
      e4.text = e4.text.replace("J'ai acheté (4) une robe.", "J'ai acheté (4).");
    },
  },
  {
    lessonId: "2a43c0b0-e72c-4bc0-b623-116bba0b5b9a",
    lessonTitle: "Parlez de vos acteurs et musiciens préférés",
    sectionTitle: "Remplissez les blancs",
    sectionKind: "fill_in_blank_dialogue_extended", // lesson has two sections with this title
    describe: "blank(2): drop redundant trailing 'et talentueux'",
    mutate: (section) => {
      const e3 = section.exchanges[3];
      e3.text = e3.text.replace(
        "Parce qu'il est (2) ___________ et talentueux.",
        "Parce qu'il est (2) ___________."
      );
    },
  },
  {
    lessonId: "a3bdbed4-6a60-4554-9154-8fb7a458b543",
    lessonTitle: "Parlez de l'impact de la science et de la technologie sur votre vie",
    sectionTitle: "Remplissez les blancs",
    describe: "blank(2): drop redundant trailing 'connecte'",
    mutate: (section) => {
      const e2 = section.exchanges[2];
      e2.text = e2.text.replace(
        "La technologie nous ___ (2) connecte, mais elle peut aussi nous éloigner.",
        "La technologie nous ___ (2), mais elle peut aussi nous éloigner."
      );
    },
  },
  {
    lessonId: "9a9b0851-5822-4c6b-b84a-c1c8da1785cf",
    lessonTitle: "Parlez de vos amis",
    sectionTitle: "Remplissez les blancs",
    describe: "blank(2): move marker to replace 's'appellent' instead of preceding the whole clause",
    mutate: (section) => {
      const e3 = section.exchanges[3];
      e3.text = e3.text.replace(
        "(2) mes amis s'appellent Eli et Sophie.",
        "Mes amis (2) Eli et Sophie."
      );
    },
  },
];

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    die("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  }
  console.log(APPLY ? "🔴 APPLY mode — writing changes.\n" : "🟢 DRY-RUN — nothing will be written. Pass --apply to write.\n");

  for (const fix of FIXES) {
    const { data: lesson, error } = await supa
      .from("tutor_lessons")
      .select("id, title, content")
      .eq("id", fix.lessonId)
      .maybeSingle();
    if (error || !lesson) {
      console.log(`⚠️  "${fix.lessonTitle}" — could not load (${error?.message || "not found"})`);
      continue;
    }
    const section = (lesson.content.sections || []).find(
      (s) => s.title === fix.sectionTitle && (!fix.sectionKind || s.kind === fix.sectionKind)
    );
    if (!section) {
      console.log(`⚠️  "${fix.lessonTitle}" → "${fix.sectionTitle}" — section not found`);
      continue;
    }

    const before = JSON.stringify(section);
    let changed = false;
    try {
      fix.mutate(section);
      changed = before !== JSON.stringify(section);
    } catch (e) {
      console.log(`⚠️  "${fix.lessonTitle}" → "${fix.sectionTitle}" — mutate failed: ${e.message} (skipped, nothing written)`);
      continue;
    }

    console.log(`${changed ? "✏️ " : "·  "} "${fix.lessonTitle}" → "${fix.sectionTitle}"`);
    console.log(`    ${fix.describe}`);
    if (!changed) console.log("    (no change — pattern not found; text may have already been fixed)");

    if (changed && APPLY) {
      const { error: upErr } = await supa.from("tutor_lessons").update({ content: lesson.content }).eq("id", lesson.id);
      if (upErr) console.log(`    ❌ save failed: ${upErr.message}`);
      else console.log("    ✅ saved");
    }
  }

  console.log(APPLY ? "\n✅ Applied." : "\n🟢 DRY-RUN complete. Re-run with --apply to write the above.");
  console.log("\nSkipped entirely (deeper garbled-dialogue issues, need a full reconvert):");
  console.log("  • Urgences de Voyage - Objets Perdus et Trouvés → Remplissez les Blancs");
  console.log("  • Mauvais temps → Remplissez les blancs");
}

main().catch((e) => die(e.message || String(e)));
