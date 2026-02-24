// src/components/learning/lesson-progress-bar.tsx
"use client";

interface LessonProgressBarProps {
  currentPhase: string;
  phases: string[];
  phaseProgress?: number; // 0-100 progress within current phase
}

export default function LessonProgressBar({
  currentPhase,
  phases,
  phaseProgress = 0,
}: LessonProgressBarProps) {
  // Calculate overall progress
  const currentPhaseIndex = phases.indexOf(currentPhase);
  const phaseWeight = 100 / phases.length;
  const completedPhasesProgress = currentPhaseIndex * phaseWeight;
  const currentPhaseContribution = (phaseProgress / 100) * phaseWeight;
  const totalProgress = Math.round(completedPhasesProgress + currentPhaseContribution);

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${totalProgress}%` }}
        />
      </div>
      
      {/* Progress text */}
      <div className="flex justify-between items-center mt-2 text-sm">
        <span className="text-gray-500 capitalize">
          {currentPhase.replace('-', ' ')}
        </span>
        <span className="text-gray-700 font-medium">
          {totalProgress}%
        </span>
      </div>
    </div>
  );
}