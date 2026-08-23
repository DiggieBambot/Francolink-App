// The student's plan: what they have, what is left this week, and the history
// behind that number.
//
// The ledger is shown in full rather than summarised. A credit balance a
// student cannot explain is a support ticket, and every row here says where a
// lesson went — including the ones that lapsed, which is the mechanic people
// complain about most and the one worth being most transparent about.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { creditSummary, creditHistory, formatCredits } from "@/lib/credits/ledger";

export const metadata: Metadata = {
  title: "Your plan | FrancoLink",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const REASON_LABEL: Record<string, string> = {
  weekly_grant: "Weekly lessons added",
  signup_grant: "Welcome lessons",
  booking: "Lesson booked",
  cancellation_refund: "Lesson returned — you cancelled in time",
  tutor_cancelled: "Lesson returned — your tutor cancelled",
  tutor_no_show: "Lesson returned — your tutor didn't arrive",
  rollover_expiry: "Expired — above the rollover limit",
  subscription_ended: "Expired — plan ended",
  admin_adjustment: "Adjusted by FrancoLink",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [summary, history] = await Promise.all([
    creditSummary(user.id),
    creditHistory(user.id, 50),
  ]);

  const hasPlan = summary.planKey !== null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Your plan</h1>
        <p className="text-gray-500 mt-1">
          Lessons, and where they&apos;ve gone.
        </p>
      </header>

      {!hasPlan ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <h2 className="text-lg font-medium text-gray-900">
            You don&apos;t have a lesson plan yet
          </h2>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">
            A plan gives you live lessons with a tutor every week, plus all the
            self-study material.
          </p>
          {summary.balance > 0 && (
            <p className="text-gray-600 mt-4">
              You still have{" "}
              <strong>{formatCredits(summary.balance)}</strong> to use.
            </p>
          )}
          <Link
            href="/pricing"
            className="inline-block mt-6 rounded-xl bg-orange-600 px-5 py-2.5 font-medium text-white hover:bg-orange-700 transition"
          >
            See plans
          </Link>
        </section>
      ) : (
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm uppercase tracking-wide text-gray-400">
                Current plan
              </p>
              <p className="text-xl font-semibold text-gray-900 mt-1">
                {summary.planName ?? summary.planKey}
              </p>
              <p className="text-gray-500 mt-1">
                {summary.lessonsPerWeek} lesson
                {summary.lessonsPerWeek === 1 ? "" : "s"} a week
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm uppercase tracking-wide text-gray-400">
                Left to book
              </p>
              <p className="text-3xl font-semibold text-orange-600 mt-1 tabular-nums">
                {summary.balance % 1 === 0
                  ? summary.balance
                  : summary.balance.toFixed(1)}
              </p>
              <p className="text-gray-500 text-sm">
                {summary.usedThisWeek} used this week
              </p>
            </div>
          </div>

          {summary.status === "past_due" && (
            <p className="mt-5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-amber-900 text-sm">
              We couldn&apos;t take your last payment, so new lessons are paused.
              Lessons you already have still work — update your card to start
              them again.
            </p>
          )}

          {summary.cancelAtPeriodEnd && summary.currentPeriodEnd && (
            <p className="mt-5 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-gray-700 text-sm">
              Your plan ends on {formatDate(summary.currentPeriodEnd)}. You can
              keep booking until then.
            </p>
          )}

          <div className="mt-6 flex gap-3 flex-wrap">
            <Link
              href="/book"
              className="rounded-xl bg-orange-600 px-5 py-2.5 font-medium text-white hover:bg-orange-700 transition"
            >
              Book a lesson
            </Link>
            <Link
              href="/student/sessions"
              className="rounded-xl border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Upcoming lessons
            </Link>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-medium text-gray-900 mb-3">
          Lesson history
        </h2>

        {history.length === 0 ? (
          <p className="text-gray-500">Nothing here yet.</p>
        ) : (
          <ul className="rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
            {history.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-gray-900 truncate">
                    {REASON_LABEL[row.reason] ?? row.reason}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {formatDate(row.created_at)}
                    {row.note ? ` · ${row.note}` : ""}
                  </p>
                </div>
                <span
                  className={`shrink-0 font-medium tabular-nums ${
                    row.delta > 0 ? "text-emerald-600" : "text-gray-500"
                  }`}
                >
                  {row.delta > 0 ? "+" : ""}
                  {Number(row.delta) % 1 === 0
                    ? Number(row.delta)
                    : Number(row.delta).toFixed(1)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
