import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Check, Quote } from "lucide-react";
import { Section, SectionHeading, CtaButton } from "@/components/site/ui";
import { TutorCard } from "@/components/site/tutor-card";
import { SpeakingHero } from "@/components/site/home/speaking-hero";
import { getFaqs, getPublicTutors, getTestimonials } from "@/lib/site/queries";
import { getLiveLessonPrices, usd } from "@/lib/site/live-lesson-prices";
import { getFeaturesConfig } from "@/lib/config/settings";
import { withoutTutorCopy } from "@/lib/ai/tutor-copy";
import { appUrl } from "@/lib/site/hosts";
import { cn } from "@/lib/utils";

// Tutors, testimonials, FAQs and lesson prices change from the admin, so the
// page re-renders hourly instead of needing a deploy.
export const revalidate = 3600;

export const metadata: Metadata = {
  // Same promise as the ads ("the freeze"), so a click lands on the words that
  // earned it. Length-checked for Google: title 53 chars, description 147.
  title: { absolute: "Stop Freezing in French. Start Speaking. | FrancoLink" },
  description:
    "You know the words, then freeze the moment someone talks. FrancoLink gets you speaking: daily lessons, live tutors and a free 90-second level test.",
  alternates: { canonical: "/" },
};

// Self-study plans. These mirror PLANS on /pricing (src/app/site/pricing/page.tsx):
// when those prices change, change these too.
const SELF_STUDY = [
  {
    name: "Free",
    label: "Always",
    price: "$0",
    unit: "",
    note: "Free forever",
    ai: null,
    features: ["1 lesson a day", "Unit 1 free forever", "Placement test", "Basic progress tracking"],
    cta: "Create a free account",
    highlighted: false,
  },
  {
    name: "Premium",
    label: "As low as",
    price: "$5",
    unit: "/month",
    note: "Billed yearly ($60), or $7.99 month to month",
    ai: "15 min a day of AI tutoring (3 h a month)",
    features: ["Unlimited lessons, A1 to C2", "Advanced progress tracking", "Offline mode", "Priority support"],
    cta: "Go Premium",
    highlighted: true,
  },
  {
    name: "Premium+",
    label: "As low as",
    price: "$10",
    unit: "/month",
    note: "Billed yearly ($120), or $14.99 month to month",
    ai: "45 min a day of AI tutoring (10 h a month)",
    features: ["Everything in Premium", "Advanced pronunciation analysis", "Priority tutor matching", "Extra hours: 1 h $2.99, 5 h $9.99"],
    cta: "Go Premium+",
    highlighted: false,
  },
];

const STEPS = [
  {
    title: "Speak with Léon",
    body: "A short role-play at your level: ordering, introducing yourself, a job interview. You answer out loud.",
    demo: [
      ["Léon", "Tu viens d'où ?"],
      ["You", "Je viens de Toronto."],
    ],
  },
  {
    title: "Get feedback",
    body: "Léon catches the mistake, explains it in one line, and gives you the correct version.",
    demo: [
      ["x", "Je suis 30 ans"],
      ["ok", "J'ai 30 ans. Age uses avoir."],
    ],
  },
  {
    title: "Say it again",
    body: "You repeat the corrected sentence, then use it in a new one. That second try is where it sticks.",
    demo: [
      ["You", "J'ai 30 ans et j'ai deux frères."],
      ["ok", "Parfait."],
    ],
  },
  {
    title: "Use it with a tutor",
    body: "Take what you practised into a live lesson with a tutor who picks up where you are.",
    demo: [
      ["Recap", "12 new words, 2 patterns"],
      ["Next", "Talking about your family"],
    ],
  },
];

const LANGUAGES = [
  {
    code: "fr",
    flag: "🇫🇷",
    name: "French",
    body: "From your first « Bonjour » to holding your own in a debate. A1 to C2, with TCF and TEF practice.",
    say: "Je voudrais réserver une table pour deux.",
    mean: "I'd like to book a table for two.",
    colour: "#2F6FD6",
    dark: "#1C3F8A",
  },
  {
    code: "en",
    flag: "🇬🇧",
    name: "English",
    body: "For meetings, interviews and everyday life. Speak English with confidence, not just correctly.",
    say: "Could we push the meeting to Thursday?",
    mean: "On peut décaler la réunion à jeudi ?",
    colour: "#D7263D",
    dark: "#8E1424",
  },
  {
    code: "es",
    flag: "🇪🇸",
    name: "Spanish",
    body: "Travel, friends and family. Real exchanges from your first lesson, with feedback on every answer.",
    say: "¿Me puede recomendar algo típico?",
    mean: "Can you recommend something local?",
    colour: "#E0A800",
    dark: "#8A6400",
  },
];

const GOALS = [
  {
    icon: "🎓",
    title: "Exams",
    body: "Speaking practice for TCF, TEF and DELF, with tutors who prepare students for them.",
    example: "« Décrivez votre ville. »",
    caption: "Speaking task, B1",
    href: "/tutors?goal=exam",
    link: "Exam tutors",
  },
  {
    icon: "💼",
    title: "Work",
    body: "Introductions, meetings, calls and interviews. Practise the conversations your job actually needs.",
    example: "\"Tell me about your last project.\"",
    caption: "Interview practice",
    href: "/business",
    link: "For your team",
  },
  {
    icon: "✈️",
    title: "Travel",
    body: "Order, ask for directions, check in, make small talk. Say the phrases out loud before you go.",
    example: "« Pardon, la gare, c'est par où ? »",
    caption: "Asking for directions",
    href: "/tutors?goal=speak",
    link: "Conversation tutors",
  },
  {
    icon: "🧒",
    title: "Kids and teens",
    body: "Patient tutors for younger learners, from first words to school homework.",
    example: "« Quelle est ta couleur préférée ? »",
    caption: "First conversations",
    href: "/tutors?goal=school",
    link: "Tutors for kids",
  },
];

const LEVELS = [
  ["A1", "Introduce yourself", ", order food, ask simple questions"],
  ["A2", "Talk about your week", ", make plans, handle shops and transport"],
  ["B1", "Tell a story", ", give opinions with reasons, deal with problems"],
  ["B2", "Argue a point", ", follow fast speech, work in the language"],
  ["C1", "Speak fluently", " on complex topics, adjust your tone"],
  ["C2", "Express nuance", " almost like a native speaker"],
];

const TUTOR_PERKS = [
  {
    icon: "🎯",
    title: "Find your fit in four taps",
    body: "Filter by language, level, goal and the times you are free. Exams, work, kids or just conversation.",
  },
  {
    icon: "📅",
    title: "Book a time that suits you",
    body: "Every profile shows the tutor's real weekly availability, so you can pick a slot that fits your week.",
  },
  {
    icon: "🧑‍🏫",
    title: "Lessons that keep going after",
    body: "A live room with a whiteboard, exercises and chat. Everything is saved so you can review it later.",
  },
];

const TIER_LABEL: Record<string, string> = {
  community: "Community",
  professional: "Professional",
};

export default async function SiteHomePage() {
  const [tutors, testimonials, faqs, prices, { aiTutorEnabled }] = await Promise.all([
    getPublicTutors(),
    getTestimonials(3),
    getFaqs(),
    getLiveLessonPrices(),
    getFeaturesConfig(),
  ]);

  const featured = tutors.slice(0, 6);
  const topFaqs = withoutTutorCopy(faqs, aiTutorEnabled, (f) => `${f.question} ${f.answer}`).slice(0, 5);
  const selfStudy = SELF_STUDY.map((p) => ({ ...p, ai: aiTutorEnabled ? p.ai : null }));
  const signup = appUrl("/signup");
  const termNote = (discounts: Record<number, number>) =>
    Object.entries(discounts)
      .filter(([, bps]) => bps > 0)
      .map(([months, bps]) => `${months} months ${bps / 100}% off`)
      .join(", ");

  return (
    <>
      <SpeakingHero signupHref={signup} aiTutorEnabled={aiTutorEnabled} />

      {/* -------------------------------------------------------- HOW IT WORKS */}
      {aiTutorEnabled && (
        <Section id="how">
          <SectionHeading
            eyebrow="How speaking practice works"
            title="Say it, fix it, say it again"
            subtitle="Speaking is a skill you build by doing it. Every session follows the same loop, and every loop ends with you saying something you could not say before."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <div key={step.title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-soft">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-heading font-extrabold text-white">
                  {i + 1}
                </div>
                <h3 className="mb-2 font-heading text-lg font-bold text-primary">{step.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{step.body}</p>
                <div className="mt-5 space-y-1.5 rounded-xl border border-gray-100 bg-gray-50 p-3 text-[13.5px]">
                  {step.demo.map(([who, line]) => (
                    <div key={line} className="flex items-center gap-2">
                      {who === "x" ? (
                        <span className="text-red-700 line-through">{line}</span>
                      ) : who === "ok" ? (
                        <span className="text-emerald-700">✓ {line}</span>
                      ) : (
                        <>
                          <span
                            className={cn(
                              "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white",
                              who === "Léon" ? "bg-[#2F6FD6]" : who === "You" ? "bg-primary" : "bg-gray-400"
                            )}
                          >
                            {who}
                          </span>
                          <span className="text-gray-800">{line}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ----------------------------------------------------------- LANGUAGES */}
      <Section tone="tint" id="languages">
        <SectionHeading
          eyebrow="Pick your language"
          title="Conversation practice in three languages"
          subtitle="Every language uses the same speaking-first method: practise out loud, get feedback, then use it with a tutor."
        />
        <div className="grid gap-5 md:grid-cols-3">
          {LANGUAGES.map((l) => (
            <Link
              key={l.code}
              href={`/tutors?lang=${l.code}`}
              className="group flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-medium"
            >
              <span className="text-4xl leading-none">{l.flag}</span>
              <h3 className="font-heading text-xl font-bold text-primary">{l.name} conversation practice</h3>
              <p className="text-sm leading-relaxed text-gray-600">{l.body}</p>
              <div
                className="rounded-r-xl border-l-[3px] px-3 py-2.5 text-sm"
                style={{ borderColor: l.colour, background: `${l.colour}12` }}
              >
                <b className="block font-semibold text-gray-900">{l.say}</b>
                <span className="text-gray-500">{l.mean}</span>
              </div>
              <span className="mt-auto inline-flex items-center gap-1.5 font-bold" style={{ color: l.dark }}>
                {l.name} tutors
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </Section>

      {/* --------------------------------------------------------------- GOALS */}
      <Section id="goals">
        <SectionHeading
          eyebrow="Practise for something specific"
          title="Speaking practice built around your goal"
          subtitle="Tell us what you are preparing for. Your tutor's lessons and your practice follow it."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {GOALS.map((g) => (
            <Link
              key={g.title}
              href={g.href}
              className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-medium"
            >
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-2xl">{g.icon}</span>
              <h3 className="mb-2 font-heading text-lg font-bold text-primary">{g.title}</h3>
              <p className="text-sm leading-relaxed text-gray-600">{g.body}</p>
              <div className="mt-4 rounded-xl bg-gray-50 px-3 py-2.5 text-[13.5px] text-gray-900">
                {g.example}
                <span className="mt-0.5 block text-xs text-gray-500">{g.caption}</span>
              </div>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary-500">
                {g.link}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------------ SYLLABUS */}
      <Section tone="tint">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <span className="mb-3 inline-block text-xs font-bold uppercase tracking-[0.15em] text-secondary">
              A real syllabus behind the talking
            </span>
            <h2 className="font-heading text-3xl font-extrabold leading-[1.15] tracking-tight text-primary sm:text-4xl">
              You always know what you can say, and what comes next
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-600">
              Conversation practice works best on a structure. Every lesson sits on a CEFR level, so practice adds up instead of going in circles.
            </p>
            <ul className="my-7 space-y-3">
              {[
                "Free 90-second placement test puts you at the right level",
                "Lessons, games and homework from A1 to C2",
                "Progress tracking shows what you have covered and what is next",
              ].map((line) => (
                <li key={line} className="flex items-start gap-3 text-gray-800">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                    <Check className="h-3 w-3 text-emerald-700" strokeWidth={3} />
                  </span>
                  {line}
                </li>
              ))}
            </ul>
            <CtaButton href={signup} variant="ghost" external>
              Find your level
            </CtaButton>
          </div>
          <div className="space-y-2.5">
            {LEVELS.map(([lvl, strong, rest], i) => (
              <div
                key={lvl}
                className="grid grid-cols-[56px_1fr] items-center gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-3.5"
                style={{ marginRight: `${Math.max(0, 5 - i) * 8}%` }}
              >
                <span className="font-heading text-xl font-black text-primary">{lvl}</span>
                <span className="text-[15px] text-gray-600">
                  <b className="font-semibold text-gray-900">{strong}</b>
                  {rest}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* -------------------------------------------------------------- TUTORS */}
      <Section id="tutors">
        <SectionHeading
          eyebrow="Live tutors"
          title="Talk with a real tutor who fits your goal"
          subtitle={`${aiTutorEnabled ? "Léon gets you practising. " : ""}A tutor takes you further: real conversation, your mistakes explained, and a plan built around you. Every tutor passes a live teaching demo before they can take a booking.`}
        />
        <div className="mb-12 grid gap-4 md:grid-cols-3">
          {TUTOR_PERKS.map((perk) => (
            <div key={perk.title} className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-soft">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-xl">
                {perk.icon}
              </span>
              <div>
                <h3 className="mb-1 font-heading font-bold text-primary">{perk.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{perk.body}</p>
              </div>
            </div>
          ))}
        </div>

        {featured.length > 0 && (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((tutor) => (
                <TutorCard key={tutor.slug} tutor={tutor} />
              ))}
            </div>
            <div className="mt-12 text-center">
              <CtaButton href="/tutors">
                {tutors.length > featured.length ? `See all ${tutors.length} tutors` : "Browse tutors"}
                <ArrowRight className="h-5 w-5" />
              </CtaButton>
            </div>
          </>
        )}
      </Section>

      {/* ------------------------------------------------------------- PRICING */}
      <Section tone="tint" id="pricing">
        <SectionHeading
          eyebrow="Pricing"
          title="Practise on your own, with a tutor, or both"
          subtitle="Self-study plans give you the app and speaking practice with Léon. Lesson plans give you live lessons with a tutor, and include the self-study app."
        />
        <div className="-mt-4 mb-10 flex flex-wrap justify-center gap-2.5">
          <a href="#self-study" className="rounded-full border border-gray-200 bg-white px-4 py-2.5 text-[15px] font-semibold text-primary hover:border-primary">
            Self-study{aiTutorEnabled ? " + Léon" : ""} <b className="font-extrabold text-secondary">$0</b>
          </a>
          {prices.lowestCents !== null && (
            <a href="#live" className="rounded-full border border-gray-200 bg-white px-4 py-2.5 text-[15px] font-semibold text-primary hover:border-primary">
              Live lessons <b className="font-extrabold text-secondary">as low as {usd(prices.lowestCents)} a lesson</b>
            </a>
          )}
        </div>

        <div id="self-study" className="scroll-mt-24">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-gray-200 pb-3.5">
            <h3 className="font-heading text-2xl font-bold text-primary">
              {aiTutorEnabled ? "Self-study and AI speaking practice" : "Self-study"}
            </h3>
            <p className="text-[15px] text-gray-600">
              {aiTutorEnabled ? "Lessons, games and Léon. AI tutoring is measured in time." : "Lessons, games and homework, A1 to C2."}
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {selfStudy.map((p) => (
              <PriceCard
                key={p.name}
                name={p.name}
                label={p.label}
                price={p.price}
                unit={p.unit}
                note={p.note}
                highlight={p.ai ?? (p.name === "Free" && aiTutorEnabled ? "No AI tutoring on the free plan" : null)}
                quiet={p.name === "Free"}
                features={p.features}
                cta={p.cta}
                href={appUrl("/pricing")}
                featured={p.highlighted}
              />
            ))}
          </div>
        </div>

        {prices.lowestCents !== null && (
          <div id="live" className="mt-14 scroll-mt-24">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-gray-200 pb-3.5">
              <h3 className="font-heading text-2xl font-bold text-primary">
                Live lessons with a tutor{" "}
                <span className="font-extrabold text-secondary">as low as {usd(prices.lowestCents)} a lesson</span>
              </h3>
              <p className="text-[15px] text-gray-600">50-minute lessons. Your plan decides which tutors you can book.</p>
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
              {prices.packs.length > 0 && (
                <PriceCard
                  name="Starter pack"
                  tag="One-off"
                  label="As low as"
                  price={usd(prices.packs[0].perLessonCents)}
                  unit="/lesson"
                  note={`${usd(prices.packs[0].priceCents)} for ${prices.packs[0].lessons} lessons with a ${TIER_LABEL[prices.packs[0].tier] ?? prices.packs[0].tier} tutor`}
                  highlight={prices.packs
                    .slice(1)
                    .map((p) => `Or ${usd(p.priceCents)} for ${p.lessons} lessons with a ${TIER_LABEL[p.tier] ?? p.tier} tutor`)
                    .join(". ") || null}
                  tone="warm"
                  features={["Try live lessons before choosing a plan", "No subscription", "One starter pack per student", "Lessons valid for 30 days"]}
                  cta="Get the starter pack"
                  href="/tutors"
                />
              )}
              {prices.plans.map((plan, i) => (
                <PriceCard
                  key={plan.planKey}
                  name={`${plan.name} plan`}
                  label="As low as"
                  price={usd(plan.lowestPerLessonCents)}
                  unit="/lesson"
                  note={
                    plan.lowestPerLessonCents < plan.monthlyPerLessonCents
                      ? `On a ${plan.lowestTermMonths === 12 ? "yearly" : `${plan.lowestTermMonths}-month`} plan. ${usd(plan.monthlyPerLessonCents)} a lesson month to month`
                      : "Month to month"
                  }
                  sub={
                    plan.allowedTiers.includes("professional")
                      ? "Book any tutor, including qualified Professional teachers"
                      : "Book Community tutors: fluent speakers for conversation practice"
                  }
                  highlight={`As low as ${usd(plan.lowestMonthlyCents)} a month (1 lesson a week${plan.lowestTermMonths === 12 ? ", yearly" : ""})`}
                  tone="warm"
                  features={[
                    `${formatList(plan.lessonsPerWeek)} lessons a week`,
                    "Includes the self-study app",
                    "Unused lessons roll over for a week",
                    termNote(plan.termDiscounts) ? `Terms: monthly, ${termNote(plan.termDiscounts)}` : "Billed monthly",
                  ]}
                  cta={`Choose ${plan.name}`}
                  href="/tutors"
                  featured={i === 0}
                />
              ))}
            </div>
            <p className="mt-5 text-center text-[13px] text-gray-400">
              Monthly price = price per lesson × lessons a week × 4.33 weeks.
            </p>
          </div>
        )}
      </Section>

      {/* -------------------------------------------------------- TESTIMONIALS */}
      {testimonials.length > 0 && (
        <Section tone="navy">
          <SectionHeading eyebrow="Student stories" title="What learners say" inverted />
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.id} className="rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur">
                <Quote className="mb-4 h-8 w-8 text-secondary" />
                <blockquote className="leading-relaxed text-primary-100">{t.quote}</blockquote>
                <figcaption className="mt-5 border-t border-white/10 pt-5">
                  <span className="font-heading font-bold text-white">{t.author_name}</span>
                  {t.author_role && <span className="mt-0.5 block text-sm text-primary-200">{t.author_role}</span>}
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
          <SectionHeading eyebrow="Questions" title="Before you start" />
          <div className="mx-auto max-w-3xl divide-y divide-gray-100 border-y border-gray-100">
            {topFaqs.map((faq) => (
              <details key={faq.id} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-heading font-bold text-primary">
                  {faq.question}
                  <ArrowRight className="h-5 w-5 shrink-0 text-secondary transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-gray-600">{faq.answer}</p>
              </details>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/faq" className="inline-flex items-center gap-2 font-bold text-primary transition-all hover:gap-3">
              All questions
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Section>
      )}

      {/* ------------------------------------------------------------ CTA BAND */}
      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[28px] bg-primary px-6 py-14 text-center sm:py-16">
          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-white sm:text-[2.75rem]">
            Your first real conversation starts with one sentence
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-primary-100">Say it today, with feedback, at your level.</p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <CtaButton href={signup} variant="secondary" external>
              Start speaking
              <ArrowRight className="h-5 w-5" />
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

/** "1, 2, 3 or 5" */
function formatList(items: number[]): string {
  if (items.length <= 1) return String(items[0] ?? "");
  return `${items.slice(0, -1).join(", ")} or ${items.at(-1)}`;
}

function PriceCard({
  name,
  tag,
  label,
  price,
  unit,
  note,
  sub,
  highlight,
  quiet,
  tone = "cool",
  features,
  cta,
  href,
  featured,
}: {
  name: string;
  tag?: string;
  label: string;
  price: string;
  unit: string;
  note: string;
  sub?: string;
  highlight: string | null;
  quiet?: boolean;
  tone?: "cool" | "warm";
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
}) {
  const external = href.startsWith("http");
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl bg-white p-6",
        featured ? "border-2 border-primary shadow-xl shadow-primary/10" : "border border-gray-100"
      )}
    >
      <h4 className="font-heading text-lg font-bold text-primary">
        {name}
        {tag && (
          <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 align-middle text-[11px] font-bold uppercase tracking-wide text-emerald-700">
            {tag}
          </span>
        )}
      </h4>
      <span className="mt-3 text-xs font-bold uppercase tracking-wider text-gray-400">{label}</span>
      <div className="mt-0.5 font-heading text-4xl font-black text-primary">
        {price}
        {unit && <small className="ml-1 text-base font-bold text-gray-500">{unit}</small>}
      </div>
      <div className="mt-1 text-[13px] text-gray-400">{note}</div>
      {sub && <div className="mt-2 text-[13px] text-gray-600">{sub}</div>}
      {highlight && (
        <div
          className={cn(
            "mt-4 rounded-xl px-3 py-2.5 text-sm font-semibold",
            quiet ? "bg-gray-50 font-medium text-gray-500" : tone === "warm" ? "bg-secondary-50 text-secondary-700" : "bg-primary-50 text-primary"
          )}
        >
          {highlight}
        </div>
      )}
      <ul className="mb-6 mt-4 space-y-2.5 text-[15px] text-gray-800">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={3} />
            {f}
          </li>
        ))}
      </ul>
      <CtaButton href={href} external={external} variant={featured ? "primary" : "ghost"} className="mt-auto w-full">
        {cta}
      </CtaButton>
    </div>
  );
}
