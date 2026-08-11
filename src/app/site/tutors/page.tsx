import type { Metadata } from "next";
import { Users } from "lucide-react";
import { Section, SectionHeading, CtaButton } from "@/components/site/ui";
import { TutorDirectory } from "@/components/site/tutor-directory";
import { getPublicTutors } from "@/lib/site/queries";
import {
  TIER_BLURB,
  TIER_LABEL,
  cheapestLesson,
  formatPrice,
  getPricingByTier,
  type Tier,
} from "@/lib/site/pricing";
import { appUrl } from "@/lib/site/hosts";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Our tutors",
  description:
    "Book a lesson with a FrancoLink tutor. See qualifications, specialities, CEFR levels and weekly availability — one clear price per lesson, set by us, not by the tutor.",
  alternates: { canonical: "/tutors" },
};

const TIER_ORDER: Tier[] = ["professional", "certified", "community"];

export default async function TutorsPage() {
  const [tutors, pricing] = await Promise.all([
    getPublicTutors(),
    getPricingByTier(),
  ]);

  return (
    <>
      <div className="bg-primary-50 border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-primary tracking-tight">
            Meet our tutors
          </h1>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Book directly with any tutor below. You pay one clear price per
            lesson — we set it, so you never negotiate a rate, and it&apos;s the
            same whichever tutor in a tier you choose.
          </p>
        </div>
      </div>

      <Section>
        {tutors.length > 0 ? (
          <TutorDirectory tutors={tutors} pricing={pricing} />
        ) : (
          <div className="text-center py-16">
            <Users className="w-14 h-14 text-gray-300 mx-auto mb-5" />
            <h2 className="font-heading font-bold text-2xl text-primary mb-2">
              Booking opens shortly
            </h2>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              We&apos;re finishing onboarding for our first tutors. In the
              meantime you can start learning in the app straight away.
            </p>
            <CtaButton href={appUrl("/signup")} external>
              Start free in the app
            </CtaButton>
          </div>
        )}
      </Section>

      {/* ------------------------------------------------------------- TIERS */}
      <Section tone="tint">
        <SectionHeading
          eyebrow="How pricing works"
          title="Three tutor tiers, one price list"
          subtitle="Every tutor is placed in a tier when they join, based on their qualifications and teaching experience. The tier sets the lesson price — tutors never set their own rates."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {TIER_ORDER.map((tier) => {
            const p = pricing[tier];
            const from = cheapestLesson(p);
            return (
              <div
                key={tier}
                className="p-7 rounded-2xl bg-white border border-gray-100 shadow-soft flex flex-col"
              >
                <h3 className="font-heading font-bold text-lg text-primary">
                  {TIER_LABEL[tier]}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mt-2 flex-1">
                  {TIER_BLURB[tier]}
                </p>
                <div className="mt-5 pt-5 border-t border-gray-50 space-y-1">
                  {p.lessons.map((l) => (
                    <p key={l.durationMinutes} className="text-sm">
                      <span className="font-heading font-extrabold text-primary">
                        {formatPrice(l.priceCents, l.currency)}
                      </span>
                      <span className="text-gray-500">
                        {" "}
                        / {l.durationMinutes} min
                      </span>
                    </p>
                  ))}
                  {p.trial && (
                    <p className="text-xs text-green-700 font-semibold pt-1">
                      First lesson{" "}
                      {formatPrice(p.trial.priceCents, p.trial.currency)} (
                      {p.trial.durationMinutes} min)
                    </p>
                  )}
                  {!from && (
                    <p className="text-sm text-gray-500">Pricing coming soon</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* --------------------------------------------------------- SELECTION */}
      <Section>
        <SectionHeading
          eyebrow="Our standards"
          title="How tutors join FrancoLink"
          subtitle="Every applicant goes through the same process before they can take a booking."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [
              "Application",
              "They tell us what they teach, where they qualified, and how much they can teach each week.",
            ],
            [
              "Credential check",
              "We ask to see the teaching qualification behind any Certified or Professional placement. No document, no tier.",
            ],
            [
              "Teaching demo",
              "A live lesson with our team. We're looking for clear explanation, useful correction, and sensible pacing.",
            ],
            [
              "Ongoing review",
              "Reliability — punctuality, cancellations, connection quality — is tracked from real lessons and shown on the profile.",
            ],
          ].map(([title, body], i) => (
            <div
              key={title}
              className="p-7 rounded-2xl bg-white border border-gray-100 shadow-soft"
            >
              <span className="inline-flex w-9 h-9 rounded-xl bg-secondary text-primary-900 items-center justify-center font-heading font-extrabold mb-4">
                {i + 1}
              </span>
              <h3 className="font-heading font-bold text-lg text-primary mb-2">
                {title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-5">
            Qualified to teach a language and looking for students?
          </p>
          <CtaButton href="/teach">Apply to teach with us</CtaButton>
        </div>
      </Section>
    </>
  );
}
