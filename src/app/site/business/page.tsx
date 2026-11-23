import type { Metadata } from "next";
import {
  Award,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  CalendarClock,
  Check,
  ChevronRight,
  GraduationCap,
  Headphones,
  Plane,
  Receipt,
  Smartphone,
  Target,
} from "lucide-react";
import { CtaButton, Section, SectionHeading } from "@/components/site/ui";
import {
  BUSINESS_BOOKING_URL,
  BUSINESS_CONTACT_HREF,
  FOUNDING_OFFER,
  PILOT,
  SCHOOL_MIN_SEATS,
  SCHOOL_SEAT_PRICE,
  TEACHER_MIN_SEATS,
  TEACHER_SEAT_PRICE,
  TEAM_MIN_SEATS,
  TEAM_SEAT_TIERS,
  usd,
} from "@/lib/site/business";

export const metadata: Metadata = {
  title: "French for teams, schools and agencies",
  description:
    "Give your staff, students or clients a structured French course they follow at their own pace — A1 to B2, TCF Canada prep, progress reports and certificates. Seats from $59 per learner per year.",
  alternates: { canonical: "/business" },
};

const AUDIENCES = [
  {
    Icon: Briefcase,
    title: "Employers",
    body: "Staff in bilingual roles, working with francophone clients, or relocating to France, Belgium or Quebec.",
  },
  {
    Icon: Plane,
    title: "Immigration & relocation agencies",
    body: "Clients who need a TCF or TEF Canada score on a deadline. Refer them, or include access in your package.",
  },
  {
    Icon: GraduationCap,
    title: "Teachers",
    body: "Ready-made lessons and auto-marked homework for your students, with a free teacher account.",
  },
  {
    Icon: Building2,
    title: "Schools & colleges",
    body: "Self-study and homework for a whole year group, with progress you can actually see.",
  },
];

const INCLUDED = [
  {
    Icon: BookOpen,
    title: "A full French course, A1 to B2",
    body: "Structured lessons with exercises, grammar, vocabulary and games — a path to follow, not a pile of content.",
  },
  {
    Icon: Headphones,
    title: "Native-speed audio everywhere",
    body: "Every dialogue, word and example sentence is spoken, so listening improves alongside reading.",
  },
  {
    Icon: Target,
    title: "Placement test and TCF Canada prep",
    body: "Each learner starts at the right level. Canada-bound learners follow an exam-focused track.",
  },
  {
    Icon: BarChart3,
    title: "Progress reports",
    body: "Who is active, lessons completed and level progress for every learner — no chasing people for updates.",
  },
  {
    Icon: Award,
    title: "Verifiable certificates",
    body: "Learners earn a certificate for each level they finish, with a public link anyone can verify.",
  },
  {
    Icon: Smartphone,
    title: "Learn anywhere, 10 minutes at a time",
    body: "Works on any phone or laptop. Streaks and reminders keep busy people coming back.",
  },
];

const FAQS = [
  {
    q: "Does each learner need their own account?",
    a: "Yes. Each learner creates their own account with a link we send you — we never create accounts on someone's behalf. Their seat unlocks Premium for 12 months.",
  },
  {
    q: "What happens when someone leaves the team?",
    a: "Tell us and we move the seat to someone new. You pay for seats, not for names.",
  },
  {
    q: "How do we pay?",
    a: "One annual invoice, payable by card or bank transfer. We can add a PO number and your company details.",
  },
  {
    q: "Can we try it first?",
    a: `Yes — a free ${PILOT.days}-day pilot for up to ${PILOT.maxLearners} learners. Near the end you get a usage report and a quote, and you decide.`,
  },
  {
    q: "Are live lessons with a tutor included?",
    a: "Business plans cover self-study. Learners can still book individual lessons with a FrancoLink tutor if they want to.",
  },
  {
    q: "Which languages and levels?",
    a: "French, from complete beginner (A1) to upper-intermediate (B2), plus TCF Canada preparation.",
  },
];

function BookCallButton({ variant = "primary" }: { variant?: "primary" | "secondary" | "ghost" }) {
  return BUSINESS_BOOKING_URL ? (
    <CtaButton href={BUSINESS_BOOKING_URL} variant={variant} external>
      <CalendarClock className="w-5 h-5" />
      Book a 20-minute call
    </CtaButton>
  ) : (
    <CtaButton href={BUSINESS_CONTACT_HREF} variant={variant}>
      <CalendarClock className="w-5 h-5" />
      Talk to us
    </CtaButton>
  );
}

export default function BusinessPage() {
  return (
    <>
      {/* ---------------------------------------------------------------- HERO */}
      <div className="bg-primary-50 border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.15em] text-secondary mb-4">
            FrancoLink for Business
          </span>
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-primary tracking-tight max-w-3xl mx-auto leading-[1.1]">
            French your people will actually keep up with
          </h1>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            A structured self-study course for your staff, students or clients —
            with progress reports so you can see it working. Seats from{" "}
            {usd(TEAM_SEAT_TIERS[1].pricePerYear!)} per learner per year.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <CtaButton href={BUSINESS_CONTACT_HREF} variant="secondary">
              Start a free {PILOT.days}-day pilot
            </CtaButton>
            <BookCallButton variant="ghost" />
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------- AUDIENCES */}
      <Section>
        <SectionHeading
          eyebrow="Who it's for"
          title="One course, four ways to use it"
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCES.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="p-7 rounded-2xl bg-white border border-gray-100 shadow-soft"
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

      {/* ------------------------------------------------------------ INCLUDED */}
      <Section tone="tint">
        <SectionHeading
          eyebrow="What every learner gets"
          title="Everything in Premium, plus reporting for you"
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {INCLUDED.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="p-7 rounded-2xl bg-white border border-gray-100 shadow-soft"
            >
              <Icon className="w-6 h-6 text-secondary mb-4" />
              <h3 className="font-heading font-bold text-lg text-primary mb-2">
                {title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------------- PRICING */}
      <Section id="pricing">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple, per-learner pricing"
          subtitle="One annual invoice. No setup fees. Seats can be moved when people leave."
        />
        <div className="grid gap-6 lg:grid-cols-3">
          <PriceCard
            title="Teams"
            for="Employers"
            lines={TEAM_SEAT_TIERS.map((t) => ({
              label: t.range,
              value: t.pricePerYear ? `${usd(t.pricePerYear)} / learner / year` : "Let's talk",
            }))}
            note={`Minimum ${TEAM_MIN_SEATS} learners. Includes progress reports for managers.`}
          />
          <PriceCard
            title="Schools & teachers"
            for="Classrooms"
            lines={[
              {
                label: `Schools (from ${SCHOOL_MIN_SEATS} students)`,
                value: `${usd(SCHOOL_SEAT_PRICE)} / student / year`,
              },
              {
                label: `Teachers (from ${TEACHER_MIN_SEATS} students)`,
                value: `${usd(TEACHER_SEAT_PRICE)} / student / year`,
              },
              { label: "Teacher accounts", value: "Free" },
            ]}
            note="Assign lessons and homework, and see who has done them."
            highlight
          />
          <PriceCard
            title="Partners"
            for="Immigration, relocation & study-abroad agencies"
            lines={[
              { label: "Referral partnership", value: "Earn on every client" },
              { label: "Bulk 12-month access codes", value: "Volume pricing" },
            ]}
            note="Include FrancoLink in your TCF prep or relocation package. Rates on request."
          />
        </div>

        <div className="mt-10 p-6 sm:p-8 rounded-2xl bg-secondary/10 border border-secondary/30 text-center max-w-3xl mx-auto">
          <p className="font-heading font-bold text-primary text-lg">
            Founding customers: {FOUNDING_OFFER.discountPct}% off your first year
          </p>
          <p className="mt-2 text-sm text-gray-700">
            For our first {FOUNDING_OFFER.organisations} organisations, in return
            for a short case study once you&apos;ve seen results.
          </p>
        </div>
      </Section>

      {/* ----------------------------------------------------------- HOW IT WORKS */}
      <Section tone="tint">
        <SectionHeading eyebrow="Getting started" title="Up and running in a day" />
        <ol className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {[
            {
              Icon: CalendarClock,
              title: "1. Tell us who's learning",
              body: "How many people, their rough level and any deadline — a test date, a move, a new role.",
            },
            {
              Icon: Smartphone,
              title: "2. Learners join with one link",
              body: "Everyone creates their own account, takes the placement test and starts at the right level.",
            },
            {
              Icon: Receipt,
              title: "3. See progress, then decide",
              body: `After the ${PILOT.days}-day pilot you get a usage report and a quote. Keep going only if it's working.`,
            },
          ].map(({ Icon, title, body }) => (
            <li
              key={title}
              className="p-7 rounded-2xl bg-white border border-gray-100 shadow-soft"
            >
              <Icon className="w-6 h-6 text-secondary mb-4" />
              <h3 className="font-heading font-bold text-lg text-primary mb-2">
                {title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ----------------------------------------------------------------- FAQ */}
      <Section>
        <div className="max-w-3xl mx-auto">
          <SectionHeading eyebrow="Questions" title="Common questions" />
          <div className="divide-y divide-gray-100 border-y border-gray-100">
            {FAQS.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex items-start justify-between gap-4 cursor-pointer list-none font-heading font-bold text-primary">
                  {f.q}
                  <ChevronRight className="w-5 h-5 text-secondary shrink-0 mt-0.5 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-gray-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- CTA */}
      <Section tone="navy">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-white">
            Try it with your team, free
          </h2>
          <p className="mt-4 text-lg text-primary-100">
            {PILOT.days} days, up to {PILOT.maxLearners} learners, no card needed.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <CtaButton href={BUSINESS_CONTACT_HREF} variant="secondary">
              Start a free pilot
            </CtaButton>
            {BUSINESS_BOOKING_URL && <BookCallButton variant="ghost" />}
          </div>
        </div>
      </Section>
    </>
  );
}

function PriceCard({
  title,
  for: audience,
  lines,
  note,
  highlight = false,
}: {
  title: string;
  for: string;
  lines: { label: string; value: string }[];
  note: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "p-7 rounded-2xl bg-white border shadow-soft flex flex-col " +
        (highlight ? "border-secondary ring-2 ring-secondary/30" : "border-gray-100")
      }
    >
      <h3 className="font-heading font-extrabold text-2xl text-primary">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{audience}</p>
      <ul className="mt-6 space-y-4 flex-1">
        {lines.map((l) => (
          <li key={l.label} className="flex gap-3">
            <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">{l.label}</p>
              <p className="font-bold text-primary">{l.value}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-6 pt-5 border-t border-gray-100 text-sm text-gray-600">{note}</p>
    </div>
  );
}
