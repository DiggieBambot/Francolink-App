"use client";
import { getLevelTheme } from "@/lib/level-colors";
import { LevelBadge } from "@/components/ui/LevelBadge";
import { BookOpen, Clock, Award } from "lucide-react";

interface CourseHeaderProps {
  course: { title: string; description?: string; level: string; estimated_hours?: number; language?: string };
  stats?: { completedLessons: number; totalLessons: number; percentage: number };
}
export function CourseHeader({ course, stats }: CourseHeaderProps) {
  const theme = getLevelTheme(course.level);
  const pct = stats?.percentage ?? 0;
  return (
    <div className="relative rounded-2xl overflow-hidden mb-6"
      style={{ background: theme.gradient, border: `1px solid ${theme.border}`, boxShadow: theme.glow }}>
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg,transparent,${theme.color},transparent)` }} />
      <div className="relative px-6 py-6">
        <div className="flex items-center gap-3 mb-4">
          {course.language === "French" && <span className="text-3xl">🇫🇷</span>}
          <LevelBadge level={course.level} size="lg" showLabel />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color:"#F8FAFF" }}>{course.title}</h1>
        {course.description && <p className="text-sm mb-5" style={{ color:`${theme.text}99` }}>{course.description}</p>}
        <div className="flex items-center gap-5 mb-5">
          {stats && <div className="flex items-center gap-1.5 text-sm" style={{ color:theme.text }}><BookOpen size={14}/><span>{stats.completedLessons} of {stats.totalLessons} lessons</span></div>}
          {course.estimated_hours && <div className="flex items-center gap-1.5 text-sm" style={{ color:theme.text }}><Clock size={14}/><span>{course.estimated_hours}h</span></div>}
          {pct >= 100 && <div className="flex items-center gap-1.5 text-sm" style={{ color:"#6EE7B7" }}><Award size={14}/><span>Completed!</span></div>}
        </div>
        <div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor:"rgba(255,255,255,0.1)" }}>
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width:`${pct}%`, background:`linear-gradient(90deg,${theme.colorDark}80,${theme.color})`, boxShadow: pct>0?`0 0 10px ${theme.color}80`:"none" }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs" style={{ color:`${theme.text}80` }}>{pct===0?"Ready to start":`${Math.round(pct)}% complete`}</span>
            <span className="text-xs font-semibold" style={{ color:theme.text }}>{Math.round(pct)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface UnitHeaderProps {
  unit: { title: string; description?: string; order_index: number };
  courseLevel: string;
  stats?: { completed: number; total: number };
}
export function UnitHeader({ unit, courseLevel, stats }: UnitHeaderProps) {
  const theme = getLevelTheme(courseLevel);
  const pct = stats ? Math.round((stats.completed/stats.total)*100) : 0;
  const isComplete = pct >= 100;
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl mb-3"
      style={{ background: isComplete?`${theme.color}18`:theme.bgLight, border:`1px solid ${isComplete?theme.border:"rgba(0,0,0,0.07)"}` }}>
      <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black"
        style={{ background:isComplete?theme.gradient:`${theme.color}22`, color:isComplete?theme.text:theme.colorDark, border:`1px solid ${theme.border}`, boxShadow:isComplete?theme.glow:"none" }}>
        {unit.order_index}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-gray-900 text-sm">{unit.title}</span>
          {isComplete && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor:`${theme.color}20`, color:theme.colorDark }}>✓ Done</span>}
        </div>
        {stats && <span className="text-xs text-gray-400">{stats.completed}/{stats.total} lessons</span>}
      </div>
      {stats && stats.total>0 && (
        <div className="flex-shrink-0 flex items-center gap-2">
          <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full" style={{ width:`${pct}%`, background:theme.color }} />
          </div>
          <span className="text-xs font-semibold w-8 text-right" style={{ color:theme.colorDark }}>{pct}%</span>
        </div>
      )}
    </div>
  );
}
