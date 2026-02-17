// src/app/api/admin/webhooks/route.ts

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
    const {
      id,
      name,
      description,
      url,
      method,
      events,
      headers,
      is_enabled,
      signing_secret,
    } = body;

    if (id) {
      // Update existing webhook
      const updateData: Record<string, any> = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (url !== undefined) updateData.url = url;
      if (method !== undefined) updateData.method = method;
      if (events !== undefined) updateData.events = events;
      if (headers !== undefined) updateData.headers = headers;
      if (is_enabled !== undefined) updateData.is_enabled = is_enabled;
      if (signing_secret !== undefined) updateData.signing_secret = signing_secret;

      const { error } = await supabase
        .from("webhooks")
        .update(updateData)
        .eq("id", id);

      if (error) {
        console.error("Update error:", error);
        return NextResponse.json(
          { error: "Failed to update webhook" },
          { status: 500 }
        );
      }
    } else {
      // Create new webhook
      if (!name || !url || !events || events.length === 0) {
        return NextResponse.json(
          { error: "Name, URL, and at least one event are required" },
          { status: 400 }
        );
      }

      const { error } = await supabase.from("webhooks").insert({
        name,
        description,
        url,
        method: method || "POST",
        events,
        headers: headers || {},
        is_enabled: is_enabled ?? true,
        signing_secret: signing_secret || null,
      });

      if (error) {
        console.error("Insert error:", error);
        return NextResponse.json(
          { error: "Failed to create webhook" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhooks API error:", error);
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
      return NextResponse.json({ error: "Webhook ID required" }, { status: 400 });
    }

    const { error } = await supabase.from("webhooks").delete().eq("id", id);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete webhook" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhooks API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}