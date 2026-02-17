'use client';

import { useRouter } from 'next/navigation';
import { Lock, Zap, Clock, X, Crown } from 'lucide-react';
import { type DenialReason } from '@/lib/utils/lesson-limits';

// ─── Content map per denial reason ──────────────────────────────

interface ModalContent {
  icon: React.ReactNode;
  title: string;
  bullets: string[];
}

const CONTENT: Record<DenialReason, ModalContent> = {
  daily_limit_reached: {
    icon: <Clock className="h-10 w-10 text-amber-500" />,
    title: "You've hit your daily limit",
    bullets: [
      'Unlimited lessons every day',
      'Access all CEFR levels (A1–C2)',
      'AI conversation tutor (coming soon)',
      'No ads, ever',
    ],
  },
  premium_content: {
    icon: <Crown className="h-10 w-10 text-purple-500" />,
    title: 'This is Premium content',
    bullets: [
      'Unlock every lesson and unit',
      'Full curriculum from A1 to C2',
      'Priority support',
      'New content added weekly',
    ],
  },
  level_locked: {
    icon: <Lock className="h-10 w-10 text-red-500" />,
    title: 'Level locked',
    bullets: [
      'Unlock advanced levels (C1 & C2)',
      'Master-level grammar & vocabulary',
      'Unlimited daily lessons',
      'AI tutor for conversation practice',
    ],
  },
};

// ─── Component ──────────────────────────────────────────────────

interface UpgradeModalProps {
  /** Why access was denied */
  reason: DenialReason;
  /** Optional override message (from AccessCheckResult.message) */
  message?: string;
  /** Called when the user dismisses the modal. If omitted, "Go Back" uses router.back(). */
  onClose?: () => void;
  /** If true, render as a full-page overlay (no content behind it). Default false. */
  fullPage?: boolean;
}

export function UpgradeModal({
  reason,
  message,
  onClose,
  fullPage = false,
}: UpgradeModalProps) {
  const router = useRouter();
  const content = CONTENT[reason];

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  const card = (
    <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Icon */}
      <div className="mb-4 flex justify-center">{content.icon}</div>

      {/* Title */}
      <h2 className="mb-2 text-center text-xl font-bold text-gray-900">
        {content.title}
      </h2>

      {/* Message */}
      {message && (
        <p className="mb-6 text-center text-sm text-gray-500">{message}</p>
      )}

      {/* Benefits */}
      <div className="mb-8 space-y-3">
        <p className="text-sm font-semibold text-gray-700">
          Upgrade to Premium and get:
        </p>
        <ul className="space-y-2">
          {content.bullets.map((bullet, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <Zap className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
              {bullet}
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <button
        onClick={handleUpgrade}
        className="mb-3 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
      >
        View Premium Plans
      </button>

      <button
        onClick={handleClose}
        className="w-full rounded-xl py-3 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
      >
        {reason === 'daily_limit_reached' ? 'Come back tomorrow' : 'Maybe later'}
      </button>
    </div>
  );

  // Full-page mode: centered on a solid backdrop (used on lesson page gate)
  if (fullPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        {card}
      </div>
    );
  }

  // Overlay mode: semitransparent backdrop over existing content
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      {card}
    </div>
  );
}