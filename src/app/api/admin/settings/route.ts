// src/app/api/admin/settings/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clearAIConfigCache } from "@/lib/ai/client";

/**
 * Save a category of settings by key (Admin > Settings > AI sends this).
 * Only keys that already exist in that category are updated, and an empty
 * value never overwrites a secret, so saving the page without retyping an API
 * key cannot wipe it.
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
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

    const body = (await request.json()) as {
      category?: string;
      settings?: Array<{ key: string; value: unknown }>;
    };
    const category = String(body.category ?? "").trim();
    if (!category || !Array.isArray(body.settings)) {
      return NextResponse.json({ error: "category and settings are required" }, { status: 400 });
    }

    const { data: existing, error: readError } = await supabase
      .from("app_settings")
      .select("key, is_secret")
      .eq("category", category);
    if (readError) throw readError;
    const known = new Map(
      (existing ?? []).map((s: { key: string; is_secret: boolean | null }) => [s.key, !!s.is_secret])
    );

    const now = new Date().toISOString();
    const results = await Promise.all(
      body.settings
        .filter((s) => known.has(s.key))
        .map((s) => ({ key: s.key, value: s.value == null ? "" : String(s.value) }))
        .filter((s) => !(known.get(s.key) && s.value === ""))
        .map((s) =>
          supabase
            .from("app_settings")
            .update({ value: s.value, updated_at: now })
            .eq("category", category)
            .eq("key", s.key)
        )
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) throw failed.error;

    // The AI config is cached in memory; drop it so the change applies now.
    if (category === "ai") clearAIConfigCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

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

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get settings from request
    const body = await request.json();
    const { settings } = body as { settings: Record<string, string> };

    // Update each setting
    const updates = Object.entries(settings).map(([id, value]) =>
      supabase
        .from("app_settings")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("id", id)
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}