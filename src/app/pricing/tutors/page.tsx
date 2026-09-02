import { createClient } from "@/lib/supabase/server";
import { Check, X, Shield, Zap, Users } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import { appUrl } from "@/lib/site/hosts";

// Self-referencing canonical: the app host emitted none at all, leaving
// indexation of these pages to Google's duplicate heuristics.
export const metadata: Metadata = {
  title: 'Tutor Pricing | FrancoLink',
  description: 'Choose the right plan to grow your tutoring business.',
  alternates: { canonical: appUrl("/pricing/tutors") },
};

export default async function TutorPricingPage() {
  const supabase = await createClient();
  
  // 1. Fetch Dynamic Settings (Sale Mode, Banner, etc.)
  const { data: settings } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("category", ["pricing_tutor", "pricing_marketing"]);

  // Helper to get value
  const getVal = (key: string) => settings?.find(s => s.key === key)?.value;

  // 2. Parse Dynamic Data
  const isSaleActive = getVal('is_global_sale_active') === 'true';
  const promoText = getVal('promo_banner_text');
  const couponCode = getVal('active_coupon_code');

  // Premium Plan Data
  const premiumOriginalPrice = parseFloat(getVal('tutor_premium_price') || '29.99');
  const premiumSalePrice = parseFloat(getVal('tutor_premium_sale_price') || '0');
  
  // Logic: Calculate effective price
  const showDiscount = isSaleActive && premiumSalePrice > 0 && premiumSalePrice < premiumOriginalPrice;
  const currentPremiumPrice = showDiscount ? premiumSalePrice : premiumOriginalPrice;

  // Features Lists (You can also fetch these from DB if you stored them as JSON)
  const basicFeatures = [
    "10% Commission Fee",
    "Standard Directory Listing",
    "Up to 50 Students",
    "Basic Analytics",
    "Email Support"
  ];

  const premiumFeatures = [
    "5% Commission Fee (Keep More!)",
    "Featured Directory Listing (Top Rank)",
    "Unlimited Students",
    "Advanced Analytics Dashboard",
    "Verified Profile Badge",
    "Priority Support"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      
      {/* Marketing Banner */}
      {isSaleActive && promoText && (
        <div className="bg-indigo-600 text-white text-center py-3 px-4 font-medium relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 skew-x-12 -translate-x-full animate-shimmer"></div>
          <span className="relative z-10 flex items-center justify-center gap-2 flex-wrap">
            <span>🎉 {promoText}</span>
            {couponCode && (
              <span className="bg-white text-indigo-600 px-2 py-0.5 rounded text-sm font-bold font-mono border border-indigo-200">
                CODE: {couponCode}
              </span>
            )}
          </span>
        </div>
      )}

      <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
            Upgrade Your Teaching Career
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Maximize your earnings, reach more students, and get premium tools to manage your French tutoring business.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-start">
          
          {/* BASIC PLAN */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gray-100 rounded-lg text-gray-600">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Basic</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-5xl font-extrabold text-gray-900">$0</p>
              <p className="text-gray-500 mt-2 font-medium">Forever free</p>
            </div>

            <p className="text-gray-600 mb-8 border-b border-gray-100 pb-8">
              Perfect for getting started and building your initial student base.
            </p>

            <ul className="space-y-4 mb-8">
              {basicFeatures.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
              <li className="flex items-start gap-3 opacity-50">
                <X className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-500 line-through">Featured Listing</span>
              </li>
            </ul>

            <Link 
              href="/signup/tutor" 
              className="block w-full py-4 text-center bg-gray-50 text-gray-900 font-bold rounded-xl border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all"
            >
              Start for Free
            </Link>
          </div>

          {/* PREMIUM PLAN */}
          <div className="bg-white rounded-2xl p-8 border-2 border-indigo-600 shadow-xl relative transform md:-translate-y-4">
            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-wider">
              Most Popular
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Pro Tutor</h3>
            </div>
            
            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                {showDiscount && (
                  <span className="text-2xl text-gray-400 line-through decoration-red-500 decoration-2">
                    ${premiumOriginalPrice}
                  </span>
                )}
                <span className="text-5xl font-extrabold text-indigo-600">
                  ${currentPremiumPrice}
                </span>
                <span className="text-gray-500 font-medium self-end">/month</span>
              </div>
              {showDiscount && (
                <p className="text-red-600 text-sm font-bold mt-2 bg-red-50 inline-block px-2 py-1 rounded">
                  🔥 Save {Math.round(((premiumOriginalPrice - currentPremiumPrice) / premiumOriginalPrice) * 100)}% today!
                </p>
              )}
            </div>

            <p className="text-gray-600 mb-8 border-b border-gray-100 pb-8">
              For serious tutors who want to maximize visibility and income.
            </p>

            <ul className="space-y-4 mb-8">
              {premiumFeatures.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="p-0.5 bg-indigo-100 rounded-full text-indigo-600 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-gray-900 font-medium">{feature}</span>
                </li>
              ))}
            </ul>

            <Link 
              href="/tutor/settings" 
              className="block w-full py-4 text-center bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 hover:shadow-indigo-200 transition-all transform hover:-translate-y-0.5"
            >
              Upgrade to Pro
            </Link>
            
            <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" /> Secure payment via Stripe
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}