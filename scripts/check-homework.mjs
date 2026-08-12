// Quality gate for fr-grammar homework specs. Run before every seed:
//   node scripts/check-homework.mjs
// Catches the authoring bugs that actually shipped: reorder tokens that don't
// rebuild the answer, reorder options left in the CORRECT order (zero-difficulty
// exercise), multi-answer fill_blanks, MCQ answers missing from the options,
// and stray single asterisks (which render literally).
import fs from "node:fs";
import path from "node:path";

const DIR = "src/lib/seed/fr-grammar";
const files = fs.readdirSync(DIR).filter((f) => /^homework-[abc][12]\.ts$/.test(f));

const norm = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[.,!?;:'’"]/g, "")
    .replace(/\s+/g, " ")
    .trim();

let errors = 0;
let stats = { reorder: 0, fill_blank: 0, mcq: 0, free: 0 };

function fail(file, slug, msg) {
  errors++;
  console.log(`✗ [${file}] ${slug}: ${msg}`);
}

for (const file of files) {
  const src = fs.readFileSync(path.join(DIR, file), "utf8");

  if (/(?<!\*)\*(?!\*)/.test(src)) fail(file, "-", "stray single asterisk (renders literally)");

  // Split into question objects, tracking the enclosing lesson_slug.
  const blocks = src.split(/\n(?=      \{\n        type:)/);
  let slug = "-";
  for (const b of blocks) {
    const sm = [...b.matchAll(/lesson_slug: "([^"]+)"/g)].pop();
    if (sm) slug = sm[1];

    const type = b.match(/type: "(\w+)"/)?.[1];
    if (!type) continue;
    const answer = b.match(/answer: "((?:[^"\\]|\\.)*)"/)?.[1]?.replace(/\\"/g, '"');
    const optRaw = b.match(/options: \[([\s\S]*?)\],/)?.[1];
    const options = optRaw ? [...optRaw.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1].replace(/\\"/g, '"')) : null;
    const sentence = b.match(/sentence: "((?:[^"\\]|\\.)*)"/)?.[1];

    if (type === "reorder") {
      stats.reorder++;
      if (!options || !answer) { fail(file, slug, "reorder missing options/answer"); continue; }
      const a = options.map(norm).sort();
      const c = norm(answer).split(" ").sort();
      if (JSON.stringify(a) !== JSON.stringify(c))
        fail(file, slug, `reorder tokens don't rebuild answer → ${JSON.stringify(options)} vs "${answer}"`);
      if (options.join(" ") === answer)
        fail(file, slug, `reorder options are in CORRECT order (no exercise) → "${answer}"`);
      if (options.length < 4) fail(file, slug, `reorder too short (${options.length} tokens) → "${answer}"`);
      for (const o of options)
        if (/\s/.test(o))
          fail(file, slug, `reorder token "${o}" contains a space — the renderer splits on spaces and can never match it`);
    }

    if (type === "fill_blank") {
      stats.fill_blank++;
      if (!answer) { fail(file, slug, "fill_blank missing answer"); continue; }
      if (answer.includes("/")) fail(file, slug, `fill_blank has a multi-answer "${answer}" — one blank, one answer`);
      if (!sentence) fail(file, slug, "fill_blank missing sentence");
      else {
        const blanks = (sentence.match(/___/g) || []).length;
        if (blanks !== 1) fail(file, slug, `fill_blank sentence has ${blanks} blanks (want exactly 1)`);
      }
    }

    if (type === "mcq") {
      stats.mcq++;
      if (!options || !answer) { fail(file, slug, "mcq missing options/answer"); continue; }
      if (!options.includes(answer)) fail(file, slug, `mcq answer "${answer}" is not one of the options`);
      if (options.length < 3) fail(file, slug, "mcq has fewer than 3 options");
      if (new Set(options).size !== options.length) fail(file, slug, "mcq has duplicate options");
    }

    if (type === "long" || type === "short") stats.free++;
  }
}

console.log(
  `\n${files.length} file(s) · ${stats.reorder} reorder · ${stats.fill_blank} fill_blank · ${stats.mcq} mcq · ${stats.free} written`
);
console.log(errors === 0 ? "✓ all checks passed" : `\n${errors} problem(s) found`);
process.exit(errors === 0 ? 0 : 1);
