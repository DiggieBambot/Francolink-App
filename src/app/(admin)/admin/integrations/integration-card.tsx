// src/app/(admin)/admin/integrations/integration-card.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, ExternalLink, Loader2 } from "lucide-react";

interface Integration {
  id: string;
  provider: string;
  name: string;
  description: string;
  is_enabled: boolean;
  config: Record<string, string>;
}

interface IntegrationCardProps {
  integration: Integration;
}

export function IntegrationCard({ integration }: IntegrationCardProps) {
  const router = useRouter();
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState(integration.config);
  const [enabled, setEnabled] = useState(integration.is_enabled);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: integration.id,
          config,
          is_enabled: enabled,
        }),
      });

      if (response.ok) {
        setShowConfig(false);
        router.refresh();
      } else {
        alert("Failed to save integration");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save integration");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);

    try {
      await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: integration.id,
          is_enabled: newEnabled,
        }),
      });
      router.refresh();
    } catch (error) {
      setEnabled(!newEnabled); // Revert on error
      console.error("Toggle error:", error);
    }
  };

  // Check if all required config fields have values
  const isConfigured = Object.values(config).every(
    (v) => v !== null && v !== ""
  );

  return (
    <>
      <div
        className={`relative p-4 rounded-xl border transition-all ${
          enabled
            ? "border-green-200 bg-green-50"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-medium text-gray-900">{integration.name}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {integration.description}
            </p>
          </div>
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? "bg-green-500" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              isConfigured
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {isConfigured ? "Configured" : "Not configured"}
          </span>
          <button
            onClick={() => setShowConfig(true)}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
          >
            <Settings className="w-4 h-4" />
            Configure
          </button>
        </div>
      </div>

      {/* Config Modal */}
      {showConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Configure {integration.name}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {Object.entries(config).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {key
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </label>
                  <input
                    type={key.includes("key") || key.includes("secret") ? "password" : "text"}
                    value={value || ""}
                    onChange={(e) =>
                      setConfig({ ...config, [key]: e.target.value })
                    }
                    placeholder={`Enter ${key.replace(/_/g, " ")}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              ))}

              <div className="flex items-center justify-between pt-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Enable integration</span>
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfig(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}