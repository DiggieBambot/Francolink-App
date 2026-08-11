// Where a tutor writes the listing that appears on francolink.net/tutors.
// Saving always sends the profile back to review — see the API route.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PublicProfileForm } from "@/components/tutor/public-profile-form";
import { SITE_URL } from "@/lib/site/hosts";

export const metadata: Metadata = {
  title: "Public profile | FrancoLink",
};

export const dynamic = "force-dynamic";

export default async function TutorPublicProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("users")
    .select("role, name")
    .eq("id", user.id)
    .maybeSingle();
  // ADMIN passes too — the founder teaches, and shouldn't have to give up the
  // admin panel to hold a listing.
  const callerRole = (me?.role || "").toUpperCase();
  if (callerRole !== "TUTOR" && callerRole !== "ADMIN") redirect("/dashboard");

  // Being listed on francolink.net requires an accepted application — having a
  // TUTOR account only means you can teach students you brought yourself.
  const [{ data: acceptedApplication }, { data: openApplication }] =
    await Promise.all([
      supabase
        .from("tutor_applications")
        .select("id")
        .eq("applicant_user_id", user.id)
        .eq("status", "accepted")
        .limit(1)
        .maybeSingle(),
      supabase
        .from("tutor_applications")
        .select("status, created_at")
        .eq("applicant_user_id", user.id)
        .in("status", ["new", "reviewing", "interviewing"])
        .limit(1)
        .maybeSingle(),
    ]);

  const [{ data: profile }, { data: availability }] = await Promise.all([
    supabase
      .from("tutor_public_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("tutor_availability")
      .select("weekday, start_minute, end_minute")
      .eq("tutor_id", user.id)
      .order("weekday")
      .order("start_minute"),
  ]);

  // Admins always get the editor. Everyone else needs an accepted application,
  // or an existing row an admin already created for them.
  const mayEdit =
    callerRole === "ADMIN" ||
    Boolean(acceptedApplication) ||
    Boolean(profile);

  if (!mayEdit) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="p-8 rounded-2xl bg-primary-50 border border-primary-100">
          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-5">
            <Globe className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-primary">
            Apply first, then build your profile
          </h1>
          <p className="mt-3 text-gray-600 leading-relaxed">
            Your account already lets you teach students you bring yourself.
            Appearing on{" "}
            <a
              href={`${SITE_URL}/tutors`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline underline-offset-4"
            >
              francolink.net
            </a>{" "}
            is different — we send you students and pay you per lesson, so every
            tutor goes through an application and review before a profile can go
            public.
          </p>

          {openApplication ? (
            <p className="mt-6 px-4 py-3 rounded-xl bg-warning-light text-sm font-semibold text-amber-900">
              Your application is with us — submitted{" "}
              {new Date(openApplication.created_at).toLocaleDateString()}. We&apos;ll
              email you as soon as it&apos;s reviewed.
            </p>
          ) : (
            <Link
              href="/tutor/apply"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-800"
            >
              Apply to become a FrancoLink tutor
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="font-heading font-extrabold text-3xl text-primary">
          Your public profile
        </h1>
        <p className="mt-2 text-gray-600">
          This is what prospective students see on{" "}
          <a
            href={`${SITE_URL}/tutors`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary underline underline-offset-4"
          >
            francolink.net/tutors
          </a>
          . Our team reviews every profile before it goes live, and again after
          any change.
        </p>
      </header>

      <PublicProfileForm
        tutorName={me?.name || ""}
        profile={profile ?? null}
        availability={availability ?? []}
        siteUrl={SITE_URL}
      />
    </div>
  );
}
