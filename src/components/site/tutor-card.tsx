import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, MapPin } from "lucide-react";
import type { TutorCard as TutorCardData } from "@/lib/site/queries";
import { LANGUAGE_LABEL, formatRate } from "@/lib/site/format";

export function TutorCard({ tutor }: { tutor: TutorCardData }) {
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
            className="w-18 h-18 rounded-2xl object-cover shrink-0"
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
          {tutor.headline && (
            <p className="text-sm text-gray-600 line-clamp-2 mt-1">
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
        {tutor.trial_available && (
          <span className="px-2.5 py-1 rounded-lg bg-success-light text-green-700 text-xs font-semibold inline-flex items-center gap-1">
            <BadgeCheck className="w-3.5 h-3.5" />
            Free trial
          </span>
        )}
      </div>

      <div className="mt-auto px-6 py-4 border-t border-gray-50 flex items-center justify-between">
        <div className="text-sm">
          {tutor.hourly_rate_cents != null ? (
            <>
              <span className="font-heading font-extrabold text-primary text-lg">
                {formatRate(tutor.hourly_rate_cents, tutor.currency)}
              </span>
              <span className="text-gray-500"> / hour</span>
            </>
          ) : (
            <span className="text-gray-500">Rate on request</span>
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
