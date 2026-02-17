// src/app/api/admin/integrations/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, config, is_enabled } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Integration ID required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {};
    if (config !== undefined) updateData.config = config;
    if (is_enabled !== undefined) updateData.is_enabled = is_enabled;

    const { error } = await supabase
      .from("integrations")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json(
        { error: "Failed to update integration" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Integration API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}