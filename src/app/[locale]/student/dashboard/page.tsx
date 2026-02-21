// src/app/[locale]/(student)/dashboard/page.tsx
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { LanguageSwitcher } from "@/components/language-switcher";
import { CurrencySwitcher } from "@/components/currency-switcher";

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Fetch user data
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("*, tutor:referred_by_tutor_id(*)")
    .eq("id", user?.id)
    .single();

  return <DashboardContent profile={profile} />;
}

// Client component for translations
function DashboardContent({ profile }: { profile: any }) {
  const t = useTranslations("student");

  return (
    <div className="space-y-6">
      {/* Header with switchers */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("dashboard_title")}
          </h1>
          <p className="text-gray-600">
            {t("welcome_back", { name: profile?.name || "Student" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CurrencySwitcher />
          <LanguageSwitcher />
        </div>
      </div>

      {/* Tutor Card or Find Tutor */}
      {profile?.tutor ? (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="font-semibold text-gray-900 mb-4">
            {t("your_tutor")}
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary font-semibold">
                {profile.tutor.name?.charAt(0) || "T"}
              </span>
            </div>
            <div>
              <p className="font-medium">{profile.tutor.name}</p>
              <p className="text-sm text-gray-500">{profile.tutor.email}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-6 shadow-sm border text-center">
          <p className="text-gray-600 mb-4">{t("no_tutor")}</p>
          <a
            href="/tutors"
            className="inline-block bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-800"
          >
            {t("find_tutor")}
          </a>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <p className="text-sm text-gray-500">{t("upcoming_sessions")}</p>
          <p className="text-2xl font-bold mt-1">0</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <p className="text-sm text-gray-500">{t("streak")}</p>
          <p className="text-2xl font-bold mt-1">
            {t("streak_days", { count: 0 })}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <p className="text-sm text-gray-500">{t("points")}</p>
          <p className="text-2xl font-bold mt-1">0</p>
        </div>
      </div>
    </div>
  );
}