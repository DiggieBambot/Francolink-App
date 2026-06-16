import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Video,
  Calendar,
  Settings,
  DollarSign,
  ArrowLeft,
} from "lucide-react";
import { TutorSidebar } from "@/components/tutor/tutor-sidebar";
import { MobileSidebar } from "@/components/shared/mobile-sidebar";
import { Flame } from "lucide-react";

export const metadata = {
  title: "Tutor Dashboard | Francolink",
  description: "Manage your students and lessons on Francolink",
};

export default async function TutorLayout({
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

  const { data: userData } = await supabase
    .from("users")
    .select("role, name, email, avatar_url, commission_balance, tutor_plan")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "TUTOR" && userData?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Icons are passed by NAME (string) — Server Components can't hand component
  // functions to the client TutorSidebar.
  const navigation = [
    { name: "Dashboard", href: "/tutor", icon: "LayoutDashboard" },
    { name: "My Students", href: "/tutor/students", icon: "Users" },
    { name: "Lessons", href: "/tutor/lessons", icon: "BookOpen" },
    { name: "Live Sessions", href: "/tutor/sessions", icon: "Video" },
    { name: "Schedule", href: "/tutor/schedule", icon: "Calendar" },
    { name: "Commissions", href: "/tutor/commisions", icon: "DollarSign" },
    { name: "Settings", href: "/tutor/settings", icon: "Settings" },
  ];

  const commissionBalance = Number(userData?.commission_balance || 0);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-gray-100">
        <Link href="/tutor" className="flex items-center group">
          <Image src="/logo-new.png" alt="Francolink" width={126} height={36} className="group-hover:scale-[1.02] transition-transform" priority />
        </Link>
      </div>

      <TutorSidebar
        navigation={navigation}
        userName={userData?.name || "Tutor"}
        userEmail={userData?.email || user.email || ""}
        avatarUrl={userData?.avatar_url}
        tutorPlan={userData?.tutor_plan}
      />
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100 flex-col z-50 shadow-sm">
        {sidebarContent}
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <MobileSidebar>{sidebarContent}</MobileSidebar>
            <Link href="/tutor" className="flex items-center">
              <Image src="/logo-new.png" alt="Francolink" width={112} height={32} priority />
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {commissionBalance > 0 && (
              <Link
                href="/tutor/commissions"
                className="flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-lg text-xs font-bold"
              >
                <DollarSign className="w-3.5 h-3.5" />
                {commissionBalance.toFixed(2)}
              </Link>
            )}
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Student
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="min-h-screen p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}