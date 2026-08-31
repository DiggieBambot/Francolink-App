// The book, as the reader consumes it.
//
// Both the PDF and this come from the same generated HTML (content/workbook/
// build/), so the online version cannot drift out of step with the file people
// download. Regenerating the book updates both.

import { readFile } from "node:fs/promises";
import path from "node:path";

export interface ExerciseItem { i: number; text: string; answers: string[] }
export type ExerciseMap = Record<string, ExerciseItem[]>;

export interface Section {
  id: string;
  title: string;
  part: string;
  html: string;
}

function dir() {
  return path.join(process.cwd(), "src", "lib", "workbook", "content");
}

/** Split the generated body into parts and sections the reader can page through. */
export async function loadBook(): Promise<Section[]> {
  const html = await readFile(path.join(dir(), "book-body.html"), "utf8");
  const sections: Section[] = [];
  let part = "";

  // Two shapes carry structure: a chapter opener <section>, which owns the
  // part's id and title, and an <h2> for each section inside it. The opener is
  // matched by its whole block so its own page (intro + contents) stays intact.
  const re =
    /<section class="opener" id="([^"]+)">(?:<p class=chapter-n>([\s\S]*?)<\/p>)?<h1 class="chapter-t">([\s\S]*?)<\/h1>|<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g;
  const marks: { tag: string; id: string; title: string; start: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    // Titles are rendered as text in the reader's nav, so the entities the
    // generated HTML carries ("&amp;") must come back as characters.
    const strip = (x: string) =>
      x.replace(/<[^>]+>/g, "")
       .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
       .replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
       .trim();
    if (m[1]) {
      const label = strip(m[2] || "");
      const title = strip(m[3]);
      marks.push({
        tag: "h1",
        id: m[1],
        title: label ? `${label} · ${title}` : title,
        start: m.index,
        end: re.lastIndex,
      });
    } else {
      marks.push({ tag: "h2", id: m[4], title: strip(m[5]), start: m.index, end: re.lastIndex });
    }
  }

  marks.forEach((mk, i) => {
    const body = html.slice(mk.end, marks[i + 1]?.start ?? html.length);
    if (mk.tag === "h1") {
      part = mk.title;
      // A part opener carries its own intro text, so it is a section too.
      sections.push({ id: mk.id, title: mk.title, part, html: body });
    } else {
      sections.push({ id: mk.id, title: mk.title, part, html: body });
    }
  });

  return sections;
}

export async function loadExercises(): Promise<ExerciseMap> {
  return JSON.parse(await readFile(path.join(dir(), "exercises.json"), "utf8"));
}
