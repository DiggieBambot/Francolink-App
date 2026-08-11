import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, MapPin } from "lucide-react";
import type { TutorCard as TutorCardData } from "@/lib/site/queries";
import { LANGUAGE_LABEL } from "@/lib/site/format";
import {
  TIER_LABEL,
  cheapestLesson,
  formatPrice,
  type TierPricing,
} from "@/lib/site/pricing";
import { cn } from "@/lib/utils";

const TIER_STYLE: Record<string, string> = {
  professional: "bg-primary text-white",
  certified: "bg-primary-50 text-primary",
  community: "bg-gray-100 text-gray-600",
};

export function TutorCard({
  tutor,
  pricing,
}: {
  tutor: TutorCardData;
  /** Price list for this tutor's tier. FrancoLink sets it, the tutor doesn't. */
  pricing?: TierPricing;
}) {
  const from = cheapestLesson(pricing);

  return (
    <Link
      href={`/tutors/${tutor.slug}`}
      className="group flex flex-col bg-white rounded-2xl border border-gray-100 shadow-soft hover:shadow-medium hover:border-primary-100 transition-all overflow-hidden"
    >
      <div className="p-6 flex items-start gap-4">
        {tutor.photo_url ? (
          <Image
            src={tutor.photo_url}
            alt={tutor.name}
            width={72}
            height={72}
            unoptimized
            className="w-[72px] h-[72px] rounded-2xl object-cover shrink-0"
          />
        ) : (
          <div className="w-[72px] h-[72px] rounded-2xl bg-primary flex items-center justify-center text-2xl font-heading font-extrabold text-white shrink-0">
            {tutor.name.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="min-w-0">
          <h3 className="font-heading font-bold text-lg text-primary truncate">
            {tutor.name}
          </h3>
          <span
            className={cn(
              "inline-block mt-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide",
              TIER_STYLE[tutor.tier] ?? TIER_STYLE.community
            )}
          >
            {TIER_LABEL[tutor.tier]}
          </span>
          {tutor.headline && (
            <p className="text-sm text-gray-600 line-clamp-2 mt-2">
              {tutor.headline}
            </p>
          )}
          {tutor.country && (
            <p className="mt-2 flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="w-3.5 h-3.5" />
              {tutor.country}
            </p>
          )}
        </div>
      </div>

      <div className="px-6 pb-5 flex flex-wrap gap-2">
        {tutor.teaches.slice(0, 3).map((code) => (
          <span
            key={code}
            className="px-2.5 py-1 rounded-lg bg-primary-50 text-primary text-xs font-semibold"
          >
            {LANGUAGE_LABEL[code] ?? code.toUpperCase()}
          </span>
        ))}
        {tutor.levels.length > 0 && (
          <span className="px-2.5 py-1 rounded-lg bg-secondary-50 text-secondary-700 text-xs font-semibold">
            {tutor.levels[0]}–{tutor.levels[tutor.levels.length - 1]}
          </span>
        )}
        {tutor.trial_available && pricing?.trial && (
          <span className="px-2.5 py-1 rounded-lg bg-success-light text-green-700 text-xs font-semibold inline-flex items-center gap-1">
            <BadgeCheck className="w-3.5 h-3.5" />
            Trial {formatPrice(pricing.trial.priceCents, pricing.trial.currency)}
          </span>
        )}
      </div>

      <div className="mt-auto px-6 py-4 border-t border-gray-50 flex items-center justify-between">
        <div className="text-sm">
          {from ? (
            <>
              <span className="text-gray-500">from </span>
              <span className="font-heading font-extrabold text-primary text-lg">
                {formatPrice(from.priceCents, from.currency)}
              </span>
              <span className="text-gray-500"> / {from.durationMinutes} min</span>
            </>
          ) : (
            <span className="text-gray-500">See lesson prices</span>
          )}
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-bold text-primary group-hover:gap-2 transition-all">
          View profile
          <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
}
