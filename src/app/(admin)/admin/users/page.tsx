// src/app/(admin)/admin/users/page.tsx

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { 
  Users, 
  Crown, 
  Sparkles, 
  Search,
  ChevronLeft,
  ChevronRight,
  Mail,
  Calendar,
  Zap,
  Flame
} from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    plan?: string;
    role?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const page = parseInt(params.page || "1");
  const search = params.search || "";
  const planFilter = params.plan || "";
  const roleFilter = params.role || "";
  const perPage = 20;
  const offset = (page - 1) * perPage;

  // Build query
  let query = supabase
    .from("users")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + perPage - 1);

  // Apply search filter
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  // Apply plan filter
  if (planFilter) {
    query = query.eq("subscription_plan", planFilter);
  }

  // Apply role filter. "both" = a tutor who is also learning under another tutor.
  if (roleFilter === "student") query = query.eq("role", "USER");
  else if (roleFilter === "tutor") query = query.eq("role", "TUTOR");
  else if (roleFilter === "both") query = query.eq("role", "TUTOR").not("referred_by_tutor_id", "is", null);
  else if (roleFilter === "admin") query = query.eq("role", "ADMIN");
  else if (roleFilter === "community_manager") query = query.eq("role", "COMMUNITY_MANAGER");

  const { data: users, count, error } = await query;

  const totalPages = Math.ceil((count || 0) / perPage);

  // Get plan stats
  const { data: planStats } = await supabase
    .from("users")
    .select("subscription_plan")
    .then(({ data }) => {
      const stats = { FREE: 0, PREMIUM: 0, PREMIUM_PLUS: 0 };
      data?.forEach((u) => {
        const plan = u.subscription_plan || "FREE";
        if (plan in stats) stats[plan as keyof typeof stats]++;
      });
      return { data: stats };
    });

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "PREMIUM_PLUS":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
            <Sparkles className="w-3 h-3" />
            Premium+
          </span>
        );
      case "PREMIUM":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
            <Crown className="w-3 h-3" />
            Premium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            Free
          </span>
        );
    }
  };

  const getRoleBadge = (user: { role?: string; referred_by_tutor_id?: string | null }) => {
    const role = (user.role || "USER").toUpperCase();
    if (role === "ADMIN") {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Admin</span>;
    }
    if (role === "COMMUNITY_MANAGER") {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-fuchsia-100 text-fuchsia-700">Community Mgr</span>;
    }
    if (role === "TUTOR") {
      // A tutor who is also learning under another tutor = Student · Tutor.
      if (user.referred_by_tutor_id) {
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700">Student · Tutor</span>;
      }
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Tutor</span>;
    }
    return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Student</span>;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 mt-1">
            Manage your {count || 0} registered users
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{count || 0}</p>
              <p className="text-sm text-gray-500">Total Users</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Users className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {planStats?.FREE || 0}
              </p>
              <p className="text-sm text-gray-500">Free Users</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Crown className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {planStats?.PREMIUM || 0}
              </p>
              <p className="text-sm text-gray-500">Premium</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {planStats?.PREMIUM_PLUS || 0}
              </p>
              <p className="text-sm text-gray-500">Premium+</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <form className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Role Filter */}
          <select
            name="role"
            defaultValue={roleFilter}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="tutor">Tutor</option>
            <option value="both">Student · Tutor</option>
            <option value="admin">Admin</option>
            <option value="community_manager">Community Mgr</option>
          </select>

          {/* Plan Filter */}
          <select
            name="plan"
            defaultValue={planFilter}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Plans</option>
            <option value="FREE">Free</option>
            <option value="PREMIUM">Premium</option>
            <option value="PREMIUM_PLUS">Premium+</option>
          </select>

          {/* Submit */}
          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Filter
          </button>

          {/* Clear */}
          {(search || planFilter || roleFilter) && (
            <Link
              href="/admin/users"
              className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                  User
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                  Role
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                  Plan
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                  Stats
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                  Joined
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users?.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-indigo-600">
                            {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.name || "No name"}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getRoleBadge(user)}
                  </td>
                  <td className="px-6 py-4">
                    {getPlanBadge(user.subscription_plan || "FREE")}
                    {user.is_founding_member && (
                      <span className="ml-2 text-xs text-amber-600 font-medium">
                        Founder
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-orange-600">
                        <Flame className="w-4 h-4" />
                        {user.current_streak || 0}
                      </span>
                      <span className="flex items-center gap-1 text-yellow-600">
                        <Zap className="w-4 h-4" />
                        {user.total_xp || 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(user.created_at)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}

              {(!users || users.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No users found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {offset + 1} to {Math.min(offset + perPage, count || 0)} of{" "}
              {count} users
            </p>
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/users?page=${page - 1}${search ? `&search=${search}` : ""}${planFilter ? `&plan=${planFilter}` : ""}${roleFilter ? `&role=${roleFilter}` : ""}`}
                className={`p-2 rounded-lg border ${
                  page <= 1
                    ? "border-gray-200 text-gray-300 pointer-events-none"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Link
                href={`/admin/users?page=${page + 1}${search ? `&search=${search}` : ""}${planFilter ? `&plan=${planFilter}` : ""}${roleFilter ? `&role=${roleFilter}` : ""}`}
                className={`p-2 rounded-lg border ${
                  page >= totalPages
                    ? "border-gray-200 text-gray-300 pointer-events-none"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}