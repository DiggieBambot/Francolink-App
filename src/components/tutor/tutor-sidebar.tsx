"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Video, LogOut, ChevronUp, Settings, User,
  LayoutDashboard, Users, BookOpen, Calendar, DollarSign,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Icons are looked up by name here (client side) because Server Components
// cannot pass component functions as props to Client Components.
const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard, Users, BookOpen, Video, Calendar, DollarSign, Settings,
};

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
}

interface TutorSidebarProps {
  navigation: NavigationItem[];
  userName: string;
  userEmail: string;
  avatarUrl?: string | null;
  tutorPlan?: string | null;
}

export function TutorSidebar({
  navigation,
  userName,
  userEmail,
  avatarUrl,
  tutorPlan,
}: TutorSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isActive = (href: string) => {
    if (href === "/tutor") {
      return pathname === "/tutor";
    }
    return pathname?.startsWith(href);
  };

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const planLabel =
    tutorPlan === "PREMIUM_PLUS"
      ? "Premium+"
      : tutorPlan === "PREMIUM"
      ? "Premium"
      : "Basic";

  const planColor =
    tutorPlan === "PREMIUM_PLUS"
      ? "bg-purple-50 text-purple-700"
      : tutorPlan === "PREMIUM"
      ? "bg-secondary-50 text-secondary-700"
      : "bg-gray-100 text-gray-600";

  return (
    <nav className="w-64 bg-white border-r border-gray-100 flex flex-col shadow-sm">
      {/* Navigation Links */}
      <div className="px-3 py-4 space-y-1 flex-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-3">
          Menu
        </p>
        {navigation.map((item) => {
          const Icon = ICONS[item.icon] ?? LayoutDashboard;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all
                ${
                  active
                    ? "bg-primary text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }
              `}
            >
              <Icon
                className={`w-[18px] h-[18px] ${
                  active ? "text-white" : "text-gray-400"
                }`}
              />
              {item.name}
              {active && (
                <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Quick Action */}
      <div className="border-t border-gray-100 px-4 py-4">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
          Quick Actions
        </p>
        <Link
          href="/space/new"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-secondary !text-white rounded-xl font-semibold hover:bg-secondary-600 transition-colors shadow-sm text-sm"
        >
          <Video className="w-4 h-4" />
          Start Session
        </Link>
      </div>

      {/* User Menu */}
      <div className="border-t border-gray-100 p-3 relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm overflow-hidden">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              userName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {userName}
            </p>
            <span
              className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full ${planColor}`}
            >
              {planLabel}
            </span>
          </div>
          <ChevronUp
            className={`w-4 h-4 text-gray-400 transition-transform ${
              showUserMenu ? "rotate-180" : ""
            }`}
          />
        </button>

        {showUserMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowUserMenu(false)}
            />
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-white border border-gray-100 rounded-xl shadow-medium py-1.5 z-20">
              <div className="px-4 py-2.5 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">
                  {userName}
                </p>
                <p className="text-[11px] text-gray-400">{userEmail}</p>
              </div>

              <Link
                href="/tutor/settings"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4 text-gray-400" />
                <span className="font-medium">Settings</span>
              </Link>

              <Link
                href="/dashboard"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-medium">Student View</span>
              </Link>

              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">
                    {isLoggingOut ? "Signing out..." : "Sign Out"}
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}