import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users,
  DollarSign,
  TrendingUp,
  Video,
  BookOpen,
  ArrowRight,
  ArrowUpRight,
  Calendar,
} from "lucide-react";

export default async function TutorDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: tutorData } = await supabase
    .from("users")
    .select("commission_balance, tutor_plan, name")
    .eq("id", user.id)
    .single();

  const { count: totalStudents } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("referred_by_tutor_id", user.id);

  const { count: payingStudents } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("referred_by_tutor_id", user.id)
    .neq("subscription_plan", "FREE");

  const { count: activeSessions } = await supabase
    .from("tutor_sessions")
    .select("*", { count: "exact", head: true })
    .eq("tutor_id", user.id)
    .eq("status", "active");

  const { count: upcomingSessions } = await supabase
    .from("tutor_sessions")
    .select("*", { count: "exact", head: true })
    .eq("tutor_id", user.id)
    .eq("status", "scheduled");

  const commissionBalance = parseFloat(tutorData?.commission_balance || "0");
  const conversionRate = totalStudents
    ? Math.round(((payingStudents || 0) / totalStudents) * 100)
    : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const firstName = tutorData?.name?.split(" ")[0] || "Tutor";

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-primary">
          Welcome back, {firstName}! 👋
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Here&apos;s what&apos;s happening with your students
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Students
            </span>
            <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-3xl font-heading font-extrabold text-primary">
            {totalStudents || 0}
          </p>
          <p className="text-xs text-gray-400 mt-1 font-medium">
            {payingStudents || 0} paying
          </p>
        </div>

        {/* Commission Balance */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-green-100 uppercase tracking-wider">
                Balance
              </span>
              <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-3xl font-heading font-extrabold">
              {formatCurrency(commissionBalance)}
            </p>
            <Link
              href="/tutor/commissions"
              className="text-xs text-green-100 hover:text-white mt-1 inline-flex items-center gap-1 font-medium"
            >
              View details
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Sessions */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sessions
            </span>
            <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
              <Video className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-heading font-extrabold text-primary">
            {activeSessions || 0}
          </p>
          <p className="text-xs text-gray-400 mt-1 font-medium">
            {upcomingSessions || 0} upcoming
          </p>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Conversion
            </span>
            <div className="w-9 h-9 bg-secondary-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-secondary" />
            </div>
          </div>
          <p className="text-3xl font-heading font-extrabold text-primary">
            {conversionRate}%
          </p>
          <p className="text-xs text-gray-400 mt-1 font-medium">
            students paying
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-heading font-bold text-primary mb-4">
          Quick Actions
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              href: "/tutor/sessions",
              icon: Video,
              title: "Live Sessions",
              desc: "Manage your teaching sessions",
              iconBg: "bg-primary-50",
              iconColor: "text-primary",
            },
            {
              href: "/tutor/students",
              icon: Users,
              title: "My Students",
              desc: "Track student progress",
              iconBg: "bg-purple-50",
              iconColor: "text-purple-600",
            },
            {
              href: "/tutor/commissions",
              icon: DollarSign,
              title: "Commissions",
              desc: "View earnings & withdraw",
              iconBg: "bg-green-50",
              iconColor: "text-green-600",
            },
            {
              href: "/tutor/lessons",
              icon: BookOpen,
              title: "Lessons",
              desc: "Browse and manage lesson content",
              iconBg: "bg-secondary-50",
              iconColor: "text-secondary-700",
            },
            {
              href: "/tutor/schedule",
              icon: Calendar,
              title: "Schedule",
              desc: "Set your availability",
              iconBg: "bg-blue-50",
              iconColor: "text-blue-600",
            },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group bg-white rounded-2xl shadow-soft border border-gray-100 p-6 hover:shadow-medium hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 ${action.iconBg} rounded-xl group-hover:scale-110 transition-transform`}
                >
                  <action.icon className={`w-5 h-5 ${action.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-primary text-sm">
                    {action.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {action.desc}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-secondary group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}