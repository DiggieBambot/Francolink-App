"use client";

// "Register free" on the website.
//
// It points at /start on the app host, not /signup. The difference is the
// whole funnel: /signup makes an account and drops the person on a dashboard
// with no plan, no credits and nothing to do; /start walks them through
// signup, onboarding, and a plan before handing them back to the tutor they
// came from.
//
// It also carries two things across the host boundary, because the website
// cannot write to the account itself:
//
//   next       the tutor they were looking at, so they land back here
//   shortlist  whatever they hearted, adopted into real favourites on arrival

import { appUrl } from "@/lib/site/hosts";
import { useShortlist, withShortlist } from "@/lib/site/shortlist";

export function RegisterCta({
  next,
  className,
  children = "Register free",
}: {
  next?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const { slugs } = useShortlist();
  const base = appUrl(next ? `/start?next=${encodeURIComponent(next)}` : "/start");

  return (
    <a href={withShortlist(base, slugs)} className={className}>
      {children}
    </a>
  );
}
