import type { Metadata } from "next";
import { Suspense } from "react";
import { Section, SectionHeading, CtaButton } from "@/components/site/ui";
import { TutorDirectory } from "@/components/site/tutor-directory";
import { TutorCard } from "@/components/site/tutor-card";
import {
  getPlanNamesByTier,
  getPublicTutors,
  type TutorCard as TutorCardData,
} from "@/lib/site/queries";
import { TIER_BLURB, TIER_LABEL, type Tier } from "@/lib/site/pricing";
import { appUrl } from "@/lib/site/hosts";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Our tutors",
  description:
    "Book a lesson with a FrancoLink tutor. See qualifications, specialities, CEFR levels and weekly availability, then reserve a lesson in a couple of clicks.",
  alternates: { canonical: "/tutors" },
};

/**
 * What renders while the filter rail waits for the URL on the client, and what
 * a crawler without JavaScript is served: every tutor, in order, no filters.
 * The list is the valuable part of this page for SEO — the rail is not.
 */
function TutorDirectoryFallback({ tutors }: { tutors: TutorCardData[] }) {
  return (
    <div className="space-y-4">
      {tutors.map((tutor) => (
        <TutorCard key={tutor.slug} tutor={tutor} />
      ))}
    </div>
  );
}

// Two tiers in the directory: every live tutor is one or the other.
const TIER_ORDER: Tier[] = ["professional", "community"];

export default async function TutorsPage() {
  const [tutors, plansByTier] = await Promise.all([
    getPublicTutors(),
    getPlanNamesByTier(),
  ]);

  return (
    <>
      <div className="bg-primary-50 border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-primary tracking-tight">
            Meet our tutors
          </h1>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Browse every tutor teaching on FrancoLink, then reserve a lesson
            straight from their profile. No rate to negotiate — register free
            and pick a time that works for you.
          </p>
        </div>
      </div>

      <Section>
        {/* The directory renders its own empty state per language — a language
            with no tutors yet collects emails instead of showing nothing.

            Suspense is required, not decorative: the filter rail keeps its
            state in the URL via useSearchParams, and this page is prerendered
            (revalidate = 3600). Without a boundary Next bails out of the
            static export entirely and the build fails. The fallback renders
            the unfiltered list, which is what a crawler should see anyway. */}
        <Suspense fallback={<TutorDirectoryFallback tutors={tutors} />}>
          <TutorDirectory tutors={tutors} />
        </Suspense>

        {tutors.length === 0 && (
          <p className="mt-12 text-center text-gray-600">
            Learning on your own in the meantime?{" "}
            <a
              href={appUrl("/signup")}
              className="font-bold text-primary underline underline-offset-4"
            >
              The app is free to start
            </a>
            .
          </p>
        )}
      </Section>

      {/* ------------------------------------------------------------- TIERS */}
      <Section tone="tint">
        <SectionHeading
          eyebrow="How tiers work"
          title="Two tutor tiers"
          subtitle="Every tutor is placed in a tier when they join, based on their qualifications and teaching experience. Your plan decides which tiers you can book — tutors never set their own terms."
        />
        <div className="grid gap-6 md:grid-cols-2">
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
              {/* Which plan reaches this tier. The Community plan cannot book a
                  Professional tutor, and the booking path enforces it — saying
                  so here stops that being a surprise at checkout. */}
              {plansByTier[tier]?.length > 0 && (
                <p className="mt-4 pt-4 border-t border-gray-50 text-sm">
                  <span className="text-gray-500">Bookable on the </span>
                  <span className="font-heading font-bold text-primary">
                    {plansByTier[tier].join(" and ")}
                  </span>
                  <span className="text-gray-500">
                    {" "}
                    {plansByTier[tier].length > 1 ? "plans" : "plan"}
                  </span>
                </p>
              )}
            </div>
          ))}
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
