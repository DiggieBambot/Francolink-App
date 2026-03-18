"use client";
import { getLevelTheme } from "@/lib/level-colors";

interface LevelBadgeProps { level: string; size?: "sm"|"md"|"lg"; showLabel?: boolean; className?: string; }
const sizeMap = {
  sm: { badge:"px-2 py-0.5 text-xs font-bold", dot:"w-1.5 h-1.5", label:"text-xs" },
  md: { badge:"px-3 py-1 text-sm font-bold", dot:"w-2 h-2", label:"text-sm" },
  lg: { badge:"px-4 py-1.5 text-base font-bold", dot:"w-2.5 h-2.5", label:"text-sm" },
};

export function LevelBadge({ level, size="md", showLabel=false, className="" }: LevelBadgeProps) {
  const theme = getLevelTheme(level);
  const s = sizeMap[size];
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className={`inline-flex items-center gap-1.5 rounded-full ${s.badge} tracking-wider`}
        style={{ backgroundColor: theme.badge, color: theme.badgeText, boxShadow: theme.glow }}>
        <span className={`${s.dot} rounded-full flex-shrink-0`} style={{ backgroundColor:"rgba(255,255,255,0.6)" }} />
        {theme.level}
      </span>
      {showLabel && <span className={`${s.label} font-medium`} style={{ color: theme.text }}>{theme.label}</span>}
    </div>
  );
}

export function LevelTag({ level, className="" }: { level: string; className?: string }) {
  const theme = getLevelTheme(level);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold tracking-widest uppercase ${className}`}
      style={{ backgroundColor: theme.bg, color: theme.text, border: `1px solid ${theme.border}` }}>
      {theme.level}
    </span>
  );
}
