// src/app/api/admin/users/action/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (adminProfile?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get action from request
    const body = await request.json();
    const { userId, action } = body as { userId: string; action: string };

    if (!userId || !action) {
      return NextResponse.json(
        { error: "Missing userId or action" },
        { status: 400 }
      );
    }

    // Perform action
    let updateData: Record<string, any> = {};

    switch (action) {
      case "set_premium":
        updateData = { subscription_plan: "PREMIUM" };
        break;

      case "set_premium_plus":
        updateData = { subscription_plan: "PREMIUM_PLUS" };
        break;

      case "remove_subscription":
        updateData = {
          subscription_plan: "FREE",
          stripe_subscription_id: null,
          subscription_ends_at: null,
          subscription_period: null,
        };
        break;

      case "make_admin":
        updateData = { role: "ADMIN" };
        break;

      case "remove_admin":
        // Prevent removing own admin status
        if (userId === user.id) {
          return NextResponse.json(
            { error: "Cannot remove your own admin status" },
            { status: 400 }
          );
        }
        updateData = { role: "USER" };
        break;

      case "reset_streak":
        updateData = {
          current_streak: 0,
          last_activity_date: null,
        };
        break;

      default:
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 }
        );
    }

    // Update user
    const { error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId);

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Action error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}