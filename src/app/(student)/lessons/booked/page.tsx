// Where Stripe returns after a successful payment.
//
// The webhook is what actually confirms a booking — this page must never do
// it, because a student closing the tab before the redirect would then never
// get their lesson. If the webhook hasn't landed yet the page says so rather
// than pretending something failed.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarPlus, CheckCircle2, Clock, Loader2, Video } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  googleCalendarUrl,
  outlookCalendarUrl,
  toCalendarEvent,
} from "@/lib/booking/calendar";
import { APP_URL, SITE_URL } from "@/lib/site/hosts";

export const metadata: Metadata = {
  title: "Lesson booked | FrancoLink",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function BookedPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  if (!id) redirect("/dashboard");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // booking_details, not bookings: the base table is service-role only since
  // 20260826_pay_visibility.sql, and the view masks tutor_pay_cents away from
  // the student while still showing them what they paid.
  const { data: booking } = await supabase
    .from("booking_details")
    .select(
      `id, starts_at, ends_at, status, duration_minutes, price_cents, currency,
       is_trial, room_session_id, tutor_id, student_id`
    )
    .eq("id", id)
    .maybeSingle();

  // The view only returns rows the caller is a participant on; a stranger
  // sees a 404.
  if (!booking) notFound();

  // Fetched separately rather than embedded: PostgREST can infer the join
  // through a view, but relying on that makes the page break silently if the
  // view is ever rebuilt without the FK column.
  const { data: tutor } = await supabase
    .from("users")
    .select("name")
    .eq("id", booking.tutor_id)
    .maybeSingle();
  const tutorName = tutor?.name ?? "your tutor";

  const event = toCalendarEvent(
    {
      id: booking.id,
      starts_at: booking.starts_at,
      ends_at: booking.ends_at,
      status: booking.status,
      duration_minutes: booking.duration_minutes,
      tutor_name: tutorName,
      room_url: booking.room_session_id
        ? `${APP_URL}/room/${booking.room_session_id}`
        : null,
    },
    "student",
    APP_URL
  );

  const confirmed = booking.status === "confirmed";

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="text-center mb-8">
        {confirmed ? (
          <>
            <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto mb-4" />
            <h1 className="font-heading font-extrabold text-2xl text-primary">
              Your lesson is booked
            </h1>
          </>
        ) : (
          <>
            <Loader2 className="w-14 h-14 text-primary animate-spin mx-auto mb-4" />
            <h1 className="font-heading font-extrabold text-2xl text-primary">
              Confirming your payment…
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              This usually takes a few seconds. Refresh if it doesn&apos;t update
              — your slot is held either way.
            </p>
          </>
        )}
      </div>

      <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-soft space-y-3">
        <p className="flex items-center gap-2 font-heading font-bold text-primary">
          <Clock className="w-4 h-4 text-secondary" />
          {new Date(booking.starts_at).toLocaleString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <p className="text-sm text-gray-600">
          {booking.duration_minutes}-minute lesson with{" "}
          <strong className="text-primary">{tutorName}</strong>
          {booking.is_trial && " — your discounted first lesson"}
        </p>
        <p className="text-xs text-gray-500">
          Times shown in your device&apos;s timezone. Free cancellation up to 12
          hours before the lesson.
        </p>
      </div>

      {confirmed && (
        <>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <a
              href={googleCalendarUrl(event)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-primary hover:border-primary"
            >
              <CalendarPlus className="w-4 h-4" />
              Add to Google Calendar
            </a>
            <a
              href={outlookCalendarUrl(event)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-primary hover:border-primary"
            >
              <CalendarPlus className="w-4 h-4" />
              Add to Outlook
            </a>
          </div>

          {booking.room_session_id && (
            <Link
              href={`/room/${booking.room_session_id}`}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-800"
            >
              <Video className="w-5 h-5" />
              Open your lesson room
            </Link>
          )}
        </>
      )}

      <div className="mt-6 flex items-center justify-center gap-4 text-sm">
        <Link href="/dashboard" className="font-semibold text-primary underline underline-offset-4">
          Go to your dashboard
        </Link>
        <a
          href={`${SITE_URL}/tutors`}
          className="text-gray-500 underline underline-offset-4"
        >
          Book another lesson
        </a>
      </div>
    </div>
  );
}
