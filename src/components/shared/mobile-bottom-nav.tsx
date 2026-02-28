"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, BookOpen, Bot, Trophy, User } from "lucide-react";

interface MobileBottomNavProps {
  plan?: string;
}

const tabs = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/student/ai-tutor", label: "AI Tutor", icon: Bot },
  { href: "/student/leaderboard", label: "Ranks", icon: Trophy },
  { href: "/profile", label: "Profile", icon: User },
];

export function MobileBottomNav({ plan = "FREE" }: MobileBottomNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  // Hide bottom nav on lesson pages (full-screen experience)
  const hideOnPaths = ["/learn/", "/placement-test"];
  const shouldHide = hideOnPaths.some(
    (p) => pathname.includes(p) && pathname.split("/").length > 3
  );
  if (shouldHide) return null;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-xl transition-colors ${
                active ? "text-primary" : "text-gray-400"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  active ? "bg-primary/10" : ""
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    active ? "text-primary" : "text-gray-400"
                  }`}
                  strokeWidth={active ? 2.5 : 2}
                />
              </div>
              <span
                className={`text-[10px] font-medium leading-none ${
                  active ? "text-primary" : "text-gray-400"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
