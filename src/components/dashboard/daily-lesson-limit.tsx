'use client';

import { Zap, Infinity as InfinityIcon, Crown, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { LessonUsage } from '@/lib/utils/lesson-limits';

interface DailyLessonLimitProps {
  usage: LessonUsage;
}

export function DailyLessonLimit({ usage }: DailyLessonLimitProps) {
  const router = useRouter();

  // Premium+ users: top tier badge (no upsell)
  if (usage.plan === 'PREMIUM_PLUS') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-3">
        <Sparkles className="h-5 w-5 text-purple-500" />
        <span className="text-sm font-medium text-purple-700">
          Premium+ Member
        </span>
      </div>
    );
  }

  // Premium users: show status + gentle upsell to Premium+
  if (usage.plan === 'PREMIUM') {
    return (
      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="h-5 w-5 text-indigo-500" />
          <span className="text-sm font-medium text-indigo-700">
            Premium Member
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-indigo-600">
          <InfinityIcon className="h-4 w-4" />
          <span>Unlimited lessons</span>
        </div>
        <button
          onClick={() => router.push('/pricing')}
          className="mt-3 w-full rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          <span className="flex items-center justify-center gap-1">
            <Sparkles className="h-3 w-3" />
            Upgrade to Premium+ for 60 min AI Tutor
          </span>
        </button>
      </div>
    );
  }

  // Free users: show usage + upgrade prompt
  const pct = Math.round((usage.used / usage.limit) * 100);
  const atLimit = usage.remaining === 0;
  const almostDone = usage.remaining === 1;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className={`h-5 w-5 ${atLimit ? 'text-red-500' : 'text-amber-500'}`} />
          <span className="text-sm font-semibold text-gray-900">
            Daily Lessons
          </span>
        </div>
        <span className="text-xs font-medium text-gray-500">
          {usage.used} / {usage.limit}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            atLimit
              ? 'bg-red-500'
              : almostDone
                ? 'bg-amber-500'
                : 'bg-indigo-500'
          }`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      {/* Status text */}
      {atLimit ? (
        <div className="space-y-2">
          <p className="text-xs text-red-600">
            You&apos;ve used all {usage.limit} free lessons today.
          </p>
          <button
            onClick={() => router.push('/pricing')}
            className="w-full rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Go Premium for Unlimited
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            {usage.remaining} lesson{usage.remaining !== 1 ? 's' : ''} remaining today
          </p>
          <button
            onClick={() => router.push('/pricing')}
            className="w-full rounded-lg border border-indigo-200 bg-indigo-50 py-2 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
          >
            Go Premium for Unlimited
          </button>
        </div>
      )}
    </div>
  );
}