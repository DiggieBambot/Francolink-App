import type { ReactNode } from "react";
import type { LevelTheme } from "@/lib/lessons/level-theme";

interface SectionCardProps {
  theme?: LevelTheme;
  children: ReactNode;
  className?: string;
}

/**
 * Visual wrapper for every lesson section. Adds a thin level-themed top stripe
 * so the level color is constantly visible as you scroll through the lesson,
 * not just in the hero.
 */
export function SectionCard({ theme, children, className = "" }: SectionCardProps) {
  const stripe = theme?.topStripe ?? "bg-slate-300";
  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${className}`}
    >
      <div className={`h-1 w-full ${stripe}`} />
      <div className="p-6">{children}</div>
    </div>
  );
}
