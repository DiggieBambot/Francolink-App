// src/app/(admin)/admin/settings/settings-form.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Save, 
  Eye, 
  EyeOff, 
  CreditCard, 
  DollarSign, 
  ToggleLeft,
  Settings,
  Loader2
} from "lucide-react";

interface Setting {
  id: string;
  category: string;
  key: string;
  value: string | null;
  value_type: string;
  description: string | null;
  is_secret: boolean;
}

interface SettingsFormProps {
  groupedSettings: Record<string, Setting[]>;
}

const categoryIcons: Record<string, React.ReactNode> = {
  payments: <CreditCard className="w-5 h-5" />,
  pricing: <DollarSign className="w-5 h-5" />,
  features: <ToggleLeft className="w-5 h-5" />,
  limits: <Settings className="w-5 h-5" />,
  ai: <Settings className="w-5 h-5" />,
};

const categoryLabels: Record<string, string> = {
  payments: "Payment Settings",
  pricing: "Pricing Display",
  features: "Feature Flags",
  limits: "Plan Limits",
  ai: "AI Configuration",
};

export function SettingsForm({ groupedSettings }: SettingsFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    Object.values(groupedSettings)
      .flat()
      .forEach((setting) => {
        initial[setting.id] = setting.value || "";
      });
    return initial;
  });
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const toggleSecretVisibility = (id: string) => {
    setVisibleSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleChange = (id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleToggle = (id: string, currentValue: string) => {
    const newValue = currentValue === "true" ? "false" : "true";
    setValues((prev) => ({ ...prev, [id]: newValue }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedMessage("");

    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: values }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      setSavedMessage("Settings saved successfully!");
      router.refresh();
      
      setTimeout(() => setSavedMessage(""), 3000);
    } catch (error) {
      console.error("Save error:", error);
      setSavedMessage("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedSettings).map(([category, settings]) => (
        <div
          key={category}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          {/* Category Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                {categoryIcons[category] || <Settings className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">
                  {categoryLabels[category] || category}
                </h2>
                <p className="text-sm text-gray-500">
                  {category === "payments" && "Configure Stripe API keys and price IDs"}
                  {category === "pricing" && "Set display prices for your plans"}
                  {category === "features" && "Enable or disable app features"}
                  {category === "limits" && "Configure plan limits"}
                  {category === "ai" && "Configure AI settings"}
                </p>
              </div>
            </div>
          </div>

          {/* Settings List */}
          <div className="divide-y divide-gray-100">
            {settings.map((setting) => (
              <div key={setting.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={setting.id}
                      className="block text-sm font-medium text-gray-900"
                    >
                      {setting.key
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </label>
                    {setting.description && (
                      <p className="text-sm text-gray-500 mt-0.5">
                        {setting.description}
                      </p>
                    )}
                  </div>

                  <div className="w-80">
                    {setting.value_type === "boolean" ? (
                      <button
                        type="button"
                        onClick={() => handleToggle(setting.id, values[setting.id])}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          values[setting.id] === "true"
                            ? "bg-indigo-600"
                            : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            values[setting.id] === "true"
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    ) : (
                      <div className="relative">
                        <input
                          id={setting.id}
                          type={
                            setting.is_secret && !visibleSecrets.has(setting.id)
                              ? "password"
                              : setting.value_type === "number"
                                ? "number"
                                : "text"
                          }
                          value={values[setting.id]}
                          onChange={(e) => handleChange(setting.id, e.target.value)}
                          placeholder={setting.is_secret ? "••••••••" : "Not set"}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        />
                        {setting.is_secret && (
                          <button
                            type="button"
                            onClick={() => toggleSecretVisibility(setting.id)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                          >
                            {visibleSecrets.has(setting.id) ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Save Button */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-4">
        <div>
          {savedMessage && (
            <p
              className={`text-sm ${
                savedMessage.includes("success")
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {savedMessage}
            </p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}