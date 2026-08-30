// Marking a workbook answer.
//
// The whole of the interactive workbook rests on this file, and the
// interesting decision in it is about accents.
//
// Our buyers are North American adults on US keyboards (PRD §2). Most of them
// cannot type é without stopping to think, and a grader that marks
// "j'ai achete" wrong is not teaching French — it is testing keyboard layouts,
// and it generates a support ticket every time. So an unaccented answer is
// CORRECT, and we show the accented form beside it. The learner gets the point
// and sees the spelling; nobody gets punished for their hardware.
//
// The exception is when the accent IS the exercise. §1.2 teaches that accents
// distinguish words -- ou/où, a/à, et/été -- and there "correct but watch the
// accent" would be a lie. Those items set `strictAccents`.

export type Verdict = "correct" | "accent" | "incorrect";

export interface CheckResult {
  verdict: Verdict;
  /** The answer we consider canonical — what to show them once they're right. */
  canonical: string;
}

export interface Blank {
  /** Accepted answers, most canonical first. */
  answers: string[];
  /** When the accent carries the meaning, an unaccented answer is wrong. */
  strictAccents?: boolean;
}

/** Lowercase, unify apostrophes and quotes, collapse space, drop end punctuation. */
function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    // Curly apostrophes come from phones and from pasting out of the PDF.
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    // French spacing before ! ? : ; is correct typography and irrelevant here.
    .replace(/\s+/g, " ")
    .replace(/[.!?;:]+$/, "");
}

/** Same again, with every diacritic removed: é→e, ç→c, ï→i, œ→oe. */
function deaccent(s: string): string {
  return normalize(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae");
}

export function checkAnswer(input: string, blank: Blank): CheckResult {
  const canonical = blank.answers[0] ?? "";
  const given = normalize(input);
  if (!given) return { verdict: "incorrect", canonical };

  for (const answer of blank.answers) {
    if (given === normalize(answer)) return { verdict: "correct", canonical: answer };
  }

  if (blank.strictAccents) return { verdict: "incorrect", canonical };

  const bare = deaccent(input);
  for (const answer of blank.answers) {
    if (bare === deaccent(answer)) return { verdict: "accent", canonical: answer };
  }

  return { verdict: "incorrect", canonical };
}

/** What to say. Kept here so the reader and the sales demo never diverge. */
export function feedbackFor(result: CheckResult): string {
  switch (result.verdict) {
    case "correct":
      return "Correct.";
    case "accent":
      return `Correct — watch the accent: ${result.canonical}`;
    case "incorrect":
      return `Not quite — ${result.canonical}`;
  }
}
