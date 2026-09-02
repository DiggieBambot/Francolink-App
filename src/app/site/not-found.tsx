// 404 for the front-facing website (francolink.net).
//
// Middleware rewrites any unowned path on the marketing host to a route under
// /site that matches nothing, which lands here. Before that, unmatched paths
// were 307-redirected to app.francolink.net and 404'd there — so a typo on the
// website answered on the wrong host, after a wasted redirect hop.
//
// Renders inside the site layout, so it keeps the website's header and footer
// and offers the pages a lost visitor most likely wanted.

import type { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";
import { Section, CtaButton } from "@/components/site/ui";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

const SUGGESTIONS = [
  { href: "/tutors", label: "Browse tutors" },
  { href: "/francais-pas-a-pas", label: "Le Français Pas à Pas" },
  { href: "/how-it-works", label: "How FrancoLink works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
];

export default function SiteNotFound() {
  return (
    <Section>
      <div className="max-w-xl mx-auto text-center py-10">
        <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-6">
          <Compass className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-primary tracking-tight">
          We can&apos;t find that page
        </h1>
        <p className="mt-5 text-gray-600 leading-relaxed">
          The link may be out of date, or the address slightly off. Here&apos;s
          where most people are heading:
        </p>

        <ul className="mt-8 flex flex-wrap justify-center gap-3">
          {SUGGESTIONS.map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                className="inline-block rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700 transition-colors hover:border-primary hover:text-primary"
              >
                {s.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10">
          <CtaButton href="/">Back to the home page</CtaButton>
        </div>
      </div>
    </Section>
  );
}
