"use client";

interface LessonProgressBarProps {
  currentPhase: string;
  phases: string[];
  phaseProgress?: number;
  level?: string;
}

const LEVEL_COLORS: Record<string, { bar: string; glow: string }> = {
  A1: { bar: "linear-gradient(90deg,#1D4ED8,#3B82F6)", glow: "rgba(59,130,246,0.4)" },
  A2: { bar: "linear-gradient(90deg,#0E7490,#06B6D4)", glow: "rgba(6,182,212,0.4)" },
  B1: { bar: "linear-gradient(90deg,#B45309,#F59E0B)", glow: "rgba(245,158,11,0.4)" },
  B2: { bar: "linear-gradient(90deg,#C2410C,#F97316)", glow: "rgba(249,115,22,0.4)" },
  C1: { bar: "linear-gradient(90deg,#B91C1C,#EF4444)", glow: "rgba(239,68,68,0.4)" },
  C2: { bar: "linear-gradient(90deg,#7E22CE,#A855F7)", glow: "rgba(168,85,247,0.4)" },
};

export default function LessonProgressBar({
  currentPhase,
  phases,
  phaseProgress = 0,
  level = "B2",
}: LessonProgressBarProps) {
  const currentPhaseIndex = phases.indexOf(currentPhase);
  const phaseWeight = 100 / phases.length;
  const totalProgress = Math.round(currentPhaseIndex * phaseWeight + (phaseProgress / 100) * phaseWeight);
  const lv = LEVEL_COLORS[level?.toUpperCase()] || LEVEL_COLORS["B2"];

  return (
    <div className="w-full">
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${totalProgress}%`, background: lv.bar, boxShadow: totalProgress > 0 ? `0 0 8px ${lv.glow}` : "none" }}
        />
      </div>
      <div className="flex justify-between items-center mt-1.5 text-xs">
        <span className="text-gray-400 capitalize">{currentPhase.replace(/-/g, ' ')}</span>
        <span className="text-gray-600 font-medium">{totalProgress}%</span>
      </div>
    </div>
  );
}