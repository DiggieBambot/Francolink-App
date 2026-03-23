// src/components/dashboard/sidebar.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Target,
  Trophy,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Crown,
  Flame,
  Zap,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/layout";
import { cn, formatNumber } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface SidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    total_xp: number;
    current_streak: number;
    subscription_tier: string;
    subscription_plan?: string;
  } | null;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/practice", label: "Practice", icon: Target },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Use subscription_plan if available, fallback to subscription_tier for backwards compatibility
  const userPlan = user?.subscription_plan || user?.subscription_tier || "FREE";

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // Render the subscription section based on plan
  const renderSubscriptionSection = () => {
    // Premium+ users: show badge only, no upsell
    if (userPlan === "PREMIUM_PLUS") {
      return (
        <div className="p-4 border-t border-gray-100">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span className="font-heading font-bold">Premium+ Member</span>
            </div>
            <p className="text-sm text-purple-100 mt-1">
              You have access to everything!
            </p>
          </div>
        </div>
      );
    }

    // Premium users: show badge + upsell to Premium+
    if (userPlan === "PREMIUM") {
      return (
        <div className="p-4 border-t border-gray-100">
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5" />
              <span className="font-heading font-bold">Premium Member</span>
            </div>
            <p className="text-sm text-indigo-100 mb-3">
              Upgrade for 60 min AI Tutor daily
            </p>
            <Link
              href="/upgrade-plus"
              className="flex items-center justify-center gap-1 bg-white text-indigo-600 font-semibold py-2 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Get Premium+
            </Link>
          </div>
        </div>
      );
    }

    // Free users: show upsell to pricing page (both plans)
    return (
      <div className="p-4 border-t border-gray-100">
        <div className="bg-gradient-to-r from-purple-500 to-primary-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5" />
            <span className="font-heading font-bold">Go Premium</span>
          </div>
          <p className="text-sm text-purple-100 mb-3">
            Unlock AI tutoring & more
          </p>
          <Link
            href="/pricing"
            className="block text-center bg-white text-purple-600 font-semibold py-2 rounded-lg hover:bg-purple-50 transition-colors"
          >
            Upgrade Now
          </Link>
        </div>
      </div>
    );
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-4 border-b border-gray-100">
        <Logo />
      </div>

      {/* User Avatar & Info */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {user?.name?.charAt(0) || "U"}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">
              {user?.name || "Learner"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-around">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-streak">
              <Flame className="w-5 h-5" />
              <span className="font-bold text-lg">{user?.current_streak || 0}</span>
            </div>
            <span className="text-xs text-gray-500">Streak</span>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xp">
              <Zap className="w-5 h-5" />
              <span className="font-bold text-lg">{formatNumber(user?.total_xp || 0)}</span>
            </div>
            <span className="text-xs text-gray-500">XP</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                    isActive
                      ? "bg-secondary text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Subscription Section */}
      {renderSubscriptionSection()}

      {/* Logout */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Log Out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md md:hidden cursor-pointer"
      >
        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 z-40 flex flex-col transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}