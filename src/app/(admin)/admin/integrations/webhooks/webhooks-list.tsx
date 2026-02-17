// src/app/(admin)/admin/integrations/webhooks/webhooks-list.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Edit2,
  Webhook,
  Loader2,
  X,
  Check,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface WebhookType {
  id: string;
  name: string;
  description: string | null;
  url: string;
  method: string;
  events: string[];
  headers: Record<string, string>;
  is_enabled: boolean;
  signing_secret: string | null;
  retry_count: number;
}

interface WebhookLog {
  id: string;
  webhook_id: string;
  event_type: string;
  status: string;
  status_code: number | null;
  created_at: string;
  webhooks: { name: string } | null;
}

interface WebhooksListProps {
  webhooks: WebhookType[];
  recentLogs: WebhookLog[];
}

const availableEvents = [
  { value: "user.signup", label: "User Signup" },
  { value: "user.updated", label: "User Updated" },
  { value: "user.deleted", label: "User Deleted" },
  { value: "subscription.created", label: "Subscription Created" },
  { value: "subscription.upgraded", label: "Subscription Upgraded" },
  { value: "subscription.downgraded", label: "Subscription Downgraded" },
  { value: "subscription.cancelled", label: "Subscription Cancelled" },
  { value: "subscription.payment_failed", label: "Payment Failed" },
  { value: "lesson.completed", label: "Lesson Completed" },
  { value: "unit.completed", label: "Unit Completed" },
  { value: "course.completed", label: "Course Completed" },
  { value: "streak.milestone", label: "Streak Milestone" },
  { value: "xp.milestone", label: "XP Milestone" },
  { value: "achievement.unlocked", label: "Achievement Unlocked" },
  { value: "placement_test.completed", label: "Placement Test Completed" },
];

export function WebhooksList({ webhooks, recentLogs }: WebhooksListProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookType | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    url: "",
    method: "POST",
    events: [] as string[],
    headers: {} as Record<string, string>,
    is_enabled: true,
    signing_secret: "",
  });

  const [newHeaderKey, setNewHeaderKey] = useState("");
  const [newHeaderValue, setNewHeaderValue] = useState("");

  const openCreateModal = () => {
    setEditingWebhook(null);
    setFormData({
      name: "",
      description: "",
      url: "",
      method: "POST",
      events: [],
      headers: {},
      is_enabled: true,
      signing_secret: "",
    });
    setShowModal(true);
  };

  const openEditModal = (webhook: WebhookType) => {
    setEditingWebhook(webhook);
    setFormData({
      name: webhook.name,
      description: webhook.description || "",
      url: webhook.url,
      method: webhook.method,
      events: webhook.events,
      headers: webhook.headers || {},
      is_enabled: webhook.is_enabled,
      signing_secret: webhook.signing_secret || "",
    });
    setShowModal(true);
  };

  const toggleEvent = (event: string) => {
    if (formData.events.includes(event)) {
      setFormData({
        ...formData,
        events: formData.events.filter((e) => e !== event),
      });
    } else {
      setFormData({
        ...formData,
        events: [...formData.events, event],
      });
    }
  };

  const addHeader = () => {
    if (newHeaderKey && newHeaderValue) {
      setFormData({
        ...formData,
        headers: { ...formData.headers, [newHeaderKey]: newHeaderValue },
      });
      setNewHeaderKey("");
      setNewHeaderValue("");
    }
  };

  const removeHeader = (key: string) => {
    const newHeaders = { ...formData.headers };
    delete newHeaders[key];
    setFormData({ ...formData, headers: newHeaders });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.url || formData.events.length === 0) {
      alert("Name, URL, and at least one event are required");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingWebhook?.id,
          ...formData,
        }),
      });

      if (response.ok) {
        setShowModal(false);
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to save webhook");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save webhook");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this webhook?")) return;

    setDeleting(id);
    try {
      const response = await fetch(`/api/admin/webhooks?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert("Failed to delete webhook");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete webhook");
    } finally {
      setDeleting(null);
    }
  };

  const handleTest = async (webhook: WebhookType) => {
    setTesting(webhook.id);
    try {
      const response = await fetch("/api/admin/webhooks/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: webhook.id }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(`Test successful! Status: ${data.status_code}`);
      } else {
        alert(`Test failed: ${data.error}`);
      }
      router.refresh();
    } catch (error) {
      console.error("Test error:", error);
      alert("Failed to test webhook");
    } finally {
      setTesting(null);
    }
  };

  const handleToggle = async (webhook: WebhookType) => {
    try {
      await fetch("/api/admin/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: webhook.id,
          is_enabled: !webhook.is_enabled,
        }),
      });
      router.refresh();
    } catch (error) {
      console.error("Toggle error:", error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Webhooks List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Configured Webhooks</h2>
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Webhook
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              {webhooks.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Webhook className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No webhooks configured</p>
                  <button
                    onClick={openCreateModal}
                    className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Add your first webhook
                  </button>
                </div>
              ) : (
                webhooks.map((webhook) => (
                  <div key={webhook.id} className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">
                            {webhook.name}
                          </h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              webhook.is_enabled
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {webhook.is_enabled ? "Active" : "Disabled"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 truncate">
                          {webhook.url}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {webhook.events.slice(0, 3).map((event) => (
                            <span
                              key={event}
                              className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded"
                            >
                              {event}
                            </span>
                          ))}
                          {webhook.events.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{webhook.events.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleTest(webhook)}
                          disabled={testing === webhook.id}
                          className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {testing === webhook.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Test"
                          )}
                        </button>
                        <button
                          onClick={() => handleToggle(webhook)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            webhook.is_enabled ? "bg-green-500" : "bg-gray-200"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              webhook.is_enabled ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => openEditModal(webhook)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(webhook.id)}
                          disabled={deleting === webhook.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {deleting === webhook.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Logs */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Recent Deliveries</h2>
            </div>

            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {recentLogs.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No deliveries yet</p>
                </div>
              ) : (
                recentLogs.map((log) => (
                  <div key={log.id} className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {log.status === "success" ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : log.status === "failed" ? (
                        <XCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-500" />
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        {log.event_type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {log.webhooks?.name || "Unknown"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(log.created_at)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingWebhook ? "Edit Webhook" : "Add New Webhook"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Zapier - New User"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Method
                  </label>
                  <select
                    value={formData.method}
                    onChange={(e) =>
                      setFormData({ ...formData, method: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL *
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  placeholder="https://hooks.zapier.com/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="e.g., Sends new user data to Zapier for email automation"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Events * (Select at least one)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {availableEvents.map((event) => (
                    <label
                      key={event.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.events.includes(event.value)}
                        onChange={() => toggleEvent(event.value)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{event.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Headers (Optional)
                </label>
                <div className="space-y-2">
                  {Object.entries(formData.headers).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {key}
                      </span>
                      <span className="text-gray-400">=</span>
                      <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                        {value}
                      </span>
                      <button
                        onClick={() => removeHeader(key)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newHeaderKey}
                      onChange={(e) => setNewHeaderKey(e.target.value)}
                      placeholder="Header name"
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      value={newHeaderValue}
                      onChange={(e) => setNewHeaderValue(e.target.value)}
                      placeholder="Value"
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                    />
                    <button
                      onClick={addHeader}
                      className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Signing Secret (Optional)
                </label>
                <input
                  type="password"
                  value={formData.signing_secret}
                  onChange={(e) =>
                    setFormData({ ...formData, signing_secret: e.target.value })
                  }
                  placeholder="Used to sign payloads for verification"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  If set, payloads will include an X-Webhook-Signature header
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="webhook_enabled"
                  checked={formData.is_enabled}
                  onChange={(e) =>
                    setFormData({ ...formData, is_enabled: e.target.checked })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="webhook_enabled" className="text-sm text-gray-700">
                  Enable this webhook
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {editingWebhook ? "Save Changes" : "Add Webhook"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}