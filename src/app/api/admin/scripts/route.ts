// src/app/api/admin/scripts/route.ts

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
    const { id, name, description, position, script_content, is_enabled } = body;

    if (id) {
      // Update existing script
      const updateData: Record<string, any> = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (position !== undefined) updateData.position = position;
      if (script_content !== undefined) updateData.script_content = script_content;
      if (is_enabled !== undefined) updateData.is_enabled = is_enabled;

      const { error } = await supabase
        .from("script_injections")
        .update(updateData)
        .eq("id", id);

      if (error) {
        console.error("Update error:", error);
        return NextResponse.json(
          { error: "Failed to update script" },
          { status: 500 }
        );
      }
    } else {
      // Create new script
      if (!name || !position || !script_content) {
        return NextResponse.json(
          { error: "Name, position, and script content are required" },
          { status: 400 }
        );
      }

      // Get max order_index for this position
      const { data: maxOrder } = await supabase
        .from("script_injections")
        .select("order_index")
        .eq("position", position)
        .order("order_index", { ascending: false })
        .limit(1)
        .single();

      const order_index = (maxOrder?.order_index || 0) + 1;

      const { error } = await supabase.from("script_injections").insert({
        name,
        description,
        position,
        script_content,
        is_enabled: is_enabled ?? true,
        order_index,
      });

      if (error) {
        console.error("Insert error:", error);
        return NextResponse.json(
          { error: "Failed to create script" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Scripts API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Script ID required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("script_injections")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete script" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Scripts API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}