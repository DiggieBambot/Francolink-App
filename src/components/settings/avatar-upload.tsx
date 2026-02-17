// src/components/settings/avatar-upload.tsx

"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Camera, Loader2, X, User } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl: string | null;
  userName: string;
  onUploadComplete: (url: string) => void;
}

export default function AvatarUpload({ 
  userId, 
  currentAvatarUrl, 
  userName,
  onUploadComplete 
}: AvatarUploadProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl);

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
      setPreviewUrl(objectUrl);

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

      // Delete old avatar if exists
      if (currentAvatarUrl) {
        const oldPath = currentAvatarUrl.split("/avatars/")[1];
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
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      setPreviewUrl(publicUrl);
      onUploadComplete(publicUrl);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload image");
      setPreviewUrl(currentAvatarUrl);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!currentAvatarUrl && !previewUrl) return;

    setUploading(true);
    setError(null);

    try {
      // Delete from storage
      if (currentAvatarUrl) {
        const path = currentAvatarUrl.split("/avatars/")[1];
        if (path) {
          await supabase.storage.from("avatars").remove([path]);
        }
      }

      // Update user profile
      await supabase
        .from("users")
        .update({ 
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);

      setPreviewUrl(null);
      onUploadComplete("");
    } catch (err: any) {
      setError(err.message || "Failed to remove image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Avatar Display */}
      <div className="relative group">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-primary">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={userName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {getInitials(userName)}
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

        {/* Remove Button */}
        {previewUrl && !uploading && (
          <button
            onClick={handleRemoveAvatar}
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Instructions */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="mt-3 text-sm text-primary hover:underline cursor-pointer disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Change photo"}
      </button>

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {/* Help Text */}
      <p className="mt-1 text-xs text-gray-400">
        JPG, PNG or GIF. Max 2MB.
      </p>
    </div>
  );
}