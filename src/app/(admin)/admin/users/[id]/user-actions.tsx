// src/app/(admin)/admin/users/[id]/user-actions.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  MoreVertical, 
  Crown, 
  Sparkles, 
  UserX, 
  Shield, 
  ShieldOff,
  RefreshCw,
  Loader2
} from "lucide-react";

interface UserActionsProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    subscription_plan: string;
  };
}

export function UserActions({ user }: UserActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: string) => {
    setLoading(true);
    setOpen(false);

    try {
      const response = await fetch("/api/admin/users/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, action }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Action failed");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("Action error:", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const actions = [
    {
      label: "Set as Premium",
      icon: Crown,
      action: "set_premium",
      show: user.subscription_plan !== "PREMIUM",
      color: "text-indigo-600",
    },
    {
      label: "Set as Premium+",
      icon: Sparkles,
      action: "set_premium_plus",
      show: user.subscription_plan !== "PREMIUM_PLUS",
      color: "text-purple-600",
    },
    {
      label: "Remove Subscription",
      icon: UserX,
      action: "remove_subscription",
      show: user.subscription_plan !== "FREE",
      color: "text-red-600",
    },
    {
      label: "Make Admin",
      icon: Shield,
      action: "make_admin",
      show: user.role !== "ADMIN",
      color: "text-amber-600",
    },
    {
      label: "Remove Admin",
      icon: ShieldOff,
      action: "remove_admin",
      show: user.role === "ADMIN",
      color: "text-red-600",
    },
    {
      label: "Reset Streak",
      icon: RefreshCw,
      action: "reset_streak",
      show: true,
      color: "text-gray-600",
    },
  ];

  const visibleActions = actions.filter((a) => a.show);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
        ) : (
          <MoreVertical className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20">
            {visibleActions.map((action) => (
              <button
                key={action.action}
                onClick={() => handleAction(action.action)}
                className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors"
              >
                <action.icon className={`w-4 h-4 ${action.color}`} />
                <span className="text-sm text-gray-700">{action.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}