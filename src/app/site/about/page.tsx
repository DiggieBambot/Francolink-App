import type { Metadata } from "next";
import { Compass, HeartHandshake, Target } from "lucide-react";
import { Section, SectionHeading, CtaButton } from "@/components/site/ui";

export const metadata: Metadata = {
  title: "About us",
  description:
    "FrancoLink connects language learners with certified live tutors and gives them a structured CEFR app to practise in every day. Here's who we are and what we believe about learning a language.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  {
    Icon: Target,
    title: "Structure beats streaks",
    body: "Daily practice matters, but only on top of a real syllabus. Every lesson in FrancoLink sits at a known CEFR level and builds on the one before it.",
  },
  {
    Icon: HeartHandshake,
    title: "Teachers, not just speakers",
    body: "Being a native speaker doesn't make someone a teacher. We select for teaching qualifications and classroom experience, then watch them teach before we list them.",
  },
  {
    Icon: Compass,
    title: "You should always know where you are",
    body: "Placement tests, coverage reports and progress tracking exist so you can answer one question at any moment: what have I actually learned, and what's next?",
  },
];

export default function AboutPage() {
  return (
    <>
      <div className="bg-primary-50 border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-primary tracking-tight">
            About FrancoLink
          </h1>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto">
            We started FrancoLink because the two halves of learning a language
            were never in the same place: a good teacher, and something to do
            between lessons.
          </p>
        </div>
      </div>

      <Section>
        <div className="max-w-3xl mx-auto prose-lg text-gray-600 leading-relaxed space-y-6">
          <p>
            Apps are great at habit and terrible at correction. A tutor will
            catch the mistake you keep making and explain why — but you only see
            them an hour or two a week. Learners end up bouncing between a
            gamified app that never quite gets them speaking, and a tutor with no
            way to see what they did in between.
          </p>
          <p>
            FrancoLink puts both in one product. Tutors teach in a live room with
            a shared whiteboard and exercises drawn from the same CEFR curriculum
            students study on their own. Homework is assigned, submitted and
            marked in the app. When a student walks into their next lesson, their
            tutor already knows what they covered.
          </p>
          <p>
            We currently teach French, English, Spanish and German, from complete
            beginner (A1) through to advanced (C2), with new grammar and
            pronunciation content shipping continuously.
          </p>
        </div>
      </Section>

      <Section tone="tint">
        <SectionHeading eyebrow="What we believe" title="Three principles" />
        <div className="grid gap-6 md:grid-cols-3">
          {VALUES.map(({ Icon, title, body }) => (
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

      <Section tone="navy">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
            Teach with FrancoLink
          </h2>
          <p className="mt-4 text-primary-100 text-lg">
            If you&apos;re a qualified language teacher looking for students, a
            proper curriculum and tools that don&apos;t get in the way — we&apos;d
            like to meet you.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <CtaButton href="/teach" variant="secondary">
              Apply to teach with us
            </CtaButton>
            <CtaButton href="/contact" variant="ghost">
              Talk to us
            </CtaButton>
          </div>
        </div>
      </Section>
    </>
  );
}
