import Image from "next/image";
import { Clock, Layers } from "lucide-react";
import { getLevelTheme } from "@/lib/lessons/level-theme";
import { CATEGORY_BY_SLUG } from "@/lib/lessons/categories";
import type { CatalogueLesson } from "@/lib/lessons/public-queries";
import { PickLink } from "./pick-link";

// Tags that describe level/type rather than the lesson's actual concept.
const STOP_TAGS = new Set([
  "grammar", "grammaire", "a1", "a2", "b1", "b2", "c1", "c2",
  "verbs", "verb", "present tense", "présent", "conjugation", "pronunciation",
]);

function conceptLabel(tags: string[]): string | null {
  for (const t of tags) if (!STOP_TAGS.has(t.trim().toLowerCase())) return t;
  return null;
}

// What kind of grammar point this is, for the small caption under the concept
// name on the card — checked in order, first match wins.
const SUBTITLE_RULES: { test: (tags: string[]) => boolean; label: string }[] = [
  { test: (t) => t.includes("verbs") || t.includes("verb"), label: "Conjugaison" },
  { test: (t) => t.includes("agreement"), label: "Accord" },
  { test: (t) => t.includes("partitive") || t.includes("articles"), label: "Articles" },
  { test: (t) => t.includes("gender") || t.includes("plural"), label: "Genre & nombre" },
  { test: (t) => t.includes("negation"), label: "Négation" },
  { test: (t) => t.includes("questions"), label: "Questions" },
  { test: (t) => t.includes("possessives"), label: "Possessifs" },
  { test: (t) => t.includes("prepositions"), label: "Prépositions" },
  { test: (t) => t.includes("il y a"), label: "Expression" },
];

function grammarSubtitle(tags: string[]): string {
  const lower = tags.map((t) => t.trim().toLowerCase());
  return SUBTITLE_RULES.find((r) => r.test(lower))?.label ?? "Grammaire";
}

/** Decorative tile shown when a lesson has no hero photo (e.g. grammar). */
function PlaceholderArt({
  lesson,
  gradient,
  emoji,
}: {
  lesson: CatalogueLesson;
  gradient: string;
  emoji?: string;
}) {
  const hay = `${lesson.category} ${lesson.topic_tags.join(" ")}`.toLowerCase();
  const isGrammar = /grammar|grammaire/.test(hay);
  const concept = isGrammar ? conceptLabel(lesson.topic_tags) : null;

  return (
    <div className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br ${gradient}`}>
      {/* faint conjugation-ruled motif */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 200" fill="none" aria-hidden="true">
        <g stroke="#fff" strokeOpacity="0.12" strokeWidth="1.5">
          <line x1="24" y1="52" x2="296" y2="52" />
          <line x1="24" y1="90" x2="296" y2="90" />
          <line x1="24" y1="128" x2="296" y2="128" />
          <line x1="120" y1="34" x2="120" y2="146" />
        </g>
        <g fill="#fff" fillOpacity="0.10" fontFamily="Georgia, serif" fontStyle="italic">
          <text x="250" y="176" fontSize="90">é</text>
        </g>
      </svg>
      {/* readability scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />

      {concept ? (
        <div className="relative text-center">
          <span className="block font-heading text-[2rem] font-black italic leading-none text-white drop-shadow-sm">
            {concept}
          </span>
          <span className="mt-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">
            {grammarSubtitle(lesson.topic_tags)}
          </span>
        </div>
      ) : (
        <span className="relative text-4xl opacity-60 drop-shadow-sm">{emoji ?? "🇫🇷"}</span>
      )}
    </div>
  );
}

export function LessonCard({ lesson, sequence }: { lesson: CatalogueLesson; sequence?: number }) {
  const t = getLevelTheme(lesson.level);
  const cat = CATEGORY_BY_SLUG[lesson.category];
  const gradient = cat?.gradient ?? "from-slate-500 to-slate-700";
  const concept = /grammar|grammaire/.test(`${lesson.category} ${lesson.topic_tags.join(" ")}`.toLowerCase())
    ? conceptLabel(lesson.topic_tags)
    : null;

  return (
    <PickLink
      href={`/library/lesson/${lesson.slug}`}
      slug={lesson.slug}
      title={lesson.title}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-gray-100 transition duration-300 hover:-translate-y-1 hover:shadow-medium hover:ring-primary-200 dark:bg-gray-800 dark:ring-gray-700"
    >
      <div className="relative aspect-[16/10] w-full bg-gray-100">
        {lesson.hero_image_url ? (
          <Image
            src={lesson.hero_image_url}
            alt={lesson.title}
            fill
            sizes="(max-width:640px) 100vw, 320px"
            className="object-contain transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="h-full transition duration-500 group-hover:scale-[1.04]">
            <PlaceholderArt lesson={lesson} gradient={gradient} emoji={cat?.emoji} />
          </div>
        )}
        <span className={`absolute left-2 top-2 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase text-white shadow ${t.accentBg}`}>
          {lesson.level}
        </span>
        {sequence != null ? (
          <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white shadow backdrop-blur-sm">
            Lesson {sequence}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-heading font-bold leading-snug text-primary dark:text-primary-200">{lesson.title}</h3>
        {lesson.title_translation ? (
          <p className="mt-0.5 line-clamp-1 text-xs text-gray-500 dark:text-gray-400">{lesson.title_translation}</p>
        ) : null}

        <div className="mt-auto flex items-center gap-2 pt-3 text-xs text-gray-500 dark:text-gray-400">
          {concept ? (
            <span className="rounded-full bg-primary-50 px-2 py-0.5 font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              {concept}
            </span>
          ) : null}
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
