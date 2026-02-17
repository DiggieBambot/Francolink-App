// src/app/[locale]/(student)/layout.tsx
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StudentSidebar } from "@/components/student/sidebar";
import { StudentHeader } from "@/components/student/header";

interface StudentLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function StudentLayout({
  children,
  params,
}: StudentLayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentHeader user={profile} />
      <div className="flex">
        <StudentSidebar locale={locale} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}