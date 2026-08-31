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

  // Headings are the only structure needed here: h1 opens a part, h2 opens a
  // section, everything until the next heading belongs to it.
  const re = /<(h1 class="part"|h2) id="([^"]+)">([\s\S]*?)<\/(?:h1|h2)>/g;
  const marks: { tag: string; id: string; title: string; start: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    marks.push({
      tag: m[1].startsWith("h1") ? "h1" : "h2",
      id: m[2],
      title: m[3].replace(/<[^>]+>/g, "").trim(),
      start: m.index,
      end: re.lastIndex,
    });
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
