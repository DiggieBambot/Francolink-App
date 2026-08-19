// Handoff from the website's slot picker into checkout.
//
// This lives on the app host on purpose: the Supabase session cookie belongs
// here, so the booking call is first-party. Doing it from francolink.net would
// need third-party cookies, which Safari blocks and Chrome is phasing out.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookingHandoff } from "@/components/booking/booking-handoff";
import { BOOKING_DURATIONS } from "@/lib/booking/availability";
import { SITE_URL } from "@/lib/site/hosts";

export const metadata: Metadata = {
  title: "Confirming your lesson | FrancoLink",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    tutor?: string;
    start?: string;
    duration?: string;
    from?: string;
  }>;
}

export default async function BookPage({ searchParams }: PageProps) {
  const { tutor, start, duration, from } = await searchParams;

  const durationMinutes = Number(duration);
  const valid =
    tutor &&
    start &&
    !Number.isNaN(Date.parse(start)) &&
    BOOKING_DURATIONS.includes(durationMinutes);

  // Nothing usable to book — send them back to the directory rather than
  // showing a broken confirmation screen.
  if (!valid) redirect(`${SITE_URL}/tutors`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Come back here after signing in, with the slot intact.
    const self = `/book?tutor=${encodeURIComponent(tutor)}&start=${encodeURIComponent(
      start
    )}&duration=${durationMinutes}${from ? `&from=${encodeURIComponent(from)}` : ""}`;
    redirect(`/login?next=${encodeURIComponent(self)}`);
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <BookingHandoff
        tutorSlug={tutor}
        start={start}
        durationMinutes={durationMinutes}
        backUrl={from || `${SITE_URL}/tutors/${tutor}`}
      />
    </div>
  );
}
