// src/app/(student)/settings/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsForm from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get user profile
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-primary">
          Settings
        </h1>
        <p className="text-gray-600 mt-1">
          Manage your account preferences
        </p>
      </div>

      <SettingsForm 
        user={{
          id: user.id,
          email: user.email || "",
          name: profile?.name || "",
          dailyGoalMinutes: profile?.daily_goal_minutes || 15,
          nativeLanguage: profile?.native_language || "en",
        }}
      />
    </div>
  );
}