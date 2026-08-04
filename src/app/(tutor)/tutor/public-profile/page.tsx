// Where a tutor writes the listing that appears on francolink.net/tutors.
// Saving always sends the profile back to review — see the API route.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
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
  if ((me?.role || "").toUpperCase() !== "TUTOR") redirect("/dashboard");

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
