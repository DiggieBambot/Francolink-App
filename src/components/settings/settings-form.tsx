// src/components/settings/settings-form.tsx

"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";
import {
  User,
  Mail,
  Target,
  Lock,
  Globe,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Camera,
} from "lucide-react";

interface SettingsFormProps {
  user: {
    id: string;
    email: string;
    name: string;
    dailyGoalMinutes: number;
    nativeLanguage: string;
    avatarUrl?: string | null;
  };
}

export default function SettingsForm({ user }: SettingsFormProps) {
  const router = useRouter();
  const supabase = createClient();

  // Profile settings
  const [name, setName] = useState(user.name);
  const [dailyGoal, setDailyGoal] = useState(user.dailyGoalMinutes);
  const [nativeLanguage, setNativeLanguage] = useState(user.nativeLanguage);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl ?? null);
  const [avatarBusy, setAvatarBusy] = useState<"" | "uploading" | "removing">("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const initials = (name || user.email || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("") || "?";

  const handleAvatarSelect = () => avatarInputRef.current?.click();

  const handleAvatarUpload = async (file: File) => {
    setError(null);
    setSuccess(null);
    if (file.size > 4 * 1024 * 1024) {
      setError("Image must be 4 MB or smaller");
      return;
    }
    setAvatarBusy("uploading");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setAvatarUrl(data.url);
      setSuccess("Profile picture updated");
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Upload failed");
    } finally {
      setAvatarBusy("");
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleAvatarRemove = async () => {
    setError(null);
    setSuccess(null);
    setAvatarBusy("removing");
    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Remove failed");
      setAvatarUrl(null);
      setSuccess("Profile picture removed");
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Remove failed");
    } finally {
      setAvatarBusy("");
    }
  };

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Save profile settings
  const handleSaveProfile = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: updateError } = await supabase
        .from("users")
        .update({
          name,
          daily_goal_minutes: dailyGoal,
          native_language: nativeLanguage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setSuccess("Profile updated successfully!");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setSavingPassword(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    // In production, you'd call an API route that uses the service role key
    // to delete the user from auth and the database
    alert("Account deletion would be handled by an API route in production");
    setShowDeleteConfirm(false);
  };

  const dailyGoalOptions = [
    { value: 5, label: "5 min", description: "Casual" },
    { value: 10, label: "10 min", description: "Regular" },
    { value: 15, label: "15 min", description: "Committed" },
    { value: 30, label: "30 min", description: "Intense" },
    { value: 60, label: "60 min", description: "Hardcore" },
  ];

  const languageOptions = [
    { value: "en", label: "English" },
    { value: "fr", label: "Français" },
    { value: "es", label: "Español" },
  ];

  return (
    <div className="space-y-8">
      {/* Success/Error Messages */}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800">{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Profile Settings */}
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <h2 className="text-lg font-heading font-bold text-primary mb-6 flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile Settings
        </h2>

        <div className="space-y-4">
          {/* Profile Picture */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Picture
            </label>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center flex-shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Your avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-xl font-bold">{initials}</span>
                )}
                {avatarBusy && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleAvatarUpload(f);
                  }}
                />
                <button
                  type="button"
                  onClick={handleAvatarSelect}
                  disabled={!!avatarBusy}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
                >
                  <Camera className="w-4 h-4" />
                  {avatarUrl ? "Change photo" : "Upload photo"}
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleAvatarRemove}
                    disabled={!!avatarBusy}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-60"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                )}
                <p className="text-xs text-gray-500">PNG, JPG, WebP or GIF. Max 4 MB.</p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="email"
                value={user.email}
                disabled
                className="bg-gray-50"
              />
              <Mail className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Contact support to change your email
            </p>
          </div>

          {/* Native Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Native Language
            </label>
            <div className="flex items-center gap-2">
              <select
                value={nativeLanguage}
                onChange={(e) => setNativeLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Globe className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Daily Goal */}
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <h2 className="text-lg font-heading font-bold text-primary mb-6 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Daily Goal
        </h2>

        <div className="grid grid-cols-5 gap-2">
          {dailyGoalOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setDailyGoal(option.value)}
              className={`p-4 rounded-xl border-2 transition-all text-center ${
                dailyGoal === option.value
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className={`text-lg font-bold ${
                dailyGoal === option.value ? "text-primary" : "text-gray-900"
              }`}>
                {option.label}
              </div>
              <div className="text-xs text-gray-500">{option.description}</div>
            </button>
          ))}
        </div>

        <Button
          onClick={handleSaveProfile}
          disabled={saving}
          className="w-full mt-6 gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <h2 className="text-lg font-heading font-bold text-primary mb-6 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Change Password
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={savingPassword || !newPassword || !confirmPassword}
            variant="secondary"
            className="w-full gap-2"
          >
            {savingPassword ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            Change Password
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl shadow-soft p-6 border-2 border-red-100">
        <h2 className="text-lg font-heading font-bold text-red-600 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h2>

        <p className="text-gray-600 text-sm mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>

        {!showDeleteConfirm ? (
          <Button
            onClick={() => setShowDeleteConfirm(true)}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50 gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700 gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Yes, Delete My Account
            </Button>
            <Button
              onClick={() => setShowDeleteConfirm(false)}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}