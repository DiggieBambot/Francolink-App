// An existing tutor applying to become a FrancoLink tutor.
//
// Worth keeping the two ideas apart: this account can already teach on
// FrancoLink with students it brought itself. Applying here asks us to send
// them students, list them publicly, and pay them per lesson — which is why it
// goes through review rather than being a switch they flip.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TutorApplyForm } from "@/components/tutor/tutor-apply-form";
import { SITE_URL } from "@/lib/site/hosts";

export const metadata: Metadata = { title: "Become a FrancoLink tutor" };
export const dynamic = "force-dynamic";

export default async function TutorApplyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("users")
    .select("name, email, role, timezone")
    .eq("id", user.id)
    .maybeSingle();
  const role = (me?.role || "").toUpperCase();
  if (role !== "TUTOR" && role !== "ADMIN") redirect("/dashboard");

  // Their most recent application, if any — so we show status instead of an
  // empty form to someone already waiting on us.
  const { data: application } = await supabase
    .from("tutor_applications")
    .select("status, proposed_tier, review_notes, created_at, created_user_id")
    .eq("applicant_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Already listed? Then there's nothing to apply for.
  const { data: profile } = await supabase
    .from("tutor_public_profiles")
    .select("slug, approval_status, is_public, accepts_bookings")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/tutor"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      <header className="mb-8">
        <h1 className="font-heading font-extrabold text-3xl text-primary">
          Become a FrancoLink tutor
        </h1>
        <p className="mt-3 text-gray-600 leading-relaxed">
          You can already teach here with students you bring yourself. This is
          different: we list you publicly on{" "}
          <a
            href={`${SITE_URL}/tutors`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary underline underline-offset-4"
          >
            francolink.net
          </a>
          , send you students, take the payment, and pay you a fixed amount per
          lesson. Because we&apos;re putting our name to your teaching, every
          application is reviewed.
        </p>
      </header>

      <TutorApplyForm
        name={me?.name || ""}
        email={me?.email || ""}
        timezone={me?.timezone || ""}
        application={application ?? null}
        profile={profile ?? null}
        siteUrl={SITE_URL}
      />
    </div>
  );
}
