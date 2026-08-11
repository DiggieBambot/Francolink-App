import type { Metadata } from "next";
import { BookOpen, CalendarCheck, Coins, Users } from "lucide-react";
import { Section, SectionHeading } from "@/components/site/ui";
import { TeachForm } from "@/components/site/teach-form";
import {
  TIER_BLURB,
  TIER_LABEL,
  formatPrice,
  getPricingByTier,
  type Tier,
} from "@/lib/site/pricing";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Teach with FrancoLink",
  description:
    "Apply to teach French, English, Spanish or German with FrancoLink. We bring you the students, the CEFR curriculum and the classroom — you teach. Fixed pay per lesson, no rate haggling.",
  alternates: { canonical: "/teach" },
};

const TIER_ORDER: Tier[] = ["professional", "certified", "community"];

const PERKS = [
  {
    Icon: Users,
    title: "We bring the students",
    body: "You don't build an audience or compete on price. Students book from our directory and we handle the payment.",
  },
  {
    Icon: BookOpen,
    title: "A curriculum, not a blank page",
    body: "CEFR A1–C2 lessons, exercises, homework and games are already built. Turn up and teach.",
  },
  {
    Icon: CalendarCheck,
    title: "You control your hours",
    body: "Set your weekly availability and block out days whenever you need. We never book you outside it.",
  },
  {
    Icon: Coins,
    title: "Fixed pay per lesson",
    body: "You know exactly what each lesson pays before you teach it. No bidding, no undercutting, no negotiating with students.",
  },
];

export default async function TeachPage() {
  const pricing = await getPricingByTier();

  return (
    <>
      <div className="bg-primary-50 border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-primary tracking-tight">
            Teach with FrancoLink
          </h1>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            We&apos;re building a small team of language teachers who are good at
            the job. If that&apos;s you, we handle the students, the materials and
            the admin — you teach.
          </p>
        </div>
      </div>

      <Section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PERKS.map(({ Icon, title, body }) => (
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

      <Section tone="tint">
        <SectionHeading
          eyebrow="Tiers"
          title="Where you'd be placed"
          subtitle="We place every tutor in a tier at onboarding, based on qualifications and proven experience. The tier sets what the lesson sells for — and what you're paid for teaching it."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {TIER_ORDER.map((tier) => (
            <div
              key={tier}
              className="p-7 rounded-2xl bg-white border border-gray-100 shadow-soft"
            >
              <h3 className="font-heading font-bold text-lg text-primary">
                {TIER_LABEL[tier]}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed mt-2">
                {TIER_BLURB[tier]}
              </p>
              {pricing[tier].lessons.length > 0 && (
                <p className="mt-4 pt-4 border-t border-gray-50 text-sm text-gray-500">
                  Students pay{" "}
                  {pricing[tier].lessons
                    .map(
                      (l) =>
                        `${formatPrice(l.priceCents, l.currency)}/${l.durationMinutes}min`
                    )
                    .join(" · ")}
                </p>
              )}
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-gray-600 max-w-2xl mx-auto">
          We&apos;ll tell you your tier and exactly what it pays before you accept
          anything. Tiers are set from credentials, not from reviews — a single
          unhappy student can never cut your rate.
        </p>
      </Section>

      <Section>
        <div className="max-w-2xl mx-auto">
          <SectionHeading
            eyebrow="Apply"
            title="Tell us about your teaching"
            subtitle="Takes about five minutes. If it looks like a fit, the next step is a short teaching demo with our team."
            align="left"
          />
          <TeachForm />
        </div>
      </Section>
    </>
  );
}
