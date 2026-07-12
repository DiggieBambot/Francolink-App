"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  BookOpen,
  Gamepad2,
  Trophy,
  Video,
  Settings,
  Brain,
  Bot,
  Bell,
  LucideIcon,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navigationItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Learn", href: "/learn", icon: BookOpen },
  { label: "Games", href: "/games", icon: Gamepad2 },
  { label: "AI Tutor", href: "/student/ai-tutor", icon: Bot },
  { label: "Sessions", href: "/student/sessions", icon: Video },
  { label: "Leaderboard", href: "/student/leaderboard", icon: Trophy },
  { label: "Placement Test", href: "/placement-test", icon: Brain },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function StudentNavigation() {
  const pathname = usePathname();

  const isActive = (href: string): boolean => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="space-y-1">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-3">
        Menu
      </p>
      {navigationItems.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
              ${
                active
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }
            `}
          >
            <Icon
              className={`w-[18px] h-[18px] flex-shrink-0 ${
                active ? "text-white" : "text-gray-400"
              }`}
            />
            <span>{item.label}</span>
            {active && (
              <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
