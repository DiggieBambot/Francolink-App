// src/app/(student)/upgrade-plus/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Crown,
  Check,
  ArrowRight,
  Clock,
  MessageSquare,
  BarChart3,
  Headphones,
} from "lucide-react";
import { UpgradeButton } from "@/components/pricing";

const upgradeBenefits = [
  {
    icon: MessageSquare,
    current: "15 min AI Tutor daily",
    upgraded: "60 min AI Tutor daily",
    description: "4x more conversation practice time",
  },
  {
    icon: BarChart3,
    current: "Basic analytics",
    upgraded: "Advanced analytics",
    description: "Detailed insights into your learning patterns",
  },
  {
    icon: Headphones,
    current: "Standard pronunciation",
    upgraded: "Advanced pronunciation analysis",
    description: "AI-powered accent and intonation feedback",
  },
  {
    icon: Clock,
    current: "Standard support",
    upgraded: "Priority support",
    description: "Get help within hours, not days",
  },
];

const testimonials = [
  {
    name: "Marie L.",
    text: "The extra AI tutor time made all the difference. I went from B1 to B2 in just 2 months!",
    avatar: "M",
  },
  {
    name: "James K.",
    text: "The pronunciation analysis helped me sound like a native. Worth every penny.",
    avatar: "J",
  },
];

export default async function UpgradePlusPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("subscription_plan, subscription_tier, name")
    .eq("id", user.id)
    .single();

  const currentPlan =
    profile?.subscription_plan || profile?.subscription_tier || "FREE";

  // Redirect FREE users to main pricing page
  if (currentPlan === "FREE") {
    redirect("/pricing");
  }

  // Redirect Premium+ users to dashboard
  if (currentPlan === "PREMIUM_PLUS") {
    redirect("/dashboard");
  }

  // Only PREMIUM users see this page
  const firstName = profile?.name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex items-center gap-2 text-sm text-indigo-600">
            <Crown className="w-4 h-4" />
            <span className="font-medium">Premium Member</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 pt-12 pb-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mb-6 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Hey {firstName}, ready for the next level?
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            You&apos;re already making great progress with Premium. Upgrade to
            Premium+ and supercharge your learning with 4x more AI tutor time.
          </p>
        </div>

        {/* Comparison Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-12">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-1">Premium+ Upgrade</h2>
                <p className="text-white/80">Everything you have now, plus more</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">+$7</div>
                <div className="text-sm text-white/80">per month</div>
              </div>
            </div>
          </div>

          {/* Benefits Comparison */}
          <div className="p-6">
            <div className="space-y-6">
              {upgradeBenefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="p-2 bg-purple-100 rounded-xl shrink-0">
                    <benefit.icon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="text-gray-400 line-through text-sm">
                        {benefit.current}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 font-semibold">
                        {benefit.upgraded}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{benefit.description}</p>
                  </div>
                  <Check className="w-5 h-5 text-green-500 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="border-t border-gray-100 p-6 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">
                  Your new monthly total
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    $14.99
                  </span>
                  <span className="text-gray-500">/month</span>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                  Save $5/mo vs regular price
                </span>
              </div>
            </div>

            {/* CTA Button */}
            <UpgradeButton className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg" />
            <p className="text-center text-sm text-gray-500 mt-3">
              Cancel anytime • Prorated billing • Instant access
            </p>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-6">
            What Premium+ members say
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <p className="text-gray-600 mb-4">&quot;{testimonial.text}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-500">Premium+ Member</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-12">
          <h3 className="font-semibold text-gray-900 mb-4">Quick questions</h3>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium text-gray-900">
                When does my upgrade take effect?
              </p>
              <p className="text-gray-600">
                Immediately! You&apos;ll have access to all Premium+ features right
                away.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-900">How does billing work?</p>
              <p className="text-gray-600">
                We&apos;ll prorate your current billing cycle. You only pay the
                difference for the remaining days.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-900">
                Can I go back to Premium?
              </p>
              <p className="text-gray-600">
                Yes, you can downgrade anytime from your account settings. Changes
                take effect on your next billing date.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center pb-12">
          <UpgradeButton className="inline-flex px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg" />
          <p className="mt-4">
            <Link
              href="/dashboard"
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Maybe later, take me back to learning
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}