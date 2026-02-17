// src/app/api/admin/webhooks/test/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

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
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Webhook ID required" }, { status: 400 });
    }

    // Get webhook
    const { data: webhook, error: fetchError } = await supabase
      .from("webhooks")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    // Create test payload
    const payload = {
      event: "test",
      timestamp: new Date().toISOString(),
      data: {
        message: "This is a test webhook from FrancoLink",
        webhook_id: webhook.id,
        webhook_name: webhook.name,
      },
    };

    const payloadString = JSON.stringify(payload);

    // Build headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "FrancoLink-Webhook/1.0",
      ...webhook.headers,
    };

    // Add signature if signing secret is configured
    if (webhook.signing_secret) {
      const signature = crypto
        .createHmac("sha256", webhook.signing_secret)
        .update(payloadString)
        .digest("hex");
      headers["X-Webhook-Signature"] = `sha256=${signature}`;
    }

    // Create log entry
    const { data: logEntry } = await supabase
      .from("webhook_logs")
      .insert({
        webhook_id: webhook.id,
        event_type: "test",
        payload,
        status: "pending",
        attempt_number: 1,
      })
      .select("id")
      .single();

    try {
      const response = await fetch(webhook.url, {
        method: webhook.method,
        headers,
        body: payloadString,
      });

      const responseBody = await response.text().catch(() => "");

      // Update log with result
      await supabase
        .from("webhook_logs")
        .update({
          status: response.ok ? "success" : "failed",
          status_code: response.status,
          response_body: responseBody.slice(0, 1000),
          delivered_at: response.ok ? new Date().toISOString() : null,
          error_message: response.ok ? null : `HTTP ${response.status}`,
        })
        .eq("id", logEntry?.id);

      return NextResponse.json({
        success: response.ok,
        status_code: response.status,
        response_body: responseBody.slice(0, 500),
      });
    } catch (error) {
      // Network error
      const errorMessage =
        error instanceof Error ? error.message : "Network error";

      await supabase
        .from("webhook_logs")
        .update({
          status: "failed",
          error_message: errorMessage,
        })
        .eq("id", logEntry?.id);

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Webhook test error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}