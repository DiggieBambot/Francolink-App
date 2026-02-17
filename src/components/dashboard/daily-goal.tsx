"use client";

import { Flame, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyGoalProps {
  targetMinutes: number;
  completedMinutes: number;
}

export function DailyGoal({ targetMinutes, completedMinutes }: DailyGoalProps) {
  const percentage = Math.min((completedMinutes / targetMinutes) * 100, 100);
  const isComplete = completedMinutes >= targetMinutes;

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-heading font-bold text-primary">
          Daily Goal
        </h2>
        <div
          className={cn(
            "flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium",
            isComplete
              ? "bg-success-light text-green-700"
              : "bg-secondary-100 text-secondary-700"
          )}
        >
          {isComplete ? (
            <>
              <Check className="w-4 h-4" />
              Complete!
            </>
          ) : (
            <>
              <Flame className="w-4 h-4" />
              In Progress
            </>
          )}
        </div>
      </div>

      {/* Circular Progress */}
      <div className="flex items-center justify-center py-4">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="12"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke={isComplete ? "#22c55e" : "#f48c17"}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${percentage * 3.52} 352`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-heading font-bold text-primary">
              {completedMinutes}
            </span>
            <span className="text-sm text-gray-500">/ {targetMinutes} min</span>
          </div>
        </div>
      </div>

      <p className="text-center text-gray-600">
        {isComplete
          ? "Great job! You've reached your daily goal! 🎉"
          : `${targetMinutes - completedMinutes} more minutes to reach your goal!`}
      </p>
    </div>
  );
}