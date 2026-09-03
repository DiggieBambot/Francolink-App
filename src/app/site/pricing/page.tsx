import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";
import { Section, SectionHeading, CtaButton } from "@/components/site/ui";
import { appUrl } from "@/lib/site/hosts";
import { cn } from "@/lib/utils";
import { JsonLd } from "@/components/site/json-ld";
import { subscriptionCourseSchema, breadcrumbSchema } from "@/lib/site/schema";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "FrancoLink pricing: a free plan to get started, Premium for unlimited CEFR lessons and AI practice, and Premium+ for the full experience. Live tutor lessons are priced by each tutor.",
  alternates: { canonical: "/pricing" },
};

// Prices are also rendered inside the app's own pricing page, which owns
// checkout and currency conversion. This page is the public shop window —
// keep the two in sync when prices change.
interface Plan {
  name: string;
  tagline: string;
  monthly: string;
  note: string;
  badge?: string;
  highlighted?: boolean;
  features: [string, boolean][];
  cta: string;
}

const PLANS: Plan[] = [
  {
    name: "Free",
    tagline: "Start your journey",
    monthly: "$0",
    note: "Free forever",
    features: [
      ["1 lesson per day", true],
      ["Unit 1 free forever", true],
      ["Basic progress tracking", true],
      ["All levels (A1–C2)", false],
      ["AI conversation tutor", false],
      ["Offline mode", false],
    ],
    cta: "Create a free account",
  },
  {
    name: "Premium",
    tagline: "Unlock everything",
    monthly: "$7.99",
    note: "or $5.00/mo billed yearly",
    highlighted: true,
    badge: "Most popular",
    features: [
      ["Unlimited lessons", true],
      ["All levels (A1–C2)", true],
      ["Advanced progress tracking", true],
      ["300 AI tutor messages per month", true],
      ["Offline mode", true],
      ["Priority support", true],
    ],
    cta: "Go Premium",
  },
  {
    name: "Premium+",
    tagline: "The full experience",
    monthly: "$14.99",
    note: "or $10.00/mo billed yearly",
    badge: "Best value",
    features: [
      ["Everything in Premium", true],
      ["1,500 AI tutor messages per month", true],
      ["Advanced pronunciation analysis", true],
      ["Priority tutor matching", true],
      ["Offline mode", true],
      ["Priority support", true],
    ],
    cta: "Go Premium+",
  },
];

export default function SitePricingPage() {
  return (
    <>
      {/* The subscription as a priced Course. The offers below mirror the
          numbers in PLANS above — when prices change, change both. */}
      <JsonLd
        schema={[
          subscriptionCourseSchema(),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Pricing", path: "/pricing" },
          ]),
        ]}
      />
      <div className="bg-primary-50 border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-primary tracking-tight">
            Simple pricing
          </h1>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto">
            One subscription covers the whole app — lessons, games, homework and
            AI practice. Live lessons are billed separately by each tutor at the
            rate shown on their profile.
          </p>
        </div>
      </div>

      <Section>
        <div className="grid gap-6 lg:grid-cols-3 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative p-8 rounded-3xl border shadow-soft",
                plan.highlighted
                  ? "bg-primary text-white border-primary lg:-mt-4 lg:pb-12 shadow-hard"
                  : "bg-white border-gray-100"
              )}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-8 px-3 py-1 rounded-full bg-secondary text-primary-900 text-xs font-bold uppercase tracking-wide">
                  {plan.badge}
                </span>
              )}

              <h2
                className={cn(
                  "font-heading font-extrabold text-2xl",
                  plan.highlighted ? "text-white" : "text-primary"
                )}
              >
                {plan.name}
              </h2>
              <p
                className={cn(
                  "text-sm mt-1",
                  plan.highlighted ? "text-primary-100" : "text-gray-500"
                )}
              >
                {plan.tagline}
              </p>

              <p className="mt-6 flex items-baseline gap-1">
                <span
                  className={cn(
                    "font-heading font-extrabold text-4xl",
                    plan.highlighted ? "text-white" : "text-primary"
                  )}
                >
                  {plan.monthly}
                </span>
                <span
                  className={cn(
                    "text-sm",
                    plan.highlighted ? "text-primary-100" : "text-gray-500"
                  )}
                >
                  /month
                </span>
              </p>
              <p
                className={cn(
                  "text-xs mt-1",
                  plan.highlighted ? "text-primary-200" : "text-gray-400"
                )}
              >
                {plan.note}
              </p>

              <ul className="mt-8 space-y-3">
                {plan.features.map(([label, included]) => (
                  <li key={label} className="flex items-start gap-3 text-sm">
                    {included ? (
                      <Check className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    ) : (
                      <Minus className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                    )}
                    <span
                      className={cn(
                        included
                          ? plan.highlighted
                            ? "text-primary-100"
                            : "text-gray-600"
                          : "text-gray-400 line-through"
                      )}
                    >
                      {label}
                    </span>
                  </li>
                ))}
              </ul>

              <CtaButton
                href={appUrl("/pricing")}
                external
                variant={plan.highlighted ? "secondary" : "ghost"}
                className="w-full mt-8"
              >
                {plan.cta}
              </CtaButton>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="tint">
        <SectionHeading
          eyebrow="Live lessons"
          title="What does a tutor cost?"
          subtitle="Each tutor sets their own hourly rate — you'll see it on their profile before you book. Most offer a free trial lesson so you can check the fit first."
        />
        <div className="text-center">
          <CtaButton href="/tutors">See tutors and their rates</CtaButton>
        </div>
      </Section>
    </>
  );
}
