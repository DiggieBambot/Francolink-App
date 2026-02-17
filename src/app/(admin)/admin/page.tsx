// src/app/(admin)/admin/page.tsx

import { createClient } from "@/lib/supabase/server";
import { Users, BookOpen, CreditCard, TrendingUp } from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Get stats
  const { count: userCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  const { count: lessonCount } = await supabase
    .from("lessons")
    .select("*", { count: "exact", head: true });

  const { count: premiumCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .in("subscription_plan", ["PREMIUM", "PREMIUM_PLUS"]);

  const stats = [
    {
      label: "Total Users",
      value: userCount || 0,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      label: "Total Lessons",
      value: lessonCount || 0,
      icon: BookOpen,
      color: "bg-green-500",
    },
    {
      label: "Premium Users",
      value: premiumCount || 0,
      icon: CreditCard,
      color: "bg-purple-500",
    },
    {
      label: "Conversion Rate",
      value: userCount ? `${Math.round(((premiumCount || 0) / userCount) * 100)}%` : "0%",
      icon: TrendingUp,
      color: "bg-orange-500",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/settings"
            className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
          >
            <h3 className="font-medium text-gray-900">Configure Settings</h3>
            <p className="text-sm text-gray-500">Manage app settings and API keys</p>
          </a>
          <a
            href="/admin/users"
            className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
          >
            <h3 className="font-medium text-gray-900">Manage Users</h3>
            <p className="text-sm text-gray-500">View and manage user accounts</p>
          </a>
          <a
            href="/admin/content"
            className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
          >
            <h3 className="font-medium text-gray-900">Manage Content</h3>
            <p className="text-sm text-gray-500">Edit courses, lessons, and exercises</p>
          </a>
        </div>
      </div>
    </div>
  );
}