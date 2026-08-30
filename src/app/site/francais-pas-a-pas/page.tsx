// Le Français Pas à Pas — the sales page. francolink.net/francais-pas-a-pas
//
// Visual direction, section order and copy voice follow the design brief:
// navy + paper + gold, Fraunces over Instrument Sans, and the direct-response
// order (hook → proof → problem → method → curriculum → offer → objections).
//
// Scoped plain CSS rather than utility classes, deliberately. This project's
// Tailwind build silently drops arbitrary values -- `lg:grid-cols-[1.05fr_.95fr]`
// and `translate-y-full` both produced nothing at all in an earlier pass, which
// is how a single-column hero and an always-visible sticky bar nearly shipped.
// A scoped stylesheet cannot fail that way.
//
// Three things from the brief are deliberately NOT here, and the reason is the
// same each time: a live sales page must not carry placeholders.
//   * The grey "replace with real screenshot" slots. SHOTS is empty, and the
//     section does not render until it holds real images.
//   * Placeholder testimonials. REVIEWS holds real, permissioned quotes only,
//     and the section is gated on it.
//   * The duplicate <Nav> and <Footer>: SiteHeader and SiteFooter come from
//     the site layout already.

import type { Metadata } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import "./workbook.css";
import Link from "next/link";
import { WorkbookCta } from "@/components/site/workbook-cta";
import { WorkbookTry } from "@/components/site/workbook-try";
import { WorkbookStickyCta } from "@/components/site/workbook-sticky-cta";
import { REVIEWS, HAS_REVIEWS } from "@/lib/workbook/reviews";
import { SITE_URL, appUrl } from "@/lib/site/hosts";

// Self-hosted by next/font: no render-blocking @import, no layout shift, and
// nothing injected into the React tree — an inline <style> and a <link> in the
// component body are exactly the kind of thing that breaks hydration.
const fraunces = Fraunces({
  subsets: ["latin"], display: "swap", variable: "--font-display", weight: ["400", "500", "600"],
});
const instrument = Instrument_Sans({
  subsets: ["latin"], display: "swap", variable: "--font-body", weight: ["400", "500", "600"],
});

const TITLE = "Le Français Pas à Pas — the French grammar workbook, A0 to B2";
const DESCRIPTION =
  "The 45 French grammar rules that actually matter — explained, drilled and answered. Written by Njinu Precious Bambot, who has prepared thousands of learners for the TCF, TEF and school exams. PDF plus an interactive version that marks itself.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/francais-pas-a-pas" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/francais-pas-a-pas", type: "website" },
};

// ---------------------------------------------------------------------------
// The launch offer.
//
// Honest scarcity or none at all. This renders a real deadline and disappears
// once it passes -- it is not a countdown that resets on refresh. Keep it ONLY
// if the price genuinely rises to `then` on `endsOn`; a deadline that never
// arrives is the fastest way to fail Meta and Google ad review, and it is an
// FTC matter besides. Set to null to remove it entirely.
// ---------------------------------------------------------------------------
const LAUNCH: { endsOn: string; label: string; then: string } | null = {
  endsOn: "2026-09-13",
  label: "13 September",
  then: "$37",
};

// Real screenshots only. Until these exist the showcase does not render.
const SHOTS: { src: string; alt: string; caption: string }[] = [];

const SAMPLE = [
  {
    ref: "§4.7",
    before: "Les fleurs ? Je les ai ",
    after: " hier.",
    hint: "(acheter)",
    answers: ["achetées"],
    reason:
      "The direct object (les = les fleurs) comes before the verb, so the participle agrees — feminine plural.",
  },
  {
    ref: "§3.7",
    before: "C'est le problème ",
    after: " nous avons parlé.",
    answers: ["dont"],
    reason: "parler DE quelque chose. When the verb needs de, the relative pronoun is dont.",
  },
  {
    ref: "§3.6",
    before: "Il a trois chiens ? — Oui, il ",
    after: " a trois.",
    answers: ["en"],
    reason: "en replaces de + noun, and every quantity. He has three of them → il en a trois.",
  },
];

const PAINS = [
  "You have the vocabulary, but you freeze when it is time to actually build the sentence.",
  "You learned a rule last month and it has already gone.",
  "You still translate from English in your head before you speak.",
  "You avoid y, en and the object pronouns entirely, because you are never quite sure.",
  "Your grammar answers are scattered across ten YouTube tabs and three apps.",
];

const METHOD: [string, string, string][] = [
  ["01", "Understand", "The rule, and the reason behind it. Not just the form, but why the form is what it is."],
  ["02", "See", "The structure inside a real dialogue, so you meet it the way you will actually hear it."],
  ["03", "Use", "You practise it immediately, on the exact mistake learners make with it."],
  ["04", "Fix", "The answer key tells you why you were right or wrong — the part every app skips."],
];

const PARTS: [string, string, string][] = [
  ["0", "Survival French", "20 phrases and three dialogues you can use today — before a single rule."],
  ["1", "Sounds & foundations", "Liaison, nasal vowels, the French u. Être, avoir, questions, negation."],
  ["2", "Everyday actions", "The three verb groups, the near future, adjectives, comparison, the imperative."],
  ["3", "Pronouns & nuance", "le / la / lui / leur, y and en, qui / que / où / dont."],
  ["4", "The past", "Imparfait, passé composé, plus-que-parfait — and how to choose."],
  ["5", "Future, hypothesis, subjunctive", "Conditional, reported speech, and how to argue a point in French."],
];

const DELIVERABLES: [string, string][] = [
  ["Step-by-step builds", "Every structure assembled one piece at a time — no leaps."],
  ["Scannable conjugation tables", "Laid out so you can actually find the form you need."],
  ["Common-error boxes", "The mistake learners make, then the fix — side by side."],
  ["Marked-up dialogues", "Real French with the grammar pointed out inside it."],
  ["45 graded exercises", "With a complete answer key that explains, not just scores."],
  ["PDF + interactive version", "Keep the PDF; practise online in any browser, progress saved."],
];

const STACK = [
  "95-page workbook (PDF, yours to keep)",
  "The 45 rules that actually matter",
  "45 graded exercises + complete answer key",
  "A0 → B2 progression across six parts",
  "Real dialogues with the grammar marked inside",
  "Common-error boxes throughout",
  "Interactive online version — marks itself",
  "Lifetime access",
];

const FAQ: [string, string][] = [
  ["Is this really A0 to B2?",
   "Yes. It starts at your first phrase and ends with the subjunctive, reported speech, and the connectors used to argue a point in French. Six parts, 45 exercises, every answer given."],
  ["I already know the basics — is it too easy?",
   "Start at Partie 3. Object pronouns, y and en, and the relative pronouns are where nearly every self-taught learner has a hole, and they are what make speech sound French rather than translated."],
  ["Will it help with the TCF or TEF?",
   "It builds the grammar those exams rest on, and it is written by a teacher who prepares candidates for them. It is not a full exam-prep course — there are no mock papers or timed sections — but the structures the written and spoken sections test are exactly what it drills."],
  ["Is it a PDF or an app?",
   "Both, for one price. A PDF to keep and print, plus an online version in your browser where the exercises mark themselves and your progress saves. No download, no app store."],
  ["Do I need an account to buy?",
   "No. You pay first, then set a password — that unlocks the PDF and the online version together."],
  ["Will typing accents be a nightmare?",
   "No. The online version accepts answers without accents, marks them correct, and shows you the accented spelling. You are learning French, not a keyboard layout."],
  ["What if it isn't for me?",
   "14-day money-back guarantee. Reply to your receipt and we refund you — no form, no questions."],
];

export default function Page() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Le Français Pas à Pas — French grammar workbook",
      description: DESCRIPTION,
      brand: { "@type": "Brand", name: "FrancoLink" },
      author: { "@type": "Person", name: "Njinu Precious Bambot" },
      url: `${SITE_URL}/francais-pas-a-pas`,
      offers: {
        "@type": "Offer", price: "27.00", priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/francais-pas-a-pas`,
      },
      // No aggregateRating until there are real, counted reviews. Inventing one
      // is structured-data spam and a manual action waiting to happen.
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map(([q, a]) => ({
        "@type": "Question", name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ];

  return (
    <div className={`fpap ${fraunces.variable} ${instrument.variable}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <WorkbookStickyCta />

      {LAUNCH && (
        <div className="announce">
          <strong>Released in full for the first time.</strong> Launch price $27 until{" "}
          {LAUNCH.label} — then {LAUNCH.then}.
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="sec sec-pad-lg">
        <div className="wrap hero">
          <div>
            <p className="eyebrow">The French grammar workbook · A0 → B2</p>
            <h1 className="h1">
              The 45 French grammar rules that actually matter — explained,
              drilled, and answered.
            </h1>
            <p className="lead">
              You have done the apps. You can order a coffee. You still cannot
              say why it is <em>je suis allé</em> but <em>j&apos;ai mangé</em> —
              and nobody has ever told you.
            </p>
            <p className="lead lead-tight">
              Years of one teacher&apos;s private notes — used until now only
              with premium students, a section at a time. This is the whole
              thing.
            </p>
            <div className="cta-row">
              <WorkbookCta />
              <a href="#try" className="btn btn-ghost btn-lg">Try it first</a>
            </div>
            <p className="micro">
              One payment · Lifetime access · 14-day money-back guarantee
            </p>
          </div>

          {/* The signature element: a working exercise, not a mockup. */}
          <div className="hero-card">
            <span className="tab">From the book · §3.6</span>
            <WorkbookTry
              sentenceBefore="Il a trois chiens ? — Oui, il "
              sentenceAfter=" a trois."
              answers={["en"]}
              reason="en replaces de + noun, and every quantity. He has three of them → il en a trois."
            />
            <p className="micro micro-card">
              The workbook marks every exercise like this, the moment you answer.
            </p>
          </div>
        </div>
      </section>

      {/* ── Try it ───────────────────────────────────────────── */}
      <section id="try" className="sec sec-tint sec-pad">
        <div className="wrap">
          <p className="eyebrow">Try three real exercises</p>
          <h2 className="h2">Don&apos;t take our word for it. Answer these.</h2>
          <p className="lead max-2">
            Lifted straight from the book. Type an answer and press Enter — the
            online version marks every exercise like this, instantly, with the
            reason behind it.
          </p>
          <div className="grid-3">
            {SAMPLE.map((q) => (
              <div key={q.ref} className="ex-card">
                <div className="ex-ref">{q.ref}</div>
                <WorkbookTry
                  sentenceBefore={q.before}
                  sentenceAfter={q.after}
                  hint={q.hint}
                  answers={q.answers}
                  reason={q.reason}
                  compact
                />
              </div>
            ))}
          </div>
          <p className="after-note">
            Missed one? Good — that is the book&apos;s job. The goal was never to
            be right first time. It is to understand <em>why</em>, so that it is
            right every time after.
          </p>
        </div>
      </section>

      {/* ── Problem ──────────────────────────────────────────── */}
      <section className="sec sec-pad">
        <div className="wrap max-3">
          <h2 className="h2">You know the words. The sentence still won&apos;t come.</h2>
          <ul className="pains">
            {PAINS.map((p) => <li key={p} className="pain">{p}</li>)}
          </ul>
          <p className="lead">
            None of that is a memory problem. It is a structure problem — and
            structure is exactly what a workbook fixes.
          </p>
        </div>
      </section>

      {/* ── Method ───────────────────────────────────────────── */}
      <section className="sec sec-navy sec-pad">
        <div className="wrap">
          <p className="eyebrow eyebrow-light">The method</p>
          <h2 className="h2 h2-light">Every rule in the book runs the same loop.</h2>
          <div className="grid-4">
            {METHOD.map(([n, t, d]) => (
              <div key={n} className="step">
                <span className="step-n">{n}</span>
                <h3 className="step-t">{t}</h3>
                <p className="step-d">{d}</p>
              </div>
            ))}
          </div>
          <p className="method-line">Understand it. See it. Use it. Fix it.</p>
        </div>
      </section>

      {/* ── Curriculum ───────────────────────────────────────── */}
      <section className="sec sec-pad">
        <div className="wrap">
          <p className="eyebrow">What&apos;s inside · six parts, 45 exercises</p>
          <h2 className="h2">One path, from your first phrase to the subjunctive.</h2>
          <ol className="curriculum">
            {PARTS.map(([n, t, d]) => (
              <li key={n} className="part">
                <span className="part-n">Partie {n}</span>
                <div>
                  <h3 className="part-t">{t}</h3>
                  <p className="muted">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Deliverables ─────────────────────────────────────── */}
      <section className="sec sec-tint sec-pad">
        <div className="wrap">
          <h2 className="h2">Not 95 pages of theory. 95 pages you will open again.</h2>
          <div className="grid-2 deliverables">
            {DELIVERABLES.map(([t, d]) => (
              <div key={t} className="deliverable">
                <h3 className="deliverable-t">{t}</h3>
                <p className="muted">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Showcase — renders only with real images ─────────── */}
      {SHOTS.length > 0 && (
        <section className="sec sec-pad">
          <div className="wrap">
            <h2 className="h2">See exactly what you are getting.</h2>
            <div className="grid-3">
              {SHOTS.map((s) => (
                <figure key={s.src} className="shot">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.src} alt={s.alt} loading="lazy" />
                  <figcaption className="micro">{s.caption}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Author ───────────────────────────────────────────── */}
      <section className="sec sec-pad">
        <div className="wrap max-3 author">
          <div className="author-mark" aria-hidden>NPB</div>
          <div>
            <p className="eyebrow">The teacher behind it</p>
            <h2 className="h2 h2-sm">Why these 45 rules, and not 200?</h2>
            <p className="muted author-p">
              <strong>Njinu Precious Bambot</strong> has taught French to
              thousands of learners at every level, and prepared them for the
              TCF, the TEF and school examinations. Across those years he kept a
              record of the rules students actually got stuck on — the ones that
              decide whether a sentence comes out or not.
            </p>
            <p className="muted author-p">
              <em>Le Français Pas à Pas</em> is that record, refined and
              rewritten lesson after lesson. Until now it was private: only
              pieces of it were ever handed to premium students, one section at
              a time. This is the first time the whole thing has been published.
            </p>
          </div>
        </div>
      </section>

      {/* ── Proof — renders only when real ───────────────────── */}
      {HAS_REVIEWS && (
        <section className="sec sec-tint sec-pad">
          <div className="wrap">
            <h2 className="h2">
              From &ldquo;I think that&apos;s right&rdquo; to &ldquo;I know why that&apos;s right.&rdquo;
            </h2>
            <div className="grid-2">
              {REVIEWS.map((r) => (
                <figure key={r.name + r.quote.slice(0, 24)} className="quote">
                  <blockquote>&ldquo;{r.quote}&rdquo;</blockquote>
                  <figcaption className="micro">
                    {r.name}
                    {r.context && ` · ${r.context}`}
                    {r.section && ` · on ${r.section}`}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Offer ────────────────────────────────────────────── */}
      <section id="buy" className="sec sec-navy sec-pad">
        <div className="wrap max-3 center">
          <h2 className="h2 h2-light">
            One tutor lesson is $18. This is the whole grammar of French, for $27.
          </h2>
          <ul className="stack">
            {STACK.map((s) => <li key={s}>{s}</li>)}
          </ul>
          <div className="price-block">
            <span className="price">$27</span>
            <span className="price-note">one payment</span>
          </div>
          {LAUNCH && (
            <p className="micro-light">
              Launch price until {LAUNCH.label}, then {LAUNCH.then}.
            </p>
          )}
          <div className="cta-center">
            <WorkbookCta className="btn btn-accent btn-lg" />
          </div>
          <p className="micro-light">
            Instant access · Secure checkout · 14-day money-back guarantee
          </p>
        </div>
      </section>

      {/* ── Audio pack ───────────────────────────────────────── */}
      <section className="sec sec-pad-sm">
        <div className="wrap max-3">
          <div className="audio">
            <div>
              <h3 className="h3">
                You can read that the words link. You cannot hear it on the page.
              </h3>
              <p className="muted">
                Add the audio pack for the liaison, the nasal vowels and the
                French <em>u</em> — every dialogue and drill read at natural
                speed, then again slowly. Optional, added at checkout, not
                needed to use the book.
              </p>
            </div>
            <div className="audio-price">
              <span className="audio-amount">+$17</span>
              <span className="micro">audio pack</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Guarantee ────────────────────────────────────────── */}
      <section className="sec sec-pad-sm">
        <div className="wrap max-2">
          <div className="guarantee">
            <h3 className="h3">Try it for 14 days.</h3>
            <p className="muted">
              Use it, study it, do the exercises. If it is not for you, reply to
              your receipt within 14 days and we refund you — no form, no
              questions, and you keep the PDF.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="sec sec-tint sec-pad">
        <div className="wrap max-3">
          <h2 className="h2">Before you buy</h2>
          <div className="faq">
            {FAQ.map(([q, a]) => (
              <details key={q} className="faq-item">
                <summary className="faq-q">
                  <span>{q}</span>
                  <span className="faq-sign" aria-hidden>+</span>
                </summary>
                <p className="faq-a muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Close ────────────────────────────────────────────── */}
      <section className="sec sec-navy sec-pad">
        <div className="wrap max-2 center">
          <h2 className="h2 h2-light">Stop collecting French lessons. Start building French.</h2>
          <p className="close-p">
            45 rules, one path from A0 to B2, every answer given — and a book you
            can come back to whenever the grammar gets tangled again.
          </p>
          <div className="cta-center">
            <WorkbookCta className="btn btn-accent btn-lg" />
          </div>
          <p className="micro-light">
            One payment · Lifetime access · 14-day money-back guarantee
          </p>
          <p className="micro-light">
            Already bought it?{" "}
            <a href={appUrl("/workbook")} className="link-light">Open your workbook</a>
          </p>
        </div>
      </section>

      <div className="sticky-spacer" aria-hidden />
    </div>
  );
}

