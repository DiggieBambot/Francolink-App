"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bot, Crown } from "lucide-react";
import Link from "next/link";

interface AITutorFabProps {
  plan: string;
}

export function AITutorFab({ plan }: AITutorFabProps) {
  const isPaid = plan === "PREMIUM" || plan === "PREMIUM_PLUS";
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Tooltip */}
      {showTooltip && !isPaid && (
        <div className="absolute bottom-16 right-0 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
          <div className="flex items-center gap-1.5">
            <Crown className="w-3 h-3 text-amber-400" />
            Upgrade to use AI Tutor
          </div>
          <div className="absolute -bottom-1 right-5 w-2 h-2 bg-gray-900 rotate-45" />
        </div>
      )}

      <Link
        href={isPaid ? "/student/ai-tutor" : "/upgrade-plus"}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 animate-bounce-slow ring-4 ring-white"
        aria-label="AI Tutor"
      >
        <Bot className="w-7 h-7" />

        {/* Online dot */}
        {isPaid && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
        )}

        {/* Lock icon for free users */}
        {!isPaid && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 border-2 border-white rounded-full flex items-center justify-center">
            <Crown className="w-2.5 h-2.5 text-white" />
          </span>
        )}
      </Link>
    </div>
  );
}
