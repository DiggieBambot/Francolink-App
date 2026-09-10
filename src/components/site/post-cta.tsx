// The end-of-post call to action.
//
// site-brief.md (2026-09-10) makes this two exits, not one: the workbook for
// the reader who wants the rules drilled on paper, and a free account on the
// self-study app for the reader who wants the syllabus. `primary` decides which
// one leads; the other is always present as the secondary.
//
// Nothing here claims a learner count, a rating or a testimonial. Those numbers
// do not exist and the brief forbids inventing them.

import { CtaButton } from "./ui";
import { appUrl } from "@/lib/site/hosts";
import type { PostCta } from "@/lib/blog/posts";

const OFFERS = {
  workbook: {
    title: "The 45 rules, drilled, in one book",
    body:
      "Le Français Pas à Pas is a 95-page workbook covering A0 to B2: 45 rules, 45 graded exercises " +
      "and a full answer key that tells you why you were right or wrong.",
    label: "Get the workbook, $27",
    href: "/francais-pas-a-pas",
    external: false,
  },
  subscription: {
    title: "Or work through the whole syllabus",
    body:
      "The self-study library runs A1 to C2 as a proper syllabus, with a placement test so you start " +
      "in the right place and coverage reports so you can see what you have actually learned.",
    label: "Create a free account",
    href: appUrl("/signup"),
    external: true,
  },
  tutors: {
    title: "Practise it with a teacher",
    body:
      "Every tutor is checked for a teaching qualification, proven experience and a live teaching demo " +
      "before their profile goes live. Most offer a free trial lesson.",
    label: "Browse tutors",
    href: "/tutors",
    external: false,
  },
} as const;

export function PostCtaBlock({ primary }: { primary: PostCta }) {
  const lead = OFFERS[primary];
  const secondKey = primary === "subscription" ? "workbook" : "subscription";
  const second = OFFERS[secondKey];

  return (
    <aside className="mt-16 rounded-2xl border border-primary-100 bg-primary-50 p-8 sm:p-10">
      <h2 className="font-heading font-extrabold text-2xl text-primary tracking-tight">
        {lead.title}
      </h2>
      <p className="mt-3 text-lg leading-relaxed text-gray-700">{lead.body}</p>
      <div className="mt-6">
        <CtaButton href={lead.href} external={lead.external}>
          {lead.label}
        </CtaButton>
      </div>

      <div className="mt-8 pt-8 border-t border-primary-100">
        <h3 className="font-heading font-bold text-lg text-primary">{second.title}</h3>
        <p className="mt-2 text-gray-600 leading-relaxed">{second.body}</p>
        <div className="mt-4">
          <CtaButton href={second.href} external={second.external} variant="ghost">
            {second.label}
          </CtaButton>
        </div>
      </div>
    </aside>
  );
}
