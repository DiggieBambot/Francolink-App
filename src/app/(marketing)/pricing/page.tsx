// src/app/(marketing)/pricing/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Check, X, Crown, Sparkles, Zap } from "lucide-react";
import { CheckoutButton } from "@/components/pricing";

type PlanKey = "FREE" | "PREMIUM" | "PREMIUM_PLUS";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  key: PlanKey;
  name: string;
  description: string;
  price: string;
  yearlyPrice: string;
  period: string;
  originalPrice?: string;
  features: PlanFeature[];
  highlighted?: boolean;
  icon: React.ReactNode;
}

const plans: Plan[] = [
  {
    key: "FREE",
    name: "Free",
    description: "Get started with the basics",
    price: "$0",
    yearlyPrice: "$0",
    period: "forever",
    icon: <Zap className="w-6 h-6 text-gray-500" />,
    features: [
      { text: "3 lessons per day", included: true },
      { text: "A1-B2 levels only", included: true },
      { text: "Basic progress tracking", included: true },
      { text: "C1-C2 advanced levels", included: false },
      { text: "AI conversation tutor", included: false },
      { text: "Offline mode", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    key: "PREMIUM",
    name: "Premium",
    description: "Unlock your full potential",
    price: "$7.99",
    yearlyPrice: "$79.99",
    period: "per month",
    originalPrice: "$9.99",
    icon: <Crown className="w-6 h-6 text-indigo-500" />,
    highlighted: true,
    features: [
      { text: "Unlimited lessons", included: true },
      { text: "All levels (A1-C2)", included: true },
      { text: "Advanced progress tracking", included: true },
      { text: "15 min AI tutor per day", included: true },
      { text: "Offline mode", included: true },
      { text: "Priority support", included: true },
      { text: "60 min AI tutor per day", included: false },
    ],
  },
  {
    key: "PREMIUM_PLUS",
    name: "Premium+",
    description: "The ultimate learning experience",
    price: "$14.99",
    yearlyPrice: "$149.99",
    period: "per month",
    originalPrice: "$19.99",
    icon: <Sparkles className="w-6 h-6 text-purple-500" />,
    features: [
      { text: "Unlimited lessons", included: true },
      { text: "All levels (A1-C2)", included: true },
      { text: "Advanced progress tracking", included: true },
      { text: "60 min AI tutor per day", included: true },
      { text: "Offline mode", included: true },
      { text: "Priority support", included: true },
      { text: "Advanced pronunciation analysis", included: true },
    ],
  },
];

const faqs = [
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards, debit cards, and PayPal through our secure payment processor, Stripe.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Our Free plan lets you try the core features indefinitely. Upgrade when you're ready for unlimited access!",
  },
  {
    question: "What's the AI tutor?",
    answer:
      "Our AI tutor provides personalized conversation practice, pronunciation feedback, and answers your language questions in real-time.",
  },
  {
    question: "Can I switch plans later?",
    answer:
      "Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.",
  },
];

export default async function PricingPage() {
  const supabase = await createClient();

  // Check if user is logged in and get their plan
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentPlan: PlanKey = "FREE";
  let isLoggedIn = false;

  if (user) {
    isLoggedIn = true;
    const { data: profile } = await supabase
      .from("users")
      .select("subscription_plan, subscription_tier")
      .eq("id", user.id)
      .single();

    currentPlan = (profile?.subscription_plan ||
      profile?.subscription_tier ||
      "FREE") as PlanKey;

    // If user is already Premium+, redirect to dashboard
    if (currentPlan === "PREMIUM_PLUS") {
      redirect("/dashboard");
    }
  }

  const isPremiumUser = currentPlan === "PREMIUM";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link
            href={isLoggedIn ? "/dashboard" : "/"}
            className="text-primary hover:opacity-80 transition-opacity"
          >
            ← {isLoggedIn ? "Back to Dashboard" : "Back to Home"}
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-b from-primary to-primary/90 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold font-heading mb-4">
            {isPremiumUser
              ? "Upgrade to Premium+"
              : "Choose Your Learning Journey"}
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            {isPremiumUser
              ? "You're already a Premium member. Take your learning to the next level!"
              : "Join thousands of learners mastering new languages every day."}
          </p>
          {isPremiumUser && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <Crown className="w-5 h-5 text-yellow-300" />
              <span className="text-sm font-medium">
                You&apos;re currently on Premium
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-4 -mt-8">
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = plan.key === currentPlan;
            const shouldHighlight = isPremiumUser
              ? plan.key === "PREMIUM_PLUS"
              : plan.highlighted;

            // Hide Free plan for Premium users
            if (isPremiumUser && plan.key === "FREE") {
              return null;
            }

            // Determine button state
            const isDisabled = isCurrentPlan || plan.key === "FREE";
            const showCheckoutButton =
              isLoggedIn && !isDisabled && plan.key !== "FREE";
            const showSignupLink = !isLoggedIn && plan.key !== "FREE";

            return (
              <div
                key={plan.key}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-transform hover:scale-[1.02] ${
                  shouldHighlight ? "ring-2 ring-indigo-500 shadow-xl" : ""
                } ${isCurrentPlan ? "ring-2 ring-green-500" : ""}`}
              >
                {/* Badge */}
                {shouldHighlight && !isCurrentPlan && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-center py-1 text-sm font-medium">
                    {isPremiumUser ? "Recommended Upgrade" : "Most Popular"}
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute top-0 left-0 right-0 bg-green-500 text-white text-center py-1 text-sm font-medium">
                    Your Current Plan
                  </div>
                )}

                <div
                  className={`p-6 ${shouldHighlight || isCurrentPlan ? "pt-10" : ""}`}
                >
                  {/* Plan Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`p-2 rounded-xl ${
                        plan.key === "FREE"
                          ? "bg-gray-100"
                          : plan.key === "PREMIUM"
                            ? "bg-indigo-100"
                            : "bg-purple-100"
                      }`}
                    >
                      {plan.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-gray-500">{plan.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-gray-900">
                        {plan.price}
                      </span>
                      <span className="text-gray-500">/{plan.period}</span>
                    </div>
                    {plan.originalPrice && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-400 line-through">
                          {plan.originalPrice}/mo
                        </span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          Founding Price
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
                        )}
                        <span
                          className={
                            feature.included ? "text-gray-700" : "text-gray-400"
                          }
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {isCurrentPlan && (
                    <button
                      disabled
                      className="w-full py-3 px-4 rounded-xl font-semibold bg-gray-100 text-gray-400 cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  )}

                  {plan.key === "FREE" && !isCurrentPlan && (
                    <Link
                      href="/signup"
                      className="block w-full py-3 px-4 rounded-xl font-semibold text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      Get Started
                    </Link>
                  )}

                  {showCheckoutButton && (
                    <CheckoutButton
                      plan={plan.key === "PREMIUM" ? "premium" : "premium_plus"}
                      billingPeriod="monthly"
                      className={`w-full py-3 px-4 rounded-xl font-semibold text-center transition-colors ${
                        shouldHighlight
                          ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90"
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                      }`}
                    >
                      Get {plan.name}
                    </CheckoutButton>
                  )}

                  {showSignupLink && (
                    <Link
                      href="/signup"
                      className={`block w-full py-3 px-4 rounded-xl font-semibold text-center transition-colors ${
                        shouldHighlight
                          ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90"
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                      }`}
                    >
                      Get {plan.name}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Premium user: show comparison */}
        {isPremiumUser && (
          <div className="mt-8 text-center">
            <p className="text-gray-500">
              Only{" "}
              <span className="font-semibold text-gray-900">$7/month more</span>{" "}
              to unlock 60 min AI Tutor daily
            </p>
          </div>
        )}
      </div>

      {/* FAQs */}
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                {faq.question}
              </h3>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-primary text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to start learning?
          </h2>
          <p className="text-white/80 mb-6">
            Join thousands of learners already on their language journey.
          </p>
          <Link
            href={isLoggedIn ? "/learn" : "/signup"}
            className="inline-block bg-white text-primary font-semibold px-8 py-3 rounded-xl hover:bg-gray-100 transition-colors"
          >
            {isLoggedIn ? "Continue Learning" : "Get Started for Free"}
          </Link>
        </div>
      </div>
    </div>
  );
}