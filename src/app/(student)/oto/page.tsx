// The post-purchase offer. Two steps, then out of the way.
//
//   /oto            the starter pack, $54, one click
//   /oto?step=down  the community pack, $24, if they decline
//   /workbook       either way, once they have answered
//
// Placed AFTER account creation rather than immediately after payment, which
// is the one place this departs from the classic funnel. Selling to a guest
// first would mean a buyer could take the upsell and still never make an
// account -- and the account, not the $54, is what this whole funnel exists to
// produce. One password field first protects the metric the project is judged
// on; the offer is no colder for it, since they paid ninety seconds ago.
//
// Two steps, not four. More offers here means more refunds and a worse first
// impression from someone who has just handed over money.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { hasActivePlan, hasUsedStarterPack } from "@/lib/credits/plans";
import { OtoOffer } from "@/components/workbook/oto-offer";

export const metadata: Metadata = {
  title: "One thing before you start | FrancoLink",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

interface PageProps {
  searchParams: Promise<{ step?: string }>;
}

export default async function OtoPage({ searchParams }: PageProps) {
  const { step } = await searchParams;
  const isDownsell = step === "down";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login/student?next=/oto");

  // Nobody is offered what they already own.
  const [onPlan, usedPack] = await Promise.all([
    hasActivePlan(user.id),
    hasUsedStarterPack(user.id),
  ]);
  if (onPlan || usedPack) redirect("/workbook");

  // No workbook, no offer — this page is the tail of that purchase, not a
  // general storefront.
  const { count: owns } = await service()
    .from("digital_orders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "paid");
  if (!owns) redirect("/workbook");

  const { data: pack } = await service()
    .from("starter_packs")
    .select("pack_key, tier, lessons, price_cents")
    .eq("pack_key", isDownsell ? "starter_community" : "starter_professional")
    .maybeSingle();
  if (!pack) redirect("/workbook");

  const perLesson = (pack.price_cents / pack.lessons / 100).toFixed(2);

  return (
    <main className="mx-auto max-w-xl px-5 py-10 sm:py-14">
      <p className="text-sm font-medium text-primary">
        {isDownsell ? "One last thing" : "Your workbook is ready"}
      </p>

      <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        {isDownsell
          ? "Try it with a community tutor instead?"
          : "The book can't hear you speak."}
      </h1>

      <p className="mt-4 text-muted-foreground">
        {isDownsell
          ? `Same idea, lower price. ${pack.lessons} lessons with a community tutor — people who are fluent and trained, at $${perLesson} a lesson.`
          : `You have the grammar. What you don't have yet is someone to hear you use it and tell you what your ear can't catch — your liaisons, your rhythm, the words you avoid because you're not sure of them.`}
      </p>

      {!isDownsell && (
        <ul className="mt-6 space-y-2.5 rounded-2xl border border-border bg-muted/40 p-5 text-[15px]">
          {[
            `${pack.lessons} lessons of 50 minutes, $${perLesson} each`,
            "Professional tutors — qualified and vetted",
            "Book them whenever you like, within 30 days",
            "One per person, only offered now",
          ].map((line) => (
            <li key={line} className="flex gap-2.5">
              <span aria-hidden className="text-primary">✓</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )}

      <OtoOffer
        packKey={pack.pack_key}
        priceLabel={`$${(pack.price_cents / 100).toFixed(0)}`}
        lessons={pack.lessons}
        isDownsell={isDownsell}
      />

      <p className="mt-6 text-xs text-muted-foreground">
        Your card is already on file from the workbook — one tap, nothing to
        type. Lessons expire 30 days after purchase.
      </p>
    </main>
  );
}
