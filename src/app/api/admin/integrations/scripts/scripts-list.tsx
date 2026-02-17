// src/app/(admin)/admin/integrations/scripts/scripts-list.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Edit2,
  GripVertical,
  Code,
  Loader2,
  X,
  Check,
} from "lucide-react";

interface Script {
  id: string;
  name: string;
  description: string | null;
  position: "head" | "body_start" | "body_end";
  script_content: string;
  is_enabled: boolean;
  order_index: number;
}

interface ScriptsListProps {
  groupedScripts: {
    head: Script[];
    body_start: Script[];
    body_end: Script[];
  };
}

const positionLabels: Record<string, string> = {
  head: "Head Scripts",
  body_start: "Body Start Scripts",
  body_end: "Body End Scripts",
};

const positionDescriptions: Record<string, string> = {
  head: "Injected in <head> — Best for analytics and meta tags",
  body_start: "Injected at start of <body> — Best for critical scripts",
  body_end: "Injected at end of <body> — Best for chat widgets and deferred loading",
};

export function ScriptsList({ groupedScripts }: ScriptsListProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    position: "head" as "head" | "body_start" | "body_end",
    script_content: "",
    is_enabled: true,
  });

  const openCreateModal = (position: "head" | "body_start" | "body_end") => {
    setEditingScript(null);
    setFormData({
      name: "",
      description: "",
      position,
      script_content: "",
      is_enabled: true,
    });
    setShowModal(true);
  };

  const openEditModal = (script: Script) => {
    setEditingScript(script);
    setFormData({
      name: script.name,
      description: script.description || "",
      position: script.position,
      script_content: script.script_content,
      is_enabled: script.is_enabled,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.script_content) {
      alert("Name and script content are required");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingScript?.id,
          ...formData,
        }),
      });

      if (response.ok) {
        setShowModal(false);
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to save script");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save script");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this script?")) return;

    setDeleting(id);
    try {
      const response = await fetch(`/api/admin/scripts?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert("Failed to delete script");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete script");
    } finally {
      setDeleting(null);
    }
  };

  const handleToggle = async (script: Script) => {
    try {
      await fetch("/api/admin/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: script.id,
          is_enabled: !script.is_enabled,
        }),
      });
      router.refresh();
    } catch (error) {
      console.error("Toggle error:", error);
    }
  };

  const renderScriptSection = (
    position: "head" | "body_start" | "body_end",
    scripts: Script[]
  ) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">
              {positionLabels[position]}
            </h2>
            <p className="text-sm text-gray-500">{positionDescriptions[position]}</p>
          </div>
          <button
            onClick={() => openCreateModal(position)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Script
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {scripts.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <Code className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No scripts added yet</p>
          </div>
        ) : (
          scripts.map((script) => (
            <div
              key={script.id}
              className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-4">
                <GripVertical className="w-4 h-4 text-gray-300" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{script.name}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        script.is_enabled
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {script.is_enabled ? "Active" : "Disabled"}
                    </span>
                  </div>
                  {script.description && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      {script.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1 font-mono">
                    {script.script_content.slice(0, 50)}...
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(script)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    script.is_enabled ? "bg-green-500" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      script.is_enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <button
                  onClick={() => openEditModal(script)}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(script.id)}
                  disabled={deleting === script.id}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleting === script.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="space-y-6">
        {renderScriptSection("head", groupedScripts.head)}
        {renderScriptSection("body_start", groupedScripts.body_start)}
        {renderScriptSection("body_end", groupedScripts.body_end)}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingScript ? "Edit Script" : "Add New Script"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
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
                  placeholder="e.g., Google Analytics"
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
                  placeholder="e.g., Tracks page views and user behavior"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position *
                </label>
                <select
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      position: e.target.value as "head" | "body_start" | "body_end",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="head">Head (before page content)</option>
                  <option value="body_start">Body Start (after opening body tag)</option>
                  <option value="body_end">Body End (before closing body tag)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Script Content *
                </label>
                <textarea
                  value={formData.script_content}
                  onChange={(e) =>
                    setFormData({ ...formData, script_content: e.target.value })
                  }
                  placeholder={`<script>\n  // Your code here\n</script>`}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Include the full script tag, e.g., &lt;script&gt;...&lt;/script&gt;
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_enabled"
                  checked={formData.is_enabled}
                  onChange={(e) =>
                    setFormData({ ...formData, is_enabled: e.target.checked })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="is_enabled" className="text-sm text-gray-700">
                  Enable this script
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
                {editingScript ? "Save Changes" : "Add Script"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}