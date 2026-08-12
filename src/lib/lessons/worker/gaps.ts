// Finding lessons that ought to exist but don't.
//
// The syllabus categories encode their position in the slug itself
// (fr-grammar-a1-07-negation), which sortForCategory already relies on. A hole
// in that numbering is a missing lesson: if 06 and 08 exist but 07 doesn't,
// something was never written.

const SLUG_RE = /^(.*?)-([abc][12])-(\d{1,2})-(.*)$/i;

export interface Gap {
  /** The slug the missing lesson should occupy, e.g. "fr-grammar-a1-07". */
  slugPrefix: string;
  category: string;
  level: string;
  sequence: number;
  /** Titles of the lessons either side, so the generator knows the context. */
  before?: string;
  after?: string;
}

export interface SlugRow {
  slug: string;
  title: string;
  level: string;
}

/** Detect numbering holes per (category, level). Only reports interior gaps —
 *  a missing lesson 12 when the series ends at 11 is not a gap, it's just the
 *  end of the series, and we shouldn't invent an unbounded tail. */
export function findGaps(rows: SlugRow[]): Gap[] {
  const groups = new Map<string, { seq: number; title: string; level: string; category: string }[]>();

  for (const r of rows) {
    const m = SLUG_RE.exec(r.slug);
    if (!m) continue;
    const [, category, levelRaw, seqRaw] = m;
    const level = levelRaw.toUpperCase();
    const key = `${category}|${level}`;
    const list = groups.get(key) ?? [];
    list.push({ seq: parseInt(seqRaw, 10), title: r.title, level, category });
    groups.set(key, list);
  }

  const gaps: Gap[] = [];

  for (const [key, list] of groups) {
    // A series of one or two lessons tells us nothing about what's missing.
    if (list.length < 3) continue;

    list.sort((a, b) => a.seq - b.seq);
    const present = new Set(list.map((l) => l.seq));
    const [category, level] = key.split("|");
    const min = list[0].seq;
    const max = list[list.length - 1].seq;

    for (let n = min + 1; n < max; n++) {
      if (present.has(n)) continue;
      gaps.push({
        slugPrefix: `${category}-${level.toLowerCase()}-${String(n).padStart(2, "0")}`,
        category,
        level,
        sequence: n,
        before: list.filter((l) => l.seq < n).pop()?.title,
        after: list.find((l) => l.seq > n)?.title,
      });
    }
  }

  return gaps.sort((a, b) => a.slugPrefix.localeCompare(b.slugPrefix));
}
