import { MobileBottomNav } from "@/components/shared/mobile-bottom-nav";
import { AITutorFab } from "@/components/student/ai-tutor-fab";
import { PushPrompt } from "@/components/notifications/push-prompt";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StudentNavigation } from "@/components/student/student-navigation";
import { UserMenu } from "@/components/shared/user-menu";
import { MobileSidebar } from "@/components/shared/mobile-sidebar";
import { LanguageSwitcher } from "@/components/student/language-switcher";
import Image from "next/image";
import Link from "next/link";
import { Flame, Zap } from "lucide-react";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select(
      "role, name, email, avatar_url, total_xp, current_level, current_streak, placement_test_level, subscription_plan, learning_language"
    )
    .eq("id", user.id)
    .single();

  // Fetch user's languages for the switcher
  const { data: userLanguages } = await supabase
    .from("user_languages")
    .select("language_code, is_active, placement_taken, placement_level")
    .eq("user_id", user.id)
    .order("created_at");

  const activeLanguage = profile?.learning_language || "fr";

  const level = profile?.placement_test_level || profile?.current_level || "A1";
  const xp = profile?.total_xp || 0;
  const streak = profile?.current_streak || 0;

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <Image src="/logo-icon.png" alt="Francolink" width={36} height={36} className="group-hover:scale-105 transition-transform" />
          <div>
            <span className="text-lg font-heading font-extrabold text-primary leading-none">
              franco<span className="text-secondary">link</span><span className="text-secondary">.</span>
            </span>
            <span className="block text-[10px] text-gray-400 font-medium tracking-wide uppercase">
              Learn · Speak · Connect
            </span>
          </div>
        </Link>
      </div>

      {/* Level & XP Bar */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
              <span className="text-sm font-extrabold text-primary">
                {level}
              </span>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                Level
              </p>
              <p className="text-sm font-bold text-primary leading-none">
                {level === "A1"
                  ? "Beginner"
                  : level === "A2"
                  ? "Elementary"
                  : level === "B1"
                  ? "Intermediate"
                  : level === "B2"
                  ? "Upper Int."
                  : level}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-orange-50 px-2.5 py-1.5 rounded-lg">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-bold text-orange-600">{streak}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
          <div className="flex-1">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-secondary to-secondary-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((xp % 1000) / 10, 100)}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-semibold text-gray-500 tabular-nums">
            {xp} XP
          </span>
        </div>
      </div>

      {/* Language Switcher */}
      {(userLanguages && userLanguages.length > 0) && (
        <div className="px-4 py-3 border-b border-gray-100">
          <LanguageSwitcher
            activeLanguage={activeLanguage}
            userLanguages={userLanguages}
            userId={user.id}
          />
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <StudentNavigation />
      </div>

      {/* User Menu */}
      <div className="border-t border-gray-100 p-3">
        <UserMenu
          user={{
            name: profile?.name || "Student",
            email: profile?.email || user.email || "",
            avatar_url: profile?.avatar_url,
            role: "STUDENT",
          }}
        />
      </div>
    </>
  );

  return (
    // ── safe-area-inset: prevents content going behind iPhone notch/home bar ──
    <div
      className="bg-gray-50"
      style={{
        minHeight: "100dvh",                          // dvh = dynamic viewport height (PWA safe)
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100 flex-col z-50 shadow-sm">
        {sidebarContent}
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <MobileSidebar>{sidebarContent}</MobileSidebar>
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image src="/logo-icon.png" alt="Francolink" width={32} height={32} />
              <span className="text-base font-heading font-extrabold text-primary">
                franco<span className="text-secondary">link</span><span className="text-secondary">.</span>
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {(userLanguages && userLanguages.length > 0) && (
              <LanguageSwitcher
                activeLanguage={activeLanguage}
                userLanguages={userLanguages}
                userId={user.id}
              />
            )}
            <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-lg">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs font-bold text-orange-600">
                {streak}
              </span>
            </div>
            <div className="flex items-center gap-1 bg-secondary-50 px-2 py-1 rounded-lg">
              <Zap className="w-3.5 h-3.5 text-secondary" />
              <span className="text-xs font-bold text-secondary-700">
                {xp}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav plan={profile?.subscription_plan || "FREE"} />

      <PushPrompt />

      {/* AI Tutor Floating Button */}
      <AITutorFab plan={profile?.subscription_plan || "FREE"} />

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* pb-24 for mobile bottom nav + extra for home bar */}
        <main className="min-h-screen p-4 sm:p-6 lg:p-8 pb-28 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}