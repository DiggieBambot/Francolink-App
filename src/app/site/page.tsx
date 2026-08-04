import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  GraduationCap,
  MessageCircle,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { Section, SectionHeading, CtaButton } from "@/components/site/ui";
import { TutorCard } from "@/components/site/tutor-card";
import { getFaqs, getPublicTutors, getTestimonials } from "@/lib/site/queries";
import { appUrl } from "@/lib/site/hosts";

// The directory and testimonials change when an admin approves a tutor or
// publishes a quote — hourly revalidation keeps the page static and fast
// without needing a deploy.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "FrancoLink — learn a language with certified tutors",
  description:
    "Structured CEFR lessons, certified live tutors and daily practice in one app. Browse our tutors, see their schedules, and start learning French, English, Spanish or German.",
  alternates: { canonical: "/" },
};

const STEPS = [
  {
    Icon: Users,
    title: "Choose your tutor",
    body: "Browse verified profiles with real qualifications, languages taught, CEFR levels and weekly availability. Every tutor here passed our selection process.",
  },
  {
    Icon: CalendarCheck,
    title: "Book your first lesson",
    body: "Pick a slot that fits your week. Most tutors offer a free trial lesson so you can check the fit before committing to anything.",
  },
  {
    Icon: Sparkles,
    title: "Practise every day in the app",
    body: "Between lessons, the FrancoLink app keeps you moving: guided lessons, games, homework from your tutor, and an AI partner to speak with anytime.",
  },
];

const PILLARS = [
  {
    Icon: GraduationCap,
    title: "Certified, vetted tutors",
    body: "Teaching qualification, proven experience and a live teaching demo — we check all three before a profile goes live.",
  },
  {
    Icon: BookOpen,
    title: "A real CEFR curriculum",
    body: "A1 to C2 grammar, vocabulary and pronunciation built as a proper syllabus — not a random pile of exercises.",
  },
  {
    Icon: MessageCircle,
    title: "Live rooms, not video calls",
    body: "A shared whiteboard, exercises, chat and highlights in one room your tutor controls — everything is saved for review.",
  },
  {
    Icon: ShieldCheck,
    title: "Your progress, tracked",
    body: "Streaks, placement tests, homework and coverage reports so you always know exactly where you are.",
  },
];

export default async function SiteHomePage() {
  const [tutors, testimonials, faqs] = await Promise.all([
    getPublicTutors(),
    getTestimonials(3),
    getFaqs(),
  ]);

  const featured = tutors.slice(0, 6);
  const topFaqs = faqs.slice(0, 5);

  return (
    <>
      {/* ---------------------------------------------------------------- HERO */}
      <section className="relative bg-primary-50 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[420px] h-[420px] bg-primary-100/70 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20 sm:pb-28 text-center">
          <span className="inline-flex items-center gap-2 bg-white border border-primary-100 rounded-full px-5 py-2 mb-8 shadow-sm">
            <Star className="w-4 h-4 text-secondary" />
            <span className="text-sm font-semibold text-primary">
              Certified tutors · CEFR A1–C2 · Learn on any device
            </span>
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-heading font-extrabold text-primary leading-[1.08] tracking-tight max-w-4xl mx-auto">
            Learn a language with a tutor who actually knows how to teach it
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            FrancoLink pairs you with a vetted live tutor and gives you an app to
            practise in every day. French, English, Spanish and German — from
            your first word to fluency.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <CtaButton href="/tutors">
              <Users className="w-5 h-5" />
              Browse our tutors
            </CtaButton>
            <CtaButton href={appUrl("/signup")} variant="ghost" external>
              Start free in the app
              <ArrowRight className="w-5 h-5" />
            </CtaButton>
          </div>

          <dl className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              [tutors.length > 0 ? `${tutors.length}` : "—", "Vetted tutors"],
              ["A1–C2", "CEFR coverage"],
              ["4", "Languages taught"],
              ["7 days", "A week of practice"],
            ].map(([value, label]) => (
              <div key={label} className="text-center">
                <dt className="font-heading font-extrabold text-2xl sm:text-3xl text-primary">
                  {value}
                </dt>
                <dd className="text-sm text-gray-500 mt-1">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------------------- PILLARS */}
      <Section>
        <SectionHeading
          eyebrow="What FrancoLink is"
          title="A language school that fits in your pocket"
          subtitle="Live teaching and daily self-study are two halves of the same thing. We built both, and made them talk to each other."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="p-7 rounded-2xl bg-white border border-gray-100 shadow-soft hover:shadow-medium transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-5">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-lg text-primary mb-2">
                {title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* --------------------------------------------------------- HOW IT WORKS */}
      <Section tone="tint">
        <SectionHeading
          eyebrow="How it works"
          title="Three steps to your first lesson"
        />
        <div className="grid gap-8 md:grid-cols-3">
          {STEPS.map(({ Icon, title, body }, i) => (
            <div key={title} className="relative">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-heading font-extrabold text-lg shrink-0">
                  {i + 1}
                </div>
                <Icon className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-heading font-bold text-xl text-primary mb-2">
                {title}
              </h3>
              <p className="text-gray-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <CtaButton href="/how-it-works" variant="ghost">
            See the full process
            <ArrowRight className="w-5 h-5" />
          </CtaButton>
        </div>
      </Section>

      {/* -------------------------------------------------------------- TUTORS */}
      {featured.length > 0 && (
        <Section>
          <SectionHeading
            eyebrow="Meet the team"
            title="Our tutors"
            subtitle="Every profile below is a real teacher we selected, interviewed and approved. Open one to see qualifications, specialities and weekly availability."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((tutor) => (
              <TutorCard key={tutor.slug} tutor={tutor} />
            ))}
          </div>
          {tutors.length > featured.length && (
            <div className="mt-12 text-center">
              <CtaButton href="/tutors">
                See all {tutors.length} tutors
                <ArrowRight className="w-5 h-5" />
              </CtaButton>
            </div>
          )}
        </Section>
      )}

      {/* -------------------------------------------------------- TESTIMONIALS */}
      {testimonials.length > 0 && (
        <Section tone="navy">
          <SectionHeading
            eyebrow="Student stories"
            title="What learners say"
            inverted
          />
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure
                key={t.id}
                className="p-7 rounded-2xl bg-white/5 border border-white/10 backdrop-blur"
              >
                <Quote className="w-8 h-8 text-secondary mb-4" />
                <blockquote className="text-primary-100 leading-relaxed">
                  {t.quote}
                </blockquote>
                <figcaption className="mt-5 pt-5 border-t border-white/10">
                  <span className="font-heading font-bold text-white">
                    {t.author_name}
                  </span>
                  {t.author_role && (
                    <span className="block text-sm text-primary-200 mt-0.5">
                      {t.author_role}
                    </span>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-12 text-center">
            <CtaButton href="/testimonials" variant="secondary">
              Read more stories
            </CtaButton>
          </div>
        </Section>
      )}

      {/* ----------------------------------------------------------------- FAQ */}
      {topFaqs.length > 0 && (
        <Section>
          <SectionHeading
            eyebrow="Questions"
            title="Frequently asked"
            align="left"
          />
          <div className="max-w-3xl divide-y divide-gray-100 border-y border-gray-100">
            {topFaqs.map((faq) => (
              <details key={faq.id} className="group py-5">
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-heading font-bold text-primary">
                  {faq.question}
                  <ArrowRight className="w-5 h-5 text-secondary shrink-0 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-gray-600 leading-relaxed whitespace-pre-line">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
          <div className="mt-10">
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 font-bold text-primary hover:gap-3 transition-all"
            >
              All questions
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Section>
      )}

      {/* ------------------------------------------------------------- CTA BAND */}
      <section className="bg-secondary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-primary-900 tracking-tight">
            Ready to start speaking?
          </h2>
          <p className="mt-4 text-lg text-primary-900/80 max-w-xl mx-auto">
            Take the 90-second placement test in the app, then meet a tutor who
            picks up exactly where you are.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <CtaButton href={appUrl("/signup")} external>
              Create a free account
            </CtaButton>
            <CtaButton href="/tutors" variant="ghost">
              Find a tutor first
            </CtaButton>
          </div>
        </div>
      </section>
    </>
  );
}
