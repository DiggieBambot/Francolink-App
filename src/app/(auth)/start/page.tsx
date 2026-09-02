// The funnel entrance.
//
// "Register free" used to point at /signup, which made an account and dropped
// the person on a dashboard with no plan, no credits and nothing to do. This
// route is what that CTA should always have meant: signup, then a plan, then
// back to the tutor they came from with lessons in hand.
//
// It is a single URL that behaves differently depending on how far along
// somebody is, rather than four routes that have to be chained by hand:
//
//   not signed in     -> signup, carrying next + shortlist forward
//   signed in, no plan-> the plan picker
//   signed in, plan   -> straight on to `next` (or the dashboard)
//
// That last case matters: a student who already subscribed and clicks
// "Register free" from an old tab should not be sold a second plan.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StudentSignupForm } from "@/components/auth/student-signup-form";
import { PlanPicker } from "@/components/student/plan-picker";
import { StarterPackPicker } from "@/components/student/starter-pack-picker";
import { AdoptShortlist } from "@/components/student/adopt-shortlist";
import {
  getPlans,
  getStarterPacks,
  hasActivePlan,
  hasEverSubscribed,
  hasUsedStarterPack,
} from "@/lib/credits/plans";
import { SITE_URL } from "@/lib/site/hosts";

export const metadata: Metadata = {
  title: "Get started | FrancoLink",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ next?: string; shortlist?: string }>;
}

/**
 * Only ever redirect to our own paths. `next` arrives from a query string on
 * another host, so treating it as a URL would make this an open redirect —
 * a phishing link that launders through francolink.net.
 */
function safeNext(next: string | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export default async function StartPage({ searchParams }: PageProps) {
  const { next: rawNext, shortlist } = await searchParams;
  const next = safeNext(rawNext);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ------------------------------------------------------------ not signed in
  if (!user) {
    // Come back HERE after signing up, not to the dashboard — the plan is the
    // point, and the shortlist has to survive the round trip.
    const self = `/start${
      next || shortlist
        ? `?${new URLSearchParams({
            ...(next ? { next } : {}),
            ...(shortlist ? { shortlist } : {}),
          })}`
        : ""
    }`;

    return (
      <div className="w-full">
        <StudentSignupForm next={self} />
      </div>
    );
  }

  // -------------------------------------------------------- already on a plan
  if (await hasActivePlan(user.id)) {
    redirect(next ?? "/dashboard");
  }

  // ------------------------------------------------------------- pick a plan
  const [plans, packs, everSubscribed, usedPack] = await Promise.all([
    getPlans(),
    getStarterPacks(),
    hasEverSubscribed(user.id),
    hasUsedStarterPack(user.id),
  ]);

  // The pack is a STARTER: offered once, and never to somebody who has already
  // had one. Someone coming back for more is a plan conversation.
  const showPacks = !usedPack && !everSubscribed && packs.length > 0;

  if (plans.length === 0 && !showPacks) {
    // Nothing to sell. Better to bail than to render an empty picker.
    redirect(next ?? "/dashboard");
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-10">
      {/* The shortlist rides in on the URL because the marketing host cannot
          write to the account itself. Adopted once, client-side, after auth. */}
      {shortlist && <AdoptShortlist slugs={shortlist} />}

      <div className="mb-8">
        <h1 className="font-heading font-extrabold text-3xl text-primary">
          {showPacks ? "Start with three lessons" : "Pick a plan and start"}
        </h1>
        <p className="mt-2 text-gray-600">
          {showPacks
            ? "Buy three lessons and book them with any tutor your pack covers. No subscription — decide about a plan once you've met your tutor."
            : "Lessons arrive weekly and you book them with any tutor your plan covers. No per-lesson haggling, no surprise charges."}
        </p>
      </div>

      {showPacks && (
        <>
          <StarterPackPicker packs={packs} next={next ?? undefined} />

          {plans.length > 0 && (
            <div className="my-10 flex items-center gap-4">
              <span className="h-px flex-1 bg-gray-100" />
              <span className="text-sm font-semibold text-gray-400">
                or learn every week
              </span>
              <span className="h-px flex-1 bg-gray-100" />
            </div>
          )}
        </>
      )}

      {plans.length > 0 && (
        <PlanPicker
          plans={plans}
          introEligible={!everSubscribed}
          next={next ?? undefined}
        />
      )}

      <p className="mt-8 text-center text-sm text-gray-500">
        Still deciding?{" "}
        <a
          href={`${SITE_URL}/tutors`}
          className="font-semibold text-primary underline underline-offset-4"
        >
          Browse tutors
        </a>{" "}
        or{" "}
        <Link
          href="/dashboard"
          className="font-semibold text-primary underline underline-offset-4"
        >
          look around first
        </Link>
        .
      </p>
    </div>
  );
}
