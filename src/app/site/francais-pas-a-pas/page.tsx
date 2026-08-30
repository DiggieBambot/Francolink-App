// The sales page. francolink.net/francais-pas-a-pas
//
// Long-form on purpose: a $27 grammar book from a brand nobody knows is sold
// by evidence, not by adjectives. The evidence here is the book itself —
// PRD §8.1 asks for a live demo of the real exercises on this page, and that
// is the section everything else is arranged around. A prospect who gets one
// right has already used the product.
//
// The demo runs the same <Exercise> component and the same marking engine the
// paid reader uses. There is no separate "demo mode" to drift out of sync.

import type { Metadata } from "next";
import Link from "next/link";
import { Section, SectionHeading } from "@/components/site/ui";
import { WorkbookBuy } from "@/components/site/workbook-buy";
import { Exercise } from "@/components/workbook/exercise";
import { SITE_URL } from "@/lib/site/hosts";
import { Check, Headphones, BookOpen, PenLine, Users } from "lucide-react";

const TITLE = "Le Français Pas à Pas — the French grammar workbook";
const DESCRIPTION =
  "The 45 French grammar rules that actually matter — explained, drilled, and answered. A0 to B2, with a full answer key, audio, and an online version that marks itself.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/francais-pas-a-pas" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/francais-pas-a-pas",
    type: "website",
  },
};

// Real items from the book — §4.7, §3.7 and §3.6 respectively. Chosen because
// each one is a rule an intermediate learner knows they don't know, which is
// exactly the discomfort the book sells against.
const DEMO = [
  {
    prompt: "Les fleurs ? Je les ai ___ hier.",
    cue: "(acheter)",
    blank: { answers: ["achetées"] },
  },
  {
    prompt: "C'est le problème ___ nous avons parlé.",
    blank: { answers: ["dont"] },
  },
  {
    prompt: "Il a trois chiens ? — Oui, il ___ a trois.",
    blank: { answers: ["en"] },
  },
];

const INSIDE = [
  ["Partie 0", "Survival French — 20 phrases and three dialogues you can use today"],
  ["Partie 1", "Sounds and foundations — liaison, nasal vowels, être and avoir"],
  ["Partie 2", "Everyday actions — the three verb groups, the near future, adjectives"],
  ["Partie 3", "Pronouns and nuance — le/la/lui/leur, y and en, qui/que/où/dont"],
  ["Partie 4", "The past — imparfait, passé composé, and how to choose"],
  ["Partie 5", "Future, hypothesis, subjunctive — and how to argue in French"],
];

export default function WorkbookSalesPage() {
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Le Français Pas à Pas",
    description: DESCRIPTION,
    brand: { "@type": "Brand", name: "FrancoLink" },
    url: `${SITE_URL}/francais-pas-a-pas`,
    offers: {
      "@type": "Offer",
      price: "27.00",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/francais-pas-a-pas`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      {/* Promise */}
      <Section className="pt-16 pb-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-bold uppercase tracking-widest text-primary">
            A0 → B2 · 95 pages · full answer key
          </p>
          <h1 className="text-balance text-4xl font-black leading-[1.08] tracking-tight text-primary-900 sm:text-5xl">
            The 45 French grammar rules that actually matter — explained,
            drilled, and answered.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            You have done the apps. You can order a coffee. You still cannot say
            why it is <em>je suis allé</em> but <em>j&apos;ai mangé</em> — and
            nobody has ever told you.
          </p>
          <div className="mt-8">
            <WorkbookBuy />
          </div>
        </div>
      </Section>

      {/* The demo — the argument of the whole page */}
      <Section className="py-12" tone="tint">
        <div className="mx-auto max-w-2xl">
          <SectionHeading
            eyebrow="Try it now"
            title="Three real exercises from the book"
            subtitle="Type an answer and press Enter. This is the actual workbook — the online version marks every exercise like this, instantly."
          />
          <Exercise title="From §4.7, §3.7 and §3.6" items={DEMO} />
          <p className="mt-4 text-center text-sm text-gray-500">
            Missed one? Good — that is the book&apos;s job. Every rule comes
            with the reason behind it, not just the form.
          </p>
        </div>
      </Section>

      {/* Who it's for */}
      <Section className="py-14">
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            eyebrow="Who this is for"
            title="Learners who are tired of guessing"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Card
              icon={<PenLine className="h-5 w-5" />}
              title="You have plateaued"
              body="An app taught you words. It never explained when the subjunctive is compulsory, or why the participle sometimes agrees."
            />
            <Card
              icon={<BookOpen className="h-5 w-5" />}
              title="You want the reason"
              body="Every rule here comes with the logic behind it, the mistakes learners actually make, and a dialogue showing it in use."
            />
            <Card
              icon={<Headphones className="h-5 w-5" />}
              title="You cannot hear the difference"
              body="Liaison, nasal vowels and the French u are taught in writing and in audio — because reading them is not enough."
            />
            <Card
              icon={<Users className="h-5 w-5" />}
              title="You will eventually want a person"
              body="The book takes you a long way on your own. When you want someone to hear you speak, FrancoLink tutors are one click away."
            />
          </div>
        </div>
      </Section>

      {/* What's inside */}
      <Section className="py-14" tone="tint">
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            eyebrow="What's inside"
            title="Six parts, 45 exercises, every answer given"
          />
          <ul className="divide-y divide-primary-100 overflow-hidden rounded-2xl border border-primary-100 bg-white">
            {INSIDE.map(([part, what]) => (
              <li key={part} className="flex gap-4 p-4">
                <span className="w-20 shrink-0 font-mono text-sm font-bold text-primary">
                  {part}
                </span>
                <span className="text-[15px] text-gray-700">{what}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "Step-by-step build for every structure",
              "Conjugation tables you can actually scan",
              "Common-error boxes — the mistake, then the fix",
              "Dialogues with the grammar marked inside them",
              "Graded exercises with a complete answer key",
              "PDF to keep, plus the interactive online version",
            ].map((f) => (
              <p key={f} className="flex items-start gap-2 text-[15px] text-gray-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {f}
              </p>
            ))}
          </div>
        </div>
      </Section>

      {/* Price */}
      <Section className="py-14">
        <div className="mx-auto max-w-xl rounded-3xl border-2 border-primary-100 bg-white p-8 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">
            One payment
          </p>
          <p className="mt-2 text-5xl font-black tracking-tight text-primary-900">
            $27
          </p>
          <p className="mt-2 text-gray-600">
            The complete workbook — PDF and the interactive online version.
            Yours to keep.
          </p>
          <div className="mt-7">
            <WorkbookBuy />
          </div>
          <p className="mt-5 text-sm text-gray-500">
            You can add the <strong>audio pack</strong> at checkout for $17 —
            every dialogue and pronunciation drill, read at natural speed and
            again slowly.
          </p>
        </div>
      </Section>

      {/* FAQ */}
      <Section className="py-14" tone="tint">
        <div className="mx-auto max-w-2xl">
          <SectionHeading eyebrow="Questions" title="Before you buy" />
          <div className="space-y-4">
            <Faq q="Is this really A0 to B2?">
              Yes. It starts at your first phrase and ends with the subjunctive,
              reported speech and the connectors used to argue a point in
              French. Six parts, 45 exercises, every answer given.
            </Faq>
            <Faq q="What if I already know the basics?">
              Skip to Partie 3. Object pronouns, <em>y</em> and <em>en</em>, and
              the relative pronouns are where most self-taught learners have a
              hole, and they are the sections that make speech sound French.
            </Faq>
            <Faq q="Do I need an account?">
              Not to buy. Pay first; you set a password afterwards, and that
              unlocks both the PDF and the online version.
            </Faq>
            <Faq q="Is the online version an app I have to download?">
              No. It opens in your browser, on a phone or a laptop, and your
              progress is saved as you go.
            </Faq>
            <Faq q="What if it isn't for me?">
              14-day money-back guarantee. Reply to your receipt and we refund
              you — no form, no questions.
            </Faq>
          </div>
        </div>
      </Section>

      {/* The bridge to the actual business */}
      <Section className="py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-black tracking-tight text-primary-900">
            A book can explain the grammar. It cannot hear you speak it.
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            When you are ready for that, FrancoLink tutors run 50-minute lessons
            from $18. Start with the book — most people do.
          </p>
          <div className="mt-7 flex flex-col items-center gap-4">
            <WorkbookBuy />
            <Link
              href="/tutors"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Or browse tutors first
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}

function Card({
  icon, title, body,
}: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-primary-100 bg-white p-5">
      <div className="mb-2 text-primary">{icon}</div>
      <h3 className="font-bold text-primary-900">{title}</h3>
      <p className="mt-1 text-[15px] text-gray-600">{body}</p>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-xl border border-primary-100 bg-white p-4 open:bg-primary-50/40">
      <summary className="cursor-pointer list-none font-bold text-primary-900 marker:hidden">
        {q}
      </summary>
      <div className="mt-2 text-[15px] text-gray-600">{children}</div>
    </details>
  );
}
