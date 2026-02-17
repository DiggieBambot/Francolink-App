// src/app/(admin)/admin/integrations/page.tsx

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  BarChart3,
  Mail,
  MessageSquare,
  Brain,
  AlertTriangle,
  Code,
  Webhook,
  ChevronRight,
  CheckCircle,
  XCircle,
  Settings,
} from "lucide-react";
import { IntegrationCard } from "./integration-card";

const categoryConfig: Record<
  string,
  { icon: React.ReactNode; label: string; description: string }
> = {
  analytics: {
    icon: <BarChart3 className="w-5 h-5" />,
    label: "Analytics & Tracking",
    description: "Track user behavior and website traffic",
  },
  email: {
    icon: <Mail className="w-5 h-5" />,
    label: "Email Marketing",
    description: "Email campaigns and automation",
  },
  chat: {
    icon: <MessageSquare className="w-5 h-5" />,
    label: "Live Chat & Support",
    description: "Customer support and chat widgets",
  },
  ai: {
    icon: <Brain className="w-5 h-5" />,
    label: "AI Services",
    description: "AI models and text-to-speech",
  },
  monitoring: {
    icon: <AlertTriangle className="w-5 h-5" />,
    label: "Error Monitoring",
    description: "Track errors and session replays",
  },
};

export default async function AdminIntegrationsPage() {
  const supabase = await createClient();

  // Fetch all integrations
  const { data: integrations } = await supabase
    .from("integrations")
    .select("*")
    .order("category")
    .order("name");

  // Fetch script and webhook counts
  const { count: scriptCount } = await supabase
    .from("script_injections")
    .select("*", { count: "exact", head: true });

  const { count: webhookCount } = await supabase
    .from("webhooks")
    .select("*", { count: "exact", head: true });

  const { count: enabledScripts } = await supabase
    .from("script_injections")
    .select("*", { count: "exact", head: true })
    .eq("is_enabled", true);

  const { count: enabledWebhooks } = await supabase
    .from("webhooks")
    .select("*", { count: "exact", head: true })
    .eq("is_enabled", true);

  // Group integrations by category
  const groupedIntegrations: Record<string, any[]> = {};
  integrations?.forEach((integration) => {
    if (!groupedIntegrations[integration.category]) {
      groupedIntegrations[integration.category] = [];
    }
    groupedIntegrations[integration.category].push(integration);
  });

  // Count enabled integrations
  const enabledCount = integrations?.filter((i) => i.is_enabled).length || 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-500 mt-1">
          Connect third-party services and manage custom scripts
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Integrations</p>
              <p className="text-2xl font-bold text-gray-900">{enabledCount}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Custom Scripts</p>
              <p className="text-2xl font-bold text-gray-900">
                {enabledScripts || 0}
                <span className="text-sm font-normal text-gray-400">
                  /{scriptCount || 0}
                </span>
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Code className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Webhooks</p>
              <p className="text-2xl font-bold text-gray-900">
                {enabledWebhooks || 0}
                <span className="text-sm font-normal text-gray-400">
                  /{webhookCount || 0}
                </span>
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Webhook className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>

        <Link
          href="/admin/settings"
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:border-indigo-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Stripe & Payments</p>
              <p className="text-sm font-medium text-indigo-600">
                Configure in Settings →
              </p>
            </div>
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Settings className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link
          href="/admin/integrations/scripts"
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-indigo-300 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Code className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Custom Scripts</h3>
                <p className="text-sm text-gray-500">
                  Add tracking pixels, chat widgets, and custom code
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
          </div>
        </Link>

        <Link
          href="/admin/integrations/webhooks"
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-indigo-300 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Webhook className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Outgoing Webhooks</h3>
                <p className="text-sm text-gray-500">
                  Send events to Zapier, Make, and other services
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
          </div>
        </Link>
      </div>

      {/* Integration Categories */}
      <div className="space-y-6">
        {Object.entries(categoryConfig).map(([category, config]) => {
          const categoryIntegrations = groupedIntegrations[category] || [];
          if (categoryIntegrations.length === 0) return null;

          return (
            <div
              key={category}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Category Header */}
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    {config.icon}
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">{config.label}</h2>
                    <p className="text-sm text-gray-500">{config.description}</p>
                  </div>
                </div>
              </div>

              {/* Integrations Grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryIntegrations.map((integration) => (
                    <IntegrationCard
                      key={integration.id}
                      integration={integration}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}