import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { Section, CtaButton } from "@/components/site/ui";
import { getFaqs, type Faq } from "@/lib/site/queries";
import { siteUrl } from "@/lib/site/hosts";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to the questions we get asked most about FrancoLink: how tutors are selected, what a lesson looks like, pricing, cancellations, levels and devices.",
  alternates: { canonical: "/faq" },
};

// Fallbacks so the page is never empty before an admin has added FAQs.
const DEFAULT_FAQS: Faq[] = [
  {
    id: "d1",
    category: "Getting started",
    question: "Do I need to know my level before I start?",
    answer:
      "No. The app opens with a 90-second placement test that sets your CEFR level (A1–C2). Your tutor sees the result and starts you in the right place.",
  },
  {
    id: "d2",
    category: "Getting started",
    question: "Can I use FrancoLink without a tutor?",
    answer:
      "Yes. The lessons, games and AI conversation partner all work on their own. A tutor adds live teaching, correction and marked homework on top.",
  },
  {
    id: "d3",
    category: "Tutors",
    question: "How are tutors selected?",
    answer:
      "Every tutor must hold a recognised teaching qualification, have at least two years of teaching experience with contactable references, and pass a live 30-minute teaching demo with our team. Student feedback is reviewed continuously afterwards.",
  },
  {
    id: "d4",
    category: "Tutors",
    question: "Can I switch tutors, or work with more than one?",
    answer:
      "Both. You can join as many tutors' classes as you like — for example a conversation tutor and a grammar tutor — and leave a class at any time.",
  },
  {
    id: "d5",
    category: "Lessons",
    question: "What happens in a lesson?",
    answer:
      "You meet in a private lesson room: a shared whiteboard, live exercises, chat and highlights your tutor saves as you go. Everything stays in the room so you can review it afterwards.",
  },
  {
    id: "d6",
    category: "Pricing",
    question: "What does it cost?",
    answer:
      "The app has a free plan, plus Premium and Premium+ subscriptions. Live lessons are billed separately at the hourly rate shown on each tutor's profile. Most tutors offer a free trial lesson.",
  },
  {
    id: "d7",
    category: "Devices",
    question: "Which devices does FrancoLink work on?",
    answer:
      "Any modern phone, tablet or computer. You can install FrancoLink to your home screen and get reminders and homework notifications like a native app.",
  },
];

export default async function FaqPage() {
  const stored = await getFaqs();
  const faqs = stored.length > 0 ? stored : DEFAULT_FAQS;

  const categories = Array.from(new Set(faqs.map((f) => f.category)));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-primary-50 border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-primary tracking-tight">
            Frequently asked questions
          </h1>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto">
            Can&apos;t find your answer?{" "}
            <a
              href={siteUrl("/contact")}
              className="font-bold text-primary underline underline-offset-4"
            >
              Send us a message
            </a>{" "}
            — we reply within one working day.
          </p>
        </div>
      </div>

      <Section>
        <div className="max-w-3xl mx-auto space-y-12">
          {categories.map((category) => (
            <div key={category}>
              <h2 className="font-heading font-extrabold text-xl text-primary mb-5">
                {category}
              </h2>
              <div className="divide-y divide-gray-100 border-y border-gray-100">
                {faqs
                  .filter((f) => f.category === category)
                  .map((faq) => (
                    <details key={faq.id} className="group py-5">
                      <summary className="flex items-start justify-between gap-4 cursor-pointer list-none font-heading font-bold text-primary">
                        {faq.question}
                        <ChevronRight className="w-5 h-5 text-secondary shrink-0 mt-0.5 transition-transform group-open:rotate-90" />
                      </summary>
                      <p className="mt-3 text-gray-600 leading-relaxed whitespace-pre-line">
                        {faq.answer}
                      </p>
                    </details>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="tint">
        <div className="text-center">
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-primary mb-4">
            Still deciding?
          </h2>
          <p className="text-gray-600 mb-8">
            Look through the tutors — most offer a free trial lesson.
          </p>
          <CtaButton href="/tutors">Browse tutors</CtaButton>
        </div>
      </Section>
    </>
  );
}
