// A tutor's bookable hours. This page owns the calendar; the listing editor
// owns the profile content. Keeping them apart matters because saving hours is
// a full replace — two editors writing the same rows would clobber each other.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AvailabilityEditor } from "@/components/tutor/availability-editor";
import { safeTimezone } from "@/lib/booking/slots";

export const metadata: Metadata = { title: "Your availability | FrancoLink" };
export const dynamic = "force-dynamic";

export default async function TutorAvailabilityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("users")
    .select("role, timezone")
    .eq("id", user.id)
    .maybeSingle();
  const role = (me?.role || "").toUpperCase();
  if (role !== "TUTOR" && role !== "ADMIN") redirect("/dashboard");

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const [{ data: rules }, { data: blackouts }, { data: profile }, { data: booked }] =
    await Promise.all([
      supabase
        .from("tutor_availability")
        .select("weekday, start_minute, end_minute")
        .eq("tutor_id", user.id)
        .order("weekday")
        .order("start_minute"),
      supabase
        .from("tutor_blackouts")
        .select("starts_at, ends_at, reason")
        .eq("tutor_id", user.id)
        .gte("starts_at", todayStart.toISOString())
        .order("starts_at"),
      supabase
        .from("tutor_public_profiles")
        .select("timezone, accepts_bookings, approval_status, is_public")
        .eq("user_id", user.id)
        .maybeSingle(),
      // Live bookings block slots in the preview, same as they will for students.
      supabase
        .from("booking_details")
        .select("starts_at, ends_at")
        .eq("tutor_id", user.id)
        .in("status", ["pending_payment", "confirmed", "completed"])
        .gte("starts_at", todayStart.toISOString()),
    ]);

  // A zone Intl doesn't recognise would throw inside the editor's slot preview
  // and blank the whole page, so fall back rather than trust the stored value.
  const timezone = safeTimezone(profile?.timezone || me?.timezone);

  const bookable =
    profile?.approval_status === "approved" &&
    profile?.is_public &&
    profile?.accepts_bookings;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/tutor"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      <header className="mb-8">
        <h1 className="font-heading font-extrabold text-3xl text-primary">
          Your availability
        </h1>
        <p className="mt-2 text-gray-600">
          The hours students can book you for. We never book you outside them.
        </p>
      </header>

      {!bookable && (
        <p className="mb-6 px-4 py-3 rounded-xl bg-warning-light text-sm text-amber-900">
          Your listing isn&apos;t taking bookings yet, so nothing here is visible
          to students. Setting your hours now means you&apos;re ready the moment
          it goes live.
        </p>
      )}

      <AvailabilityEditor
        timezone={timezone}
        initialRules={rules ?? []}
        initialBlackouts={(blackouts ?? []).map((b) => ({
          starts_at: b.starts_at,
          ends_at: b.ends_at,
          reason: b.reason ?? "",
        }))}
        busy={(booked ?? []).map((b) => ({
          start: b.starts_at,
          end: b.ends_at,
        }))}
      />
    </div>
  );
}
