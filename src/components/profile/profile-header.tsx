// src/components/profile/profile-header.tsx

"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, Loader2, Settings, Calendar } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface ProfileHeaderProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
    created_at: string;
  };
  currentLevel: number;
  xpProgress: number;
  xpProgressPercent: number;
  accountAgeDays: number;
}

export default function ProfileHeader({
  user,
  currentLevel,
  xpProgress,
  xpProgressPercent,
  accountAgeDays,
}: ProfileHeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be less than 2MB");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setAvatarUrl(objectUrl);

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      // Delete old avatar if exists
      if (user.avatar_url) {
        const oldPath = user.avatar_url.split("/avatars/")[1];
        if (oldPath) {
          await supabase.storage.from("avatars").remove([oldPath]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Update user profile
      const { error: updateError } = await supabase
        .from("users")
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      router.refresh();
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload image");
      setAvatarUrl(user.avatar_url);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 md:p-8 mb-6">
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Avatar with Upload */}
        <div className="relative group">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-primary">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user.name || "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {getInitials(user.name || user.email || "U")}
                </span>
              </div>
            )}
          </div>

          {/* Upload Overlay */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Camera className="w-6 h-6 text-white" />
            )}
          </button>

          {/* Level Badge */}
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-secondary rounded-full flex items-center justify-center border-4 border-white">
            <span className="text-sm font-bold text-white">{currentLevel}</span>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* User Info */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl font-heading font-bold text-gray-900">
            {user.name || "Learner"}
          </h1>
          <p className="text-gray-500">{user.email}</p>

          {/* Upload hint */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-sm text-primary hover:underline mt-1 cursor-pointer"
          >
            {uploading ? "Uploading..." : "Change photo"}
          </button>

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-500 mt-1">{error}</p>
          )}

          {/* XP Progress Bar */}
          <div className="mt-4 max-w-md">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Level {currentLevel}</span>
              <span className="text-gray-500">{xpProgress} / 100 XP</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-secondary to-orange-400 rounded-full transition-all duration-500"
                style={{ width: `${xpProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Member Since */}
          <p className="text-sm text-gray-400 mt-3 flex items-center justify-center md:justify-start gap-1">
            <Calendar className="w-4 h-4" />
            Member for {accountAgeDays} days
          </p>
        </div>

        {/* Settings Link */}
        <Link
          href="/settings"
          className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </Link>
      </div>
    </div>
  );
}