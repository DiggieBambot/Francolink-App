// francolink.net/francais-pas-a-pas/free-sample -- the lead-ad landing page.
//
// For cold traffic that will not pay $27 on a first visit: one promise (the
// first chapter, free), one field, one button. Nothing else to click except
// a quiet link to the full sales page for the people who are ready.
//
// Not indexed: it would compete with the sales page for the same searches.

import type { Metadata } from "next";
import Link from "next/link";
import "../workbook.css";
import { fraunces, instrument } from "../fonts";
import { WorkbookSampleForm } from "@/components/site/workbook-sample-form";
import { WorkbookTry } from "@/components/site/workbook-try";

const TITLE = "Free chapter: Le Français Pas à Pas";
const DESCRIPTION =
  "Partie 0 of the French grammar workbook, free and interactive: twenty survival phrases and three dialogues with audio, and an exercise that marks itself.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: false, follow: true },
  alternates: { canonical: "/francais-pas-a-pas" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/francais-pas-a-pas/free-sample", type: "website" },
};

const INSIDE = [
  "The 20 phrases you need before any grammar. Tap any one to hear it",
  "Three short dialogues, read at natural speed and then slowly",
  "An exercise that marks your answers as you type them",
  "The contents of the whole book, A0 to B2, so you can see where it goes",
];

export default function FreeSamplePage() {
  return (
    <div className={`fpap ${fraunces.variable} ${instrument.variable}`}>
      <section className="sec sec-pad-lg">
        <div className="wrap hero">
          <div>
            <p className="eyebrow">Free chapter · Le Français Pas à Pas</p>
            <h1 className="h1">Hear it, say it, check it. The first chapter is free.</h1>
            <p className="lead">
              Partie 0 of the grammar workbook that takes you from A0 to B2,
              written by a teacher who prepares learners for the TCF and TEF.
              Enter your email and it&apos;s in your inbox in a minute.
            </p>
            <WorkbookSampleForm source="sample-page" button="Send me the free chapter" />
            <p className="micro">
              Opens in your browser, with audio. No account. We&apos;ll also send you three short emails
              about the book. Unsubscribe in one click.
            </p>
          </div>

          <div className="hero-card">
            <span className="tab">What&apos;s in Partie 0</span>
            <ul className="sample-list">
              {INSIDE.map((x) => <li key={x}>{x}</li>)}
            </ul>
            <span className="tab">Try one from later in the book · §3.6</span>
            <WorkbookTry
              sentenceBefore="Il a trois chiens ? — Oui, il "
              sentenceAfter=" a trois."
              answers={["en"]}
              reason="en replaces de + noun, and every quantity. He has three of them → il en a trois."
            />
          </div>
        </div>
      </section>

      <section className="sec sec-tint sec-pad-sm">
        <div className="wrap max-2 center">
          <p className="muted">
            Ready for the whole book? <Link href="/francais-pas-a-pas">See Le Français Pas à Pas</Link>: $27,
            PDF and interactive ebook, 14-day money-back guarantee.
          </p>
        </div>
      </section>
    </div>
  );
}
