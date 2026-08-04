import type { Metadata } from "next";
import { PenLine } from "lucide-react";
import { Section, CtaButton } from "@/components/site/ui";

// Placeholder until the blog is built (see docs — posts are deliberately out of
// scope for v1 of the website). Kept as a real route so the footer link, the
// nav and any early inbound links resolve instead of 404ing.
export const metadata: Metadata = {
  title: "Blog",
  description:
    "Language-learning guides, grammar explainers and study tips from the FrancoLink team. Launching soon.",
  alternates: { canonical: "/blog" },
  robots: { index: false, follow: true },
};

export default function BlogPage() {
  return (
    <Section>
      <div className="max-w-xl mx-auto text-center py-10">
        <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-6">
          <PenLine className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-primary tracking-tight">
          The blog is on its way
        </h1>
        <p className="mt-5 text-gray-600 leading-relaxed">
          We&apos;re writing grammar explainers, level-by-level study guides and
          honest advice about learning a language as an adult. Until then, the
          FAQ answers most of what people ask us.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <CtaButton href="/faq">Read the FAQ</CtaButton>
          <CtaButton href="/tutors" variant="ghost">
            Browse tutors
          </CtaButton>
        </div>
      </div>
    </Section>
  );
}
