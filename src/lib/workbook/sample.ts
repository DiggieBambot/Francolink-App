// The interactive free sample: Partie 0 of the real ebook, with its audio.
//
// Cut from assets/workbook/book.html at request time, like the PDF sample, so
// it can never drift from the book it sells. What a tester gets is the real
// thing, not a description of it:
//
//   * the cover, the how-to-use pages and all of Partie 0
//   * Partie 0's exercise, marked as they answer, by the book's own runtime
//   * all 22 Partie 0 recordings: every survival phrase, and the three
//     dialogues at natural speed and again slowly
//   * the full contents, with everything past Partie 0 shown locked and
//     linking to the sales page
//
// What it must NOT carry is the rest of the book. The answer key is trimmed
// to Partie 0's exercise, and the audio route only signs Partie 0 clips.

import { readFile } from "node:fs/promises";
import path from "node:path";
import audioManifest from "@/lib/workbook/content/audio.json";
import { siteUrl } from "@/lib/site/hosts";

type Clip = { id: string; text: string; kind: string; slow: boolean; section: string | null };

const SAMPLE_PART = "s0-";

/** The Partie 0 clips, in book order. Also the audio route's allow-list. */
export const SAMPLE_CLIPS: Clip[] = (audioManifest as Clip[]).filter(
  (c) => c.section?.startsWith(SAMPLE_PART)
);

const SAMPLE_CLIP_FILES = new Set(
  SAMPLE_CLIPS.flatMap((c) => [`${c.id}-normal.m4a`, ...(c.slow ? [`${c.id}-slow.m4a`] : [])])
);

export function isSampleClip(file: string): boolean {
  return SAMPLE_CLIP_FILES.has(file);
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}

function salesLink(content: string): string {
  return siteUrl(
    `/francais-pas-a-pas?utm_source=sample&utm_medium=ebook&utm_campaign=workbook-sample&utm_content=${content}`
  );
}

/** Absolute, so the page still plays if someone saves it to disk. */
function clipUrl(file: string): string {
  return siteUrl(`/api/workbook/sample/audio/${file}`);
}

function playButtons(c: Clip): string {
  const normal = `<button type="button" class="play" data-src="${clipUrl(`${c.id}-normal.m4a`)}">▶ Listen</button>`;
  const slow = c.slow
    ? ` <button type="button" class="play play-slow" data-src="${clipUrl(`${c.id}-slow.m4a`)}">▶ Slowly</button>`
    : "";
  return normal + slow;
}

const SAMPLE_CSS = `<style>
.sample-bar{background:#C08A2D;color:#1b1406;text-align:center;
  font:600 14px/1.4 "Instrument Sans",system-ui,sans-serif;padding:9px 14px;}
.sample-bar a{color:#1b1406;text-decoration:underline;text-underline-offset:3px;}
.topbuy{flex:none;background:#C08A2D;color:#1b1406;font:600 12px/1 "Instrument Sans",system-ui,sans-serif;
  text-decoration:none;padding:8px 11px;border-radius:7px;white-space:nowrap;}
.listen{margin:14px 0 18px;padding:14px 16px;border:1px solid var(--hair);border-radius:12px;background:#fff;}
.listen .box-l{margin-bottom:8px;}
.chips{display:flex;flex-wrap:wrap;gap:8px;}
.chip{border:1px solid var(--hair);background:var(--tint);color:var(--navy);border-radius:999px;
  padding:6px 12px;font:500 14px "Instrument Sans",system-ui,sans-serif;cursor:pointer;}
.chip:hover,.chip.on{border-color:var(--accent);background:#fff;}
.play{border:0;background:var(--navy);color:#fff;border-radius:8px;padding:7px 12px;
  font:600 13px "Instrument Sans",system-ui,sans-serif;cursor:pointer;margin:0 0 8px;}
.play-slow{background:#fff;color:var(--navy);border:1px solid var(--navy);}
.play.on,.chip.on{outline:2px solid var(--accent);outline-offset:1px;}
a.locked{opacity:.55;}
a.locked::after{content:" 🔒";}
.sample-end{margin:28px 0;padding:26px 22px;border-radius:14px;background:var(--navy);color:#FAFAF7;text-align:center;}
.sample-end h2{color:#FAFAF7;margin:0 0 10px;}
.sample-end p{color:#d8dee6;margin:0 0 14px;}
.sample-end a.cta{display:inline-block;background:#C08A2D;color:#1b1406;font-weight:600;
  text-decoration:none;padding:13px 22px;border-radius:8px;}
@media print{.sample-bar,.listen,.play{display:none;}}
</style>`;

const PLAYER_JS = `<script>
(function () {
  var audio = new Audio(), current = null;
  function stop() { if (current) current.classList.remove("on"); current = null; }
  audio.addEventListener("ended", stop);
  audio.addEventListener("error", function () {
    if (current) current.textContent = "Audio unavailable — try again";
    stop();
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-src]");
    if (!b) return;
    if (current === b && !audio.paused) { audio.pause(); stop(); return; }
    stop();
    current = b; b.classList.add("on");
    audio.src = b.getAttribute("data-src");
    audio.play().catch(stop);
  });
})();
</script>`;

/**
 * Build the sample page. Throws if the book's structure has changed in a way
 * that would make the cut unsafe -- better a 503 than leaking Partie 1.
 */
export async function buildSampleHtml(): Promise<string> {
  const book = await readFile(path.join(process.cwd(), "assets", "workbook", "book.html"), "utf8");

  const layoutAt = book.indexOf('<div class="layout">');
  const part1At = book.indexOf('<section class="opener" id="partie-1');
  const totopAt = book.indexOf('<button class="totop"');
  const answersAt = book.indexOf("<script>window.__WB_ANSWERS__");
  const answersEnd = book.indexOf("</script>", answersAt);
  if ([layoutAt, part1At, totopAt, answersAt, answersEnd].some((i) => i < 0) ||
      !(layoutAt < part1At && part1At < totopAt && totopAt < answersAt)) {
    throw new Error("book.html structure changed; sample cut is unsafe");
  }

  let head = book.slice(0, layoutAt);
  let body = book.slice(layoutAt, part1At);
  const runtime = book.slice(answersEnd + "</script>".length); // the marking runtime, to </html>

  // Only Partie 0's answers ship. Everything else stays in the paid book.
  const answers = JSON.parse(
    book.slice(answersAt + "<script>window.__WB_ANSWERS__ = ".length, answersEnd).replace(/;\s*$/, "")
  ) as Record<string, unknown>;
  const exIds = new Set([...body.matchAll(/data-ex="(\d+)"/g)].map((m) => m[1]));
  const kept: Record<string, unknown> = {};
  for (const id of exIds) if (answers[id]) kept[id] = answers[id];

  // Contents links: live inside the sample, locked (to the sales page) past it.
  const ids = new Set([...body.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const lock = (html: string) =>
    html.replace(/<a href="#([^"]+)">/g, (whole, id: string) =>
      ids.has(id)
        ? whole
        : `<a class="locked" href="${salesLink("contents")}" target="_blank" rel="noopener">`
    );
  head = lock(head);
  body = lock(body);

  // The phrases: every one playable, right under the section heading.
  const phrases = SAMPLE_CLIPS.filter((c) => c.kind === "phrase");
  const s01 = '<h2 id="s0-1">';
  const s01At = body.indexOf(s01);
  if (s01At >= 0 && phrases.length) {
    const end = body.indexOf("</h2>", s01At) + "</h2>".length;
    const chips = phrases
      .map((c) => `<button type="button" class="chip" data-src="${clipUrl(`${c.id}-normal.m4a`)}">▶ ${esc(c.text)}</button>`)
      .join("");
    body =
      body.slice(0, end) +
      `<aside class="listen"><p class="box-l">🔊 Hear every phrase</p><div class="chips">${chips}</div></aside>` +
      body.slice(end);
  }

  // The dialogues: a play button above each one, in book order.
  const dialogues = SAMPLE_CLIPS.filter((c) => c.kind === "dialogue");
  const s04At = body.indexOf('<h2 id="s0-4">');
  if (s04At >= 0 && dialogues.length) {
    let i = 0;
    const before = body.slice(0, s04At);
    const after = body
      .slice(s04At)
      .replace(/<aside class="box dialogue">/g, (m) => {
        const c = dialogues[i++];
        return c ? `<div>${playButtons(c)}</div>${m}` : m;
      });
    body = before + after;
  }

  const bar = `<div class="sample-bar">Free sample: Partie 0, with audio. <a href="${salesLink("bar")}" target="_blank" rel="noopener">Get the full workbook — $27</a></div>`;

  const end = `
<section class="sample-end">
  <h2>That was Partie 0.</h2>
  <p>The full workbook keeps going: all 45 rules from A0 to B2, every exercise marked like the one above with its answer explained, and the audio for every dialogue and drill.</p>
  <a class="cta" href="${salesLink("end")}" target="_blank" rel="noopener">Get the full workbook — $27</a>
  <p style="margin:14px 0 0;font-size:14px">14-day money-back guarantee · PDF + interactive ebook</p>
</section>
<section class="colophon sheet">
  <p>© 2026 Njinu Precious Bambot. Free sample — share it with anyone.</p>
  <p>Published by FrancoLink · francolink.net</p>
</section>
</div>
`;

  head = head
    .replace(/<title>[\s\S]*?<\/title>/, "<title>Free sample — Le Français Pas à Pas (Partie 0 with audio)</title>")
    .replace("</head>", `<meta name="robots" content="noindex">${SAMPLE_CSS}</head>`)
    .replace(/(<body[^>]*>)/, `$1${bar}`)
    // The offer stays in reach after the bar scrolls away: in the book's own
    // sticky top bar, not a second sticky bar on top of it.
    .replace(
      '<span class="prog"></span>',
      `<span class="prog"></span><a class="topbuy" href="${salesLink("topbar")}" target="_blank" rel="noopener">Get the full book</a>`
    );

  return (
    head +
    body +
    end +
    book.slice(totopAt, answersAt) +
    `<script>window.__WB_ANSWERS__ = ${JSON.stringify(kept)};</script>` +
    runtime.replace("</body>", `${PLAYER_JS}</body>`)
  );
}
