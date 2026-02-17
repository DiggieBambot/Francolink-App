// src/app/(admin)/admin/integrations/webhooks/page.tsx

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, Webhook, Info } from "lucide-react";
import { WebhooksList } from "./webhooks-list";

export default async function AdminWebhooksPage() {
  const supabase = await createClient();

  const { data: webhooks } = await supabase
    .from("webhooks")
    .select("*")
    .order("created_at", { ascending: false });

  // Get recent logs
  const { data: recentLogs } = await supabase
    .from("webhook_logs")
    .select("*, webhooks(name)")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/integrations"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Integrations
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Outgoing Webhooks</h1>
          <p className="text-gray-500 mt-1">
            Send events to external services like Zapier, Make, and custom endpoints
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-purple-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-purple-800">Available Events</h3>
            <div className="text-sm text-purple-700 mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <p className="font-medium">User</p>
                <ul className="text-xs space-y-0.5">
                  <li>• user.signup</li>
                  <li>• user.updated</li>
                  <li>• user.deleted</li>
                </ul>
              </div>
              <div>
                <p className="font-medium">Subscription</p>
                <ul className="text-xs space-y-0.5">
                  <li>• subscription.created</li>
                  <li>• subscription.upgraded</li>
                  <li>• subscription.cancelled</li>
                </ul>
              </div>
              <div>
                <p className="font-medium">Learning</p>
                <ul className="text-xs space-y-0.5">
                  <li>• lesson.completed</li>
                  <li>• unit.completed</li>
                  <li>• course.completed</li>
                </ul>
              </div>
              <div>
                <p className="font-medium">Engagement</p>
                <ul className="text-xs space-y-0.5">
                  <li>• streak.milestone</li>
                  <li>• xp.milestone</li>
                  <li>• placement_test.completed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Webhooks List */}
      <WebhooksList webhooks={webhooks || []} recentLogs={recentLogs || []} />
    </div>
  );
}