// Reviews for the workbook sales page.
//
// ---------------------------------------------------------------------------
// The rule, and it is not negotiable
// ---------------------------------------------------------------------------
// Every entry in this file must be a real quote, from a real reader, who has
// actually bought and used the workbook, and who has given permission to be
// quoted by the name shown. No composites. No "representative" quotes. No
// rewriting someone's words into better copy than they wrote.
//
// This is the same standard /testimonials already states out loud -- "Every
// quote here comes from a FrancoLink learner. No stock photos." -- and it is
// the standard a payment processor applies too: fabricated reviews on a
// checkout page are a chargeback defence you cannot win.
//
// The section renders nothing at all while the array is empty, so the page is
// honest by construction rather than by anyone remembering.
//
// ---------------------------------------------------------------------------
// Reviews of the EARLIER edition
// ---------------------------------------------------------------------------
// Readers of the pre-expansion book are real customers and their words belong
// here. One rule applies on top of the ones above: a quote must not imply the
// reader used something that did not exist when they read it. They never saw
// the interactive online version, the audio pack, or Parts 3-5 as they now
// stand, so nothing attributed to them may praise those. Set `edition: "first"`
// on those entries -- it is there to make the constraint visible at the point
// of editing, not to be displayed.
//
// ---------------------------------------------------------------------------
// How to fill it
// ---------------------------------------------------------------------------
// The T+9d email in the sequence is the natural place to ask. Ask for one
// specific thing rather than "a review" -- "which section finally made
// something click?" produces usable, concrete quotes; "what did you think?"
// produces "great book, thanks". Paste the reply here verbatim, with the
// section they named, and ask before using a surname.

export interface Review {
  /** Verbatim. Trim for length at a sentence boundary; never reword. */
  quote: string;
  /** As they agreed to be shown — "Marie T." is fine, invented names are not. */
  name: string;
  /** Optional, and only if true: "Toronto", "learning since 2023". */
  context?: string;
  /** The section they credited. Concrete beats effusive. */
  section?: string;
  /**
   * Which edition they actually read. "first" means the pre-expansion book:
   * no audio, no online version, thinner Parts 3-5. Their quote must not
   * reference any of those.
   */
  edition?: "first" | "current";
}

export const REVIEWS: Review[] = [
  // Paste real quotes here. Shape:
  //
  // {
  //   quote: "I finally understand when to use the imparfait. The side-by-side
  //           mistake boxes did it — I had been making the second one for years.",
  //   name: "Marie T.",
  //   context: "Toronto",
  //   section: "Partie 4",
  //   edition: "first",
  // },
];

/** True when there is something honest to show. */
export const HAS_REVIEWS = REVIEWS.length > 0;
