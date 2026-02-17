// src/components/dashboard/streak-card.tsx

"use client";

import { Flame, Shield, AlertTriangle } from "lucide-react";
import { isStreakAtRisk, getStreakMessage } from "@/lib/utils/streak";

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
}

export function StreakCard({ currentStreak, longestStreak, lastActivityDate }: StreakCardProps) {
  const atRisk = isStreakAtRisk(lastActivityDate);
  const message = getStreakMessage(currentStreak, atRisk);
  
  // Determine if user has studied today
  const today = new Date().toISOString().split("T")[0];
  const studiedToday = lastActivityDate === today;

  return (
    <div className={`bg-white rounded-2xl shadow-soft p-6 ${atRisk ? "ring-2 ring-orange-300" : ""}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-heading font-bold text-primary">
          Daily Streak
        </h2>
        {studiedToday && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
            ✓ Done today
          </span>
        )}
      </div>

      {/* Main Streak Display */}
      <div className="flex items-center gap-4 mb-4">
        <div className={`relative ${currentStreak > 0 ? "animate-pulse" : ""}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            atRisk 
              ? "bg-orange-100" 
              : currentStreak > 0 
                ? "bg-gradient-to-br from-orange-400 to-red-500" 
                : "bg-gray-100"
          }`}>
            <Flame className={`w-8 h-8 ${
              atRisk 
                ? "text-orange-500" 
                : currentStreak > 0 
                  ? "text-white" 
                  : "text-gray-400"
            }`} />
          </div>
          {/* Streak number badge */}
          {currentStreak > 0 && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center">
              <span className="text-xs font-bold text-orange-500">{currentStreak}</span>
            </div>
          )}
        </div>
        
        <div>
          <div className="text-3xl font-bold text-gray-900">
            {currentStreak} <span className="text-lg font-normal text-gray-500">days</span>
          </div>
          <p className="text-sm text-gray-500">{message}</p>
        </div>
      </div>

      {/* Streak Warning */}
      {atRisk && currentStreak > 0 && (
        <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg mb-4">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <span className="text-sm text-orange-700">
            Don&apos;t lose your {currentStreak}-day streak!
          </span>
        </div>
      )}

      {/* Week Progress */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">This week</p>
        <div className="flex gap-1">
          {generateWeekDays(lastActivityDate).map((day, index) => (
            <div
              key={index}
              className={`flex-1 h-8 rounded flex items-center justify-center text-xs font-medium ${
                day.isToday
                  ? day.completed
                    ? "bg-green-500 text-white"
                    : "bg-orange-100 text-orange-600 ring-2 ring-orange-300"
                  : day.completed
                    ? "bg-green-100 text-green-700"
                    : day.isPast
                      ? "bg-red-50 text-red-400"
                      : "bg-gray-100 text-gray-400"
              }`}
              title={day.label}
            >
              {day.initial}
            </div>
          ))}
        </div>
      </div>

      {/* Longest Streak */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-gray-500">
          <Shield className="w-4 h-4" />
          <span className="text-sm">Longest streak</span>
        </div>
        <span className="font-bold text-gray-900">{longestStreak} days</span>
      </div>
    </div>
  );
}

// Helper function to generate week days
function generateWeekDays(lastActivityDate: string | null) {
  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  const currentDay = today.getDay();
  
  // Get the start of this week (Sunday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDay);
  startOfWeek.setHours(0, 0, 0, 0);

  const lastActivity = lastActivityDate ? new Date(lastActivityDate) : null;
  if (lastActivity) lastActivity.setHours(0, 0, 0, 0);

  return days.map((initial, index) => {
    const dayDate = new Date(startOfWeek);
    dayDate.setDate(startOfWeek.getDate() + index);
    dayDate.setHours(0, 0, 0, 0);

    const isToday = index === currentDay;
    const isPast = dayDate < today && !isToday;
    
    // Check if this day has activity
    // For simplicity, we only know about the last activity date
    // A full implementation would track all activity dates
    const completed = lastActivity && 
      dayDate.getTime() === lastActivity.getTime();

    return {
      initial,
      label: dayNames[index],
      isToday,
      isPast,
      completed,
    };
  });
}