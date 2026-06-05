import Image from "next/image";
import { Clock, Layers } from "lucide-react";
import { getLevelTheme } from "@/lib/lessons/level-theme";
import type { CatalogueLesson } from "@/lib/lessons/public-queries";
import { PickLink } from "./pick-link";

export function LessonCard({ lesson }: { lesson: CatalogueLesson }) {
  const t = getLevelTheme(lesson.level);
  return (
    <PickLink
      href={`/library/lesson/${lesson.slug}`}
      slug={lesson.slug}
      title={lesson.title}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-gray-100 transition duration-300 hover:-translate-y-1 hover:shadow-medium"
    >
      <div className="relative aspect-[16/10] w-full bg-gray-100">
        {lesson.hero_image_url ? (
          <Image
            src={lesson.hero_image_url}
            alt={lesson.title}
            fill
            sizes="(max-width:640px) 100vw, 320px"
            className="object-cover transition group-hover:scale-[1.03]"
          />
        ) : (
          <div className={`flex h-full items-center justify-center bg-gradient-to-br ${t.gradient ?? ""}`}>
            <span className="text-3xl opacity-40">🇫🇷</span>
          </div>
        )}
        <span className={`absolute left-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase text-white shadow ${t.accentBg}`}>
          {lesson.level}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-heading font-bold text-primary">{lesson.title}</h3>
        {lesson.title_translation ? (
          <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{lesson.title_translation}</p>
        ) : null}
        <div className="mt-auto flex items-center gap-3 pt-3 text-xs text-gray-500">
          {lesson.duration_minutes ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {lesson.duration_minutes} min
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <Layers className="h-3 w-3" /> {lesson.section_count} steps
          </span>
        </div>
      </div>
    </PickLink>
  );
}
