import type { Metadata } from "next";
import { Users } from "lucide-react";
import { Section, SectionHeading, CtaButton } from "@/components/site/ui";
import { TutorDirectory } from "@/components/site/tutor-directory";
import { getPublicTutors } from "@/lib/site/queries";
import { appUrl } from "@/lib/site/hosts";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Our tutors",
  description:
    "Browse FrancoLink's certified French, English, Spanish and German tutors. See qualifications, CEFR levels, specialities, rates and weekly availability before you book.",
  alternates: { canonical: "/tutors" },
};

export default async function TutorsPage() {
  const tutors = await getPublicTutors();

  return (
    <>
      <div className="bg-primary-50 border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-primary tracking-tight">
            Meet our tutors
          </h1>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Every tutor on this page was interviewed, checked and approved by us.
            Filter by the language you want to learn, then open a profile to see
            their schedule and book a first lesson.
          </p>
        </div>
      </div>

      <Section>
        {tutors.length > 0 ? (
          <TutorDirectory tutors={tutors} />
        ) : (
          <div className="text-center py-16">
            <Users className="w-14 h-14 text-gray-300 mx-auto mb-5" />
            <h2 className="font-heading font-bold text-2xl text-primary mb-2">
              Our directory is opening soon
            </h2>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              We&apos;re finishing the vetting round for our first tutors. In the
              meantime you can start learning in the app straight away.
            </p>
            <CtaButton href={appUrl("/signup")} external>
              Start free in the app
            </CtaButton>
          </div>
        )}
      </Section>

      <Section tone="tint">
        <SectionHeading
          eyebrow="Our standards"
          title="How we select tutors"
          subtitle="We turn down most applicants. These are the four things a tutor has to clear before their profile appears on this page."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [
              "A teaching qualification",
              "A recognised teaching credential for the language they teach — FLE, CELTA, DELE, a teaching degree or equivalent. We ask for the document.",
            ],
            [
              "Proven classroom experience",
              "At least two years teaching real students, with references we contact. Enthusiasm isn't a substitute for having taught a beginner to B1.",
            ],
            [
              "A live teaching demo",
              "Every applicant teaches a real 30-minute lesson to one of our team. We're looking for clear explanation, correction, and pacing.",
            ],
            [
              "Ongoing student feedback",
              "Ratings and feedback are reviewed continuously. A tutor whose students stop progressing loses their listing.",
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
        <p className="mt-10 text-center text-gray-600">
          Teach with us?{" "}
          <a
            href={appUrl("/become-tutor")}
            className="font-bold text-primary underline underline-offset-4"
          >
            Apply to join the team
          </a>
        </p>
      </Section>
    </>
  );
}
