"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, Settings, ChevronUp, User, DollarSign, GraduationCap, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface UserMenuProps {
  user: {
    name: string;
    email: string;
    avatar_url?: string | null;
    role: string;
    commission_balance?: number | null;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const onTutorSide = pathname.startsWith("/tutor");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    // Clear the client session best-effort, then hand off to the server route
    // which reliably expires the auth cookies (incl. httpOnly) and redirects.
    try { await supabase.auth.signOut({ scope: "local" }); } catch {}
    window.location.href = "/auth/signout";
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden shadow-sm">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            user.name?.charAt(0)?.toUpperCase() || "U"
          )}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {user.name || "User"}
          </p>
          <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
        </div>
        <ChevronUp
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-100 rounded-xl shadow-medium py-1.5 z-20">
            {/* Commission balance for tutors */}
            {user.role === "TUTOR" &&
              user.commission_balance !== null &&
              user.commission_balance !== undefined && (
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                    Commission Balance
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <DollarSign className="w-3.5 h-3.5 text-green-600" />
                    <p className="text-sm font-bold text-green-600">
                      {Number(user.commission_balance).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

            <Link
              href={user.role === "TUTOR" ? "/tutor/settings" : "/settings"}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-4 h-4 text-gray-400" />
              <span className="font-medium">Settings</span>
            </Link>

            {user.role === "TUTOR" || user.role === "ADMIN" ? (
              <Link
                href={onTutorSide ? "/dashboard" : "/tutor"}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {onTutorSide ? (
                  <>
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">Student Dashboard</span>
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">Tutor Dashboard</span>
                  </>
                )}
              </Link>
            ) : (
              <Link
                href="/become-tutor"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary hover:bg-secondary-50 transition-colors"
              >
                <GraduationCap className="w-4 h-4" />
                <span className="font-medium">Become a Tutor</span>
              </Link>
            )}

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
  );
}