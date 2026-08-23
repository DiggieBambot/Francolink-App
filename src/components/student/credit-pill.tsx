// "3 lessons left this week" in the sidebar chrome.
//
// This is the number a subscriber checks constantly, so it belongs where they
// already are rather than behind a page visit. Renders nothing for students
// with no plan and no credits — an empty balance badge is just clutter for the
// self-study half of the audience.

import Link from "next/link";
import { creditSummary, formatCredits } from "@/lib/credits/ledger";

export async function CreditPill({ userId }: { userId: string }) {
  const summary = await creditSummary(userId);

  if (!summary.planKey && summary.balance <= 0) return null;

  const low = summary.balance <= 0;

  return (
    <Link
      href="/student/subscription"
      className={`mx-3 mb-2 block rounded-xl border px-3 py-2 transition ${
        low
          ? "border-gray-200 bg-gray-50 hover:bg-gray-100"
          : "border-orange-200 bg-orange-50 hover:bg-orange-100"
      }`}
    >
      <p className="text-[11px] uppercase tracking-wide text-gray-500">
        {summary.planName ?? "Lessons"}
      </p>
      <p
        className={`text-sm font-semibold tabular-nums ${
          low ? "text-gray-600" : "text-orange-700"
        }`}
      >
        {low ? "No lessons left" : `${formatCredits(summary.balance)} left`}
      </p>
    </Link>
  );
}
