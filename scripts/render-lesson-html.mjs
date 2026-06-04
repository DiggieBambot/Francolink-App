// scripts/render-lesson-html.mjs
//
// Render a converted lesson JSON as a standalone HTML file you can open in
// any browser. No server, no DB. Includes a Student view / Tutor view toggle.
//
// Usage:
//   node scripts/render-lesson-html.mjs <input.json> [output.html]
//   node scripts/render-lesson-html.mjs /tmp/lesson-converted-2.json

import { readFileSync, writeFileSync } from "fs";

const [, , inPath, outPath] = process.argv;
if (!inPath) {
  console.error("Usage: node scripts/render-lesson-html.mjs <input.json> [output.html]");
  process.exit(1);
}
const out = outPath || inPath.replace(/\.json$/, ".html");
const lesson = JSON.parse(readFileSync(inPath, "utf8"));

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function renderSection(s) {
  const head = `
    <header class="sec-head">
      <span class="num">${esc(s.number)}</span>
      <span class="kind">${esc(s.kind)}</span>
      <h2>${esc(s.title || "")}</h2>
    </header>
    <div class="instructions">
      <div class="student-only"><span class="label">Student</span> ${esc(s.student_instruction || "")}</div>
      <div class="tutor-only"><span class="label">Tutor</span> ${esc(s.tutor_instruction || "")}</div>
    </div>`;

  const body = (() => {
    switch (s.kind) {
      case "warmup_vocabulary":
      case "vocabulary_with_examples":
        return `<ul class="vocab">${(s.items || []).map((it) => `
          <li>
            <div class="term">${esc(it.term)}</div>
            ${it.example ? `<div class="example">${esc(it.example)}</div>` : ""}
            ${it.note ? `<div class="note">${esc(it.note)}</div>` : ""}
          </li>`).join("")}</ul>`;

      case "fill_in_blank_dialogue":
      case "fill_in_blank_dialogue_extended": {
        const ex = s.example ? `<div class="example-block">
          <div><strong>Ex.</strong> ${esc(s.example.tutor_line)}</div>
          <div>→ ${esc(s.example.student_line)}</div>
        </div>` : "";
        const exchanges = (s.exchanges || []).map((e) => `
          <div class="line ${esc(e.speaker_role || "")}">
            <span class="speaker">${esc(e.speaker)}</span>
            <span class="text">${esc(e.text)}${e.blank != null ? ` <em class="blank">(${esc(Array.isArray(e.blank) ? e.blank.join(",") : e.blank)})</em>` : ""}</span>
          </div>`).join("");
        const pool = `<div class="pool"><strong>Pool:</strong> ${(s.answer_pool || []).map((a) => `<span class="chip">${esc(a)}</span>`).join("")}</div>`;
        const answers = s.valid_answers_by_blank ? `<div class="tutor-only answers"><strong>Valid answers:</strong> ${Object.entries(s.valid_answers_by_blank).map(([k, v]) => `<div>(${esc(k)}) → ${Array.isArray(v) ? v.map(esc).join(", ") : esc(v)}</div>`).join("")}</div>` : "";
        return ex + `<div class="dialogue">${exchanges}</div>` + pool + answers;
      }

      case "dialogue_read_aloud": {
        const ctx = s.context ? `<div class="context">${esc(s.context)}</div>` : "";
        const roles = `<div class="roles"><strong>You:</strong> ${esc(s.student_role)} · <strong>Tutor:</strong> ${esc(s.tutor_role)}</div>`;
        const lines = (s.lines || []).map((l) => `
          <div class="line ${esc(l.role || "")}">
            <span class="speaker">${esc(l.speaker)}</span>
            <span class="text">${esc(l.text)}</span>
          </div>`).join("");
        return ctx + roles + `<div class="dialogue">${lines}</div>`;
      }

      case "matching_qa":
        return `<ul class="pairs">${(s.pairs || []).map((p) => `
          <li>
            <div class="q">${esc(p.question)}</div>
            <div class="a">${esc(p.answer)}</div>
          </li>`).join("")}</ul>`;

      case "word_order": {
        const ex = s.example ? `<div class="example-block"><div>${esc(s.example.scrambled)}</div><div>→ ${esc(s.example.correct)}</div></div>` : "";
        return ex + `<ol class="scrambled">${(s.items || []).map((it) => `
          <li>
            <div class="term">${esc(it.scrambled)}</div>
            ${it.expected_topic ? `<div class="tutor-only note">topic: ${esc(it.expected_topic)}</div>` : ""}
          </li>`).join("")}</ol>`;
      }

      case "image_question_prompts": {
        const ex = s.example?.student_question ? `<div class="example-block">Ex: ${esc(s.example.student_question)}</div>` : "";
        return ex + `<ol class="prompts">${(s.prompts || []).map((p) => `
          <li>
            <div>${esc(p.question)}</div>
            <div class="tutor-only note">image: ${esc(p.image_hint)}</div>
          </li>`).join("")}</ol>`;
      }

      case "free_response": {
        const ex = s.example_answer ? `<div class="example-block">Ex: ${esc(s.example_answer)}</div>` : "";
        return ex + `<ol class="questions">${(s.questions || []).map((q) => `<li>${esc(q)}</li>`).join("")}</ol>`;
      }

      default:
        return `<pre>${esc(JSON.stringify(s, null, 2))}</pre>`;
    }
  })();

  return `<section class="lesson-section">${head}${body}</section>`;
}

const tutorOverview = lesson.tutor_overview || {};
const sectionsHtml = (lesson.sections || []).map(renderSection).join("");

const html = `<!doctype html>
<html lang="${esc(lesson.language || "fr")}">
<head>
<meta charset="utf-8">
<title>${esc(lesson.title)} — FrancoLink preview</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width: 820px; margin: 0 auto; padding: 24px; color: #1f2937; background: #f8fafc; line-height: 1.5; }
  header.lesson { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 16px; }
  h1 { margin: 0 0 8px; font-size: 28px; }
  .meta { color: #64748b; font-size: 14px; }
  .level { background: #1e40af; color: white; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 12px; margin-right: 8px; }
  .tags { margin-top: 8px; }
  .tag { display: inline-block; background: #e2e8f0; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 4px; }
  .toggle { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; display: flex; gap: 8px; align-items: center; position: sticky; top: 8px; z-index: 10; }
  .toggle button { padding: 6px 14px; border-radius: 6px; border: 1px solid #cbd5e1; background: white; cursor: pointer; font-weight: 500; }
  .toggle button.active { background: #1e40af; color: white; border-color: #1e40af; }
  .overview { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
  .overview h3 { margin: 0 0 8px; font-size: 14px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; }
  .overview ul { margin: 0 0 16px; padding-left: 20px; }
  .lesson-section { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
  .sec-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
  .num { background: #1e40af; color: white; width: 40px; padding: 4px; border-radius: 6px; text-align: center; font-weight: 600; font-size: 14px; }
  .kind { background: #f1f5f9; color: #475569; font-size: 11px; padding: 2px 8px; border-radius: 4px; font-family: monospace; }
  .sec-head h2 { margin: 0; font-size: 18px; }
  .instructions { background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 12px; font-size: 14px; }
  .instructions > div { margin: 4px 0; }
  .label { display: inline-block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 6px; border-radius: 3px; margin-right: 6px; }
  .student-only .label { background: #dbeafe; color: #1e40af; }
  .tutor-only { background: #ecfdf5; padding: 8px 12px; border-radius: 6px; border-left: 3px solid #10b981; }
  .tutor-only .label { background: #10b981; color: white; }
  body.student-view .tutor-only { display: none; }
  body.tutor-view .student-only .label { display: none; }
  .vocab { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px; }
  .vocab li { background: #f8fafc; padding: 10px; border-radius: 6px; }
  .term { font-weight: 600; }
  .example { font-size: 13px; color: #64748b; margin-top: 2px; }
  .note { font-size: 12px; color: #94a3b8; margin-top: 2px; font-style: italic; }
  .dialogue { background: #f8fafc; padding: 12px; border-radius: 8px; margin: 8px 0; }
  .line { margin: 6px 0; padding: 6px 10px; border-radius: 6px; }
  .line.tutor { background: #fef3c7; }
  .line.student { background: #dbeafe; }
  .speaker { font-weight: 600; margin-right: 8px; }
  .blank { background: #fee2e2; color: #991b1b; padding: 1px 4px; border-radius: 3px; font-style: normal; font-size: 12px; }
  .pool { margin-top: 8px; font-size: 14px; }
  .chip { display: inline-block; background: #e2e8f0; padding: 2px 8px; border-radius: 12px; margin: 2px; font-size: 13px; }
  .answers { margin-top: 8px; font-size: 13px; }
  .example-block { background: #f1f5f9; padding: 8px 12px; border-radius: 6px; font-size: 14px; margin-bottom: 8px; font-style: italic; }
  .pairs, .scrambled, .prompts, .questions { padding-left: 24px; }
  .pairs li { margin: 8px 0; }
  .pairs .q { font-weight: 500; }
  .pairs .a { color: #1e40af; margin-left: 12px; }
  .context, .roles { background: #f8fafc; padding: 8px 12px; border-radius: 6px; margin-bottom: 8px; font-size: 14px; }
</style>
</head>
<body class="tutor-view">
<header class="lesson">
  <div><span class="level">${esc(lesson.level)}</span><span class="meta">${esc(lesson.language)} · ${esc(lesson.duration_minutes || "?")} min</span></div>
  <h1>${esc(lesson.title)}</h1>
  <div class="tags">${(lesson.topic_tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
</header>

<div class="toggle">
  <strong style="margin-right: 8px;">View:</strong>
  <button data-view="student">Student</button>
  <button data-view="tutor" class="active">Tutor</button>
  <span style="margin-left: auto; color: #64748b; font-size: 13px;">FrancoLink preview</span>
</div>

<div class="overview tutor-only">
  <h3>Objectives</h3>
  <ul>${(lesson.objectives || []).map((o) => `<li>${esc(o.student_label)} <em style="color:#64748b">(${esc(o.skill)})</em></li>`).join("")}</ul>
  <h3>Teaching tips</h3>
  <ul>${(tutorOverview.teaching_tips || []).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
  <h3>Common mistakes</h3>
  <ul>${(tutorOverview.common_mistakes || []).map((m) => `<li>${esc(m)}</li>`).join("")}</ul>
</div>

${sectionsHtml}

<script>
  document.querySelectorAll(".toggle button").forEach((b) => {
    b.addEventListener("click", () => {
      const v = b.dataset.view;
      document.body.className = v + "-view";
      document.querySelectorAll(".toggle button").forEach((x) => x.classList.toggle("active", x === b));
    });
  });
</script>
</body>
</html>`;

writeFileSync(out, html);
console.log(`✓ wrote ${out}`);
