import Image from "next/image";
import Link from "next/link";
import { Award, BadgeCheck, GraduationCap, MapPin, Sparkles } from "lucide-react";
import type { TutorCard as TutorCardData } from "@/lib/site/queries";
import { LANGUAGE_LABEL } from "@/lib/site/format";
import { appUrl } from "@/lib/site/hosts";
import { cn } from "@/lib/utils";

/**
 * The ribbon across the corner of the card. Two tiers in practice —
 * Professional and Community — with Certified kept as a fallback so an older
 * row can't render a blank ribbon.
 */
const TIER_RIBBON: Record<string, string> = {
  professional: "bg-secondary text-primary-900",
  certified: "bg-primary-100 text-primary",
  community: "bg-primary text-white",
};

const TIER_SHORT: Record<string, string> = {
  professional: "Professional",
  certified: "Certified",
  community: "Community",
};

/**
 * A directory row, in the shape marketplaces like italki use: photo on the
 * left, everything you'd filter on in the middle, the two actions pinned to
 * the right. It stays a box (border + shadow) rather than a bare list row so
 * one tutor never bleeds into the next on a long page.
 *
 * Deliberately no prices here. Lesson prices are set per tier, not per tutor,
 * so a price on the card invites a comparison that doesn't exist — the visitor
 * either reserves a lesson or registers, and sees the price at checkout.
 */
export function TutorCard({ tutor }: { tutor: TutorCardData }) {
  const languages = tutor.teaches.map((c) => LANGUAGE_LABEL[c] ?? c.toUpperCase());
  const profileHref = `/tutors/${tutor.slug}`;

  return (
    <article className="group relative bg-white rounded-2xl border border-gray-100 shadow-soft hover:shadow-medium hover:border-primary-100 transition-all overflow-hidden">

      <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5 sm:gap-6">
        {/* ------------------------------------------------------------ PHOTO */}
        <Link
          href={profileHref}
          className="relative shrink-0 self-start rounded-2xl overflow-hidden"
        >
          {tutor.photo_url ? (
            <Image
              src={tutor.photo_url}
              alt={tutor.name}
              width={128}
              height={128}
              unoptimized
              className="w-28 h-28 sm:w-32 sm:h-32 object-cover"
            />
          ) : (
            <div className="w-28 h-28 sm:w-32 sm:h-32 bg-primary flex items-center justify-center text-4xl font-heading font-extrabold text-white">
              {tutor.name.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Tier ribbon across the foot of the photo. It sits on the person it
              describes, so it can't collide with the buttons on the right, and
              it lands in the same place on every row — the list can be scanned
              by tier alone. */}
          <span
            className={cn(
              "absolute inset-x-0 bottom-0 py-1 text-center text-[10px] font-heading font-extrabold uppercase tracking-wide",
              TIER_RIBBON[tutor.tier] ?? TIER_RIBBON.community
            )}
          >
            {TIER_SHORT[tutor.tier] ?? TIER_SHORT.community}
          </span>
        </Link>

        {/* ------------------------------------------------------------- INFO */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Link href={profileHref} className="min-w-0">
              <h3 className="font-heading font-bold text-xl text-primary truncate group-hover:underline underline-offset-4">
                {tutor.name}
              </h3>
            </Link>
            {tutor.trial_available && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-success-light text-green-700 text-[11px] font-bold">
                <BadgeCheck className="w-3.5 h-3.5" />
                First lesson available
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-500">
            {tutor.country && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-secondary" />
                {tutor.country}
              </span>
            )}
            {tutor.years_experience != null && (
              <span className="inline-flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-secondary" />
                {tutor.years_experience} years teaching
              </span>
            )}
          </div>

          {tutor.headline && (
            <p className="mt-3 text-sm text-gray-600 leading-relaxed line-clamp-2">
              {tutor.headline}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {languages.map((label) => (
              <span
                key={label}
                className="px-2.5 py-1 rounded-lg bg-primary-50 text-primary text-xs font-semibold"
              >
                {label}
              </span>
            ))}
            {tutor.levels.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary-50 text-secondary-700 text-xs font-semibold">
                <GraduationCap className="w-3 h-3" />
                {tutor.levels[0]}–{tutor.levels[tutor.levels.length - 1]}
              </span>
            )}
            {tutor.specialties.slice(0, 3).map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary-50 text-secondary-700 text-xs font-semibold"
              >
                <Sparkles className="w-3 h-3" />
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* ---------------------------------------------------------- ACTIONS */}
        <div className="sm:w-52 shrink-0 flex flex-col gap-2.5 sm:border-l sm:border-gray-50 sm:pl-6 sm:justify-center">
          <Link
            href={`${profileHref}#book`}
            className="w-full text-center px-4 py-3 rounded-xl bg-primary text-white font-heading font-bold text-sm hover:bg-primary-600 transition-colors"
          >
            Reserve a lesson
          </Link>
          <a
            href={appUrl("/signup")}
            className="w-full text-center px-4 py-3 rounded-xl border-2 border-primary-100 text-primary font-heading font-bold text-sm hover:bg-primary-50 transition-colors"
          >
            Register free
          </a>
          <Link
            href={profileHref}
            className="text-center text-xs font-semibold text-gray-500 hover:text-primary"
          >
            View full profile
          </Link>
        </div>
      </div>
    </article>
  );
}
