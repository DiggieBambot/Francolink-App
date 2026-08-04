"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2, Trash2, User } from "lucide-react";

/**
 * Profile photo picker for a tutor's public listing.
 *
 * Uploads immediately and hands the URL back to the parent form, which stores
 * it when the profile is saved. `targetUserId` is only set when an admin is
 * editing someone else's profile.
 */
export function PhotoUpload({
  value,
  onChange,
  targetUserId,
  name,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  targetUserId?: string;
  name?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      if (targetUserId) form.append("user_id", targetUserId);

      const res = await fetch("/api/site/tutor-photo", {
        method: "POST",
        body: form,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Upload failed.");
      onChange(body.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="block text-sm font-semibold text-primary mb-2">
        Profile photo
      </span>
      <span className="block text-xs text-gray-500 mb-3">
        A clear, friendly headshot. Square images work best — JPEG, PNG or WebP,
        under 5 MB.
      </span>

      <div className="flex items-center gap-5">
        <div className="relative w-24 h-24 shrink-0">
          {value ? (
            <Image
              src={value}
              alt={name ? `${name}'s profile photo` : "Profile photo"}
              width={96}
              height={96}
              unoptimized
              className="w-24 h-24 rounded-2xl object-cover border border-gray-200"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center">
              <User className="w-8 h-8 text-gray-300" />
            </div>
          )}
          {busy && (
            <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-primary hover:border-primary disabled:opacity-60"
          >
            <Camera className="w-4 h-4" />
            {value ? "Replace photo" : "Upload photo"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-red-600 disabled:opacity-60"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
