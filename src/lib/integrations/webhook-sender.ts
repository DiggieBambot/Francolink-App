// src/lib/integrations/webhook-sender.ts

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Use service role for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Types ───────────────────────────────────────────────────────

export type WebhookEvent =
  // User events
  | "user.signup"
  | "user.updated"
  | "user.deleted"
  // Subscription events
  | "subscription.created"
  | "subscription.upgraded"
  | "subscription.downgraded"
  | "subscription.cancelled"
  | "subscription.payment_failed"
  // Learning events
  | "lesson.completed"
  | "unit.completed"
  | "course.completed"
  // Engagement events
  | "streak.milestone"
  | "xp.milestone"
  | "achievement.unlocked"
  // Placement test
  | "placement_test.completed";

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, any>;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  method: string;
  events: string[];
  headers: Record<string, string>;
  is_enabled: boolean;
  signing_secret: string | null;
  retry_count: number;
  retry_delay_seconds: number;
}

// ─── Core Functions ──────────────────────────────────────────────

/**
 * Send webhooks for a specific event
 */
export async function sendWebhooks(
  event: WebhookEvent,
  data: Record<string, any>
): Promise<void> {
  try {
    // Get all enabled webhooks that listen to this event
    const { data: webhooks, error } = await supabaseAdmin
      .from("webhooks")
      .select("*")
      .eq("is_enabled", true)
      .contains("events", [event]);

    if (error) {
      console.error("Failed to fetch webhooks:", error);
      return;
    }

    if (!webhooks || webhooks.length === 0) {
      return; // No webhooks configured for this event
    }

    // Send to each webhook
    const promises = webhooks.map((webhook) =>
      sendToWebhook(webhook, event, data)
    );

    await Promise.allSettled(promises);
  } catch (error) {
    console.error("Error sending webhooks:", error);
  }
}

/**
 * Send payload to a single webhook
 */
async function sendToWebhook(
  webhook: Webhook,
  event: WebhookEvent,
  data: Record<string, any>
): Promise<void> {
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
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
  const { data: logEntry } = await supabaseAdmin
    .from("webhook_logs")
    .insert({
      webhook_id: webhook.id,
      event_type: event,
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
    await supabaseAdmin
      .from("webhook_logs")
      .update({
        status: response.ok ? "success" : "failed",
        status_code: response.status,
        response_body: responseBody.slice(0, 1000), // Limit response size
        delivered_at: response.ok ? new Date().toISOString() : null,
        error_message: response.ok ? null : `HTTP ${response.status}`,
      })
      .eq("id", logEntry?.id);

    if (!response.ok) {
      console.error(
        `Webhook failed: ${webhook.name} - HTTP ${response.status}`
      );
      // TODO: Schedule retry if configured
    }
  } catch (error) {
    // Network error
    await supabaseAdmin
      .from("webhook_logs")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Network error",
      })
      .eq("id", logEntry?.id);

    console.error(`Webhook error: ${webhook.name}`, error);
  }
}

// ─── Convenience Functions ───────────────────────────────────────

export async function onUserSignup(user: {
  id: string;
  email: string;
  name?: string;
}) {
  await sendWebhooks("user.signup", {
    user_id: user.id,
    email: user.email,
    name: user.name,
  });
}

export async function onSubscriptionCreated(data: {
  user_id: string;
  email: string;
  plan: string;
  period: string;
  is_founding_member: boolean;
}) {
  await sendWebhooks("subscription.created", data);
}

export async function onSubscriptionUpgraded(data: {
  user_id: string;
  email: string;
  from_plan: string;
  to_plan: string;
}) {
  await sendWebhooks("subscription.upgraded", data);
}

export async function onSubscriptionCancelled(data: {
  user_id: string;
  email: string;
  plan: string;
  reason?: string;
}) {
  await sendWebhooks("subscription.cancelled", data);
}

export async function onLessonCompleted(data: {
  user_id: string;
  lesson_id: string;
  lesson_title: string;
  course: string;
  score: number;
  xp_earned: number;
}) {
  await sendWebhooks("lesson.completed", data);
}

export async function onStreakMilestone(data: {
  user_id: string;
  email: string;
  streak_days: number;
}) {
  await sendWebhooks("streak.milestone", data);
}

export async function onPlacementTestCompleted(data: {
  user_id: string;
  email: string;
  level: string;
  score: number;
}) {
  await sendWebhooks("placement_test.completed", data);
}