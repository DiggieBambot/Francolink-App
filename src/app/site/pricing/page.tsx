import type { Metadata } from "next";
import { Check, Minus, Sparkles, Users } from "lucide-react";
import { Section, SectionHeading, CtaButton } from "@/components/site/ui";
import { appUrl } from "@/lib/site/hosts";
import { cn } from "@/lib/utils";
import { JsonLd } from "@/components/site/json-ld";
import { subscriptionCourseSchema, breadcrumbSchema } from "@/lib/site/schema";
import { getFeaturesConfig } from "@/lib/config/settings";
import { withoutTutorCopy } from "@/lib/ai/tutor-copy";

// The plan lists follow the AI tutor switch in Admin → Settings → AI. The page
// is otherwise static, so re-render it every few minutes to pick up a flip
// without a deploy.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { aiTutorEnabled } = await getFeaturesConfig();
  return {
    title: "Pricing",
    description: `FrancoLink pricing: a free plan to get started, Premium for unlimited CEFR lessons${
      aiTutorEnabled ? " and AI practice" : ""
    }, and Premium+ for the full experience. Live tutor lessons are priced by each tutor.`,
    alternates: { canonical: "/pricing" },
  };
}

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
    tagline: "Try it before you pay",
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

export default async function SitePricingPage() {
  const { aiTutorEnabled } = await getFeaturesConfig();

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
      <div className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-white to-white">
        {/* Soft brand-colour glows behind the heading. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[48rem] h-[24rem] rounded-full bg-primary-200/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-10 right-[10%] w-64 h-64 rounded-full bg-secondary-200/50 blur-3xl"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-6 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-secondary-200 text-xs font-bold uppercase tracking-[0.15em] text-secondary-600 shadow-soft">
            <Sparkles className="w-3.5 h-3.5" /> Pricing
          </span>
          <h1 className="mt-5 font-heading font-extrabold text-4xl sm:text-6xl text-primary tracking-tight">
            Simple <span className="text-secondary">pricing</span>
          </h1>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto">
            One subscription covers the whole app — lessons, games,
            homework{aiTutorEnabled ? " and AI practice" : " and practice"}. Live lessons are billed separately by each tutor at the
            rate shown on their profile.
          </p>
        </div>
      </div>

      <Section className="!pt-10 sm:!pt-14 !pb-12 sm:!pb-16">
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-3 items-stretch max-w-6xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative flex flex-col p-8 rounded-3xl transition-all duration-300 hover:-translate-y-1",
                plan.highlighted
                  ? "bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white shadow-hard ring-2 ring-secondary lg:scale-105 z-10"
                  : "bg-white border border-gray-100 shadow-soft hover:shadow-medium"
              )}
            >
              {plan.badge && (
                <span
                  className={cn(
                    "absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-soft",
                    plan.highlighted
                      ? "bg-secondary text-primary-900"
                      : "bg-secondary-50 text-secondary-700 border border-secondary-200"
                  )}
                >
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

              <div
                className={cn(
                  "mt-6 pb-6 border-b",
                  plan.highlighted ? "border-white/15" : "border-gray-100"
                )}
              >
                <p className="flex items-baseline gap-1">
                  <span
                    className={cn(
                      "font-heading font-extrabold text-5xl tracking-tight",
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
                    "text-sm mt-1.5 font-medium",
                    plan.highlighted ? "text-secondary-300" : "text-secondary-600"
                  )}
                >
                  {plan.note}
                </p>
              </div>

              <ul className="mt-6 space-y-3.5 flex-1">
                {withoutTutorCopy(plan.features, aiTutorEnabled, ([label]) => label).map(([label, included]) => (
                  <li key={label} className="flex items-start gap-3 text-sm">
                    {included ? (
                      <span
                        className={cn(
                          "flex items-center justify-center w-5 h-5 rounded-full shrink-0",
                          plan.highlighted ? "bg-secondary text-primary-900" : "bg-secondary-100 text-secondary-600"
                        )}
                      >
                        <Check className="w-3 h-3" strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full shrink-0 bg-gray-100 text-gray-300">
                        <Minus className="w-3 h-3" strokeWidth={3} />
                      </span>
                    )}
                    <span
                      className={cn(
                        included
                          ? plan.highlighted
                            ? "text-white/90"
                            : "text-gray-700"
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

      <Section className="!pt-4">
        <div className="relative overflow-hidden max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-primary-600 to-primary-800 px-6 py-12 sm:px-14 sm:py-16 text-center shadow-hard">
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -right-16 w-72 h-72 rounded-full bg-secondary/25 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -left-16 w-72 h-72 rounded-full bg-primary-400/25 blur-3xl"
          />
          <div className="relative">
            <SectionHeading
              eyebrow="Live lessons"
              title="What does a tutor cost?"
              subtitle="Each tutor sets their own hourly rate — you'll see it on their profile before you book. Most offer a free trial lesson so you can check the fit first."
              inverted
            />
            <CtaButton href="/tutors" variant="secondary" className="-mt-4">
              <Users className="w-5 h-5" /> See tutors and their rates
            </CtaButton>
          </div>
        </div>
      </Section>
    </>
  );
}
