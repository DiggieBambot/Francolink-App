// scripts/preview-lesson.mjs
//
// One-shot: paste a Google Doc URL → see the converted lesson in your browser.
// No database, no admin page, no auth. Just preview the output.
//
// Usage:
//   node scripts/preview-lesson.mjs <docIdOrUrl>
//
// Example:
//   node scripts/preview-lesson.mjs https://docs.google.com/document/d/1T3i0baTLc2DkJBsuTnpYYE1op02i0rvT/edit

import { writeFileSync, mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { spawn } from "child_process";
import { extractDocId, fetchDocText, geminiConvert, validateLesson } from "./convert-lesson-doc.mjs";

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: node scripts/preview-lesson.mjs <docIdOrUrl>");
  process.exit(1);
}

const docId = extractDocId(arg);
if (!docId) {
  console.error(`Could not extract a Google Doc ID from: ${arg}`);
  process.exit(1);
}

console.log(`→ Fetching doc ${docId}…`);
const docText = await fetchDocText(docId);
console.log(`  ${docText.length} chars`);

console.log(`→ Converting with Gemini…`);
const lesson = await geminiConvert(docText);

const issues = validateLesson(lesson);
if (issues.length) {
  console.warn(`  ⚠ ${issues.length} validation issue(s):`);
  for (const i of issues) console.warn(`    · ${i}`);
} else {
  console.log(`  ✓ schema valid`);
}

const dir = mkdtempSync(join(tmpdir(), "francolink-"));
const jsonPath = join(dir, `${lesson.slug}.json`);
const htmlPath = join(dir, `${lesson.slug}.html`);
writeFileSync(jsonPath, JSON.stringify(lesson, null, 2));

console.log(`→ Rendering preview…`);
// Re-use the renderer.
const renderer = await import("./render-lesson-html.mjs").catch(() => null);
// Above won't actually render because render-lesson-html.mjs runs at import time.
// Easier: shell out to it.

const child = spawn("node", ["scripts/render-lesson-html.mjs", jsonPath, htmlPath], {
  stdio: "inherit",
});
await new Promise((res, rej) => {
  child.on("exit", (code) => (code === 0 ? res() : rej(new Error(`renderer exited ${code}`))));
});

console.log(`\n✓ Lesson:  ${lesson.title}`);
console.log(`  Level:   ${lesson.level}`);
console.log(`  Tags:    ${(lesson.topic_tags || []).join(", ")}`);
console.log(`  HTML:    ${htmlPath}`);
console.log(`  JSON:    ${jsonPath}`);

// Auto-open in default browser on macOS.
if (process.platform === "darwin") {
  spawn("open", [htmlPath]);
  console.log(`  (opened in browser)`);
} else {
  console.log(`  Open this file in a browser to view.`);
}
