// src/app/api/ai-tutor/usage/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PLANS, PlanKey, isPaidPlan } from "@/lib/config/subscription";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("users")
      .select("subscription_plan, ai_minutes_used_today, ai_usage_reset_date, role")
      .eq("id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 });
    }

    const role = data.role?.toUpperCase() || "STUDENT";
    const isPrivileged = role === "ADMIN" || role === "TESTER";
    const plan = (data.subscription_plan || "FREE") as PlanKey;
    const planConfig = PLANS[plan];
    const today = getToday();

    let minutesUsed = data.ai_minutes_used_today ?? 0;

    if (data.ai_usage_reset_date !== today) {
      await supabase
        .from("users")
        .update({ ai_minutes_used_today: 0, ai_usage_reset_date: today })
        .eq("id", user.id);
      minutesUsed = 0;
    }

    const hasAccess = isPaidPlan(plan) || isPrivileged;
    const dailyLimit = isPrivileged ? Infinity : planConfig.aiMinutesPerDay;
    const remaining = isPrivileged ? Infinity : Math.max(0, dailyLimit - minutesUsed);

    return NextResponse.json({
      hasAccess,
      plan,
      minutesUsed: isPrivileged ? 0 : minutesUsed,
      dailyLimit,
      remainingMinutes: remaining,
      isPrivileged,
    });
  } catch (error) {
    console.error("AI usage check error:", error);
    return NextResponse.json({ error: "Failed to check usage" }, { status: 500 });
  }
}
