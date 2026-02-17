// src/app/(student)/checkout/success/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Sparkles, ArrowRight } from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    session_id?: string;
  }>;
}

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const { session_id } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get updated user profile
  const { data: profile } = await supabase
    .from("users")
    .select("name, subscription_plan, is_founding_member")
    .eq("id", user.id)
    .single();

  const planName =
    profile?.subscription_plan === "PREMIUM_PLUS" ? "Premium+" : "Premium";
  const firstName = profile?.name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to {planName}, {firstName}! 🎉
          </h1>

          <p className="text-gray-600 mb-6">
            Your subscription is now active. You have full access to all{" "}
            {planName} features.
          </p>

          {/* Founding Member Badge */}
          {profile?.is_founding_member && (
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Founding Member — Locked-in Price Forever!
            </div>
          )}

          {/* What's Next */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left">
            <h2 className="font-semibold text-gray-900 mb-3">
              What&apos;s unlocked:
            </h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Unlimited daily lessons
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                All CEFR levels (A1–C2)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {profile?.subscription_plan === "PREMIUM_PLUS" ? "60" : "15"} min
                AI Tutor daily
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Priority support
              </li>
            </ul>
          </div>

          {/* CTA */}
          <Link
            href="/learn"
            className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Start Learning
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/dashboard"
            className="block mt-3 text-sm text-gray-500 hover:text-gray-700"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}