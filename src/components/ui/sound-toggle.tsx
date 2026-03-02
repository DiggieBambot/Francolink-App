// src/components/ui/sound-toggle.tsx
"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useSoundSettings } from "@/hooks/use-sound-settings";

interface SoundToggleProps {
  className?: string;
  size?: "sm" | "md";
}

export function SoundToggle({ className = "", size = "md" }: SoundToggleProps) {
  const { soundEnabled, toggleSound, mounted } = useSoundSettings();

  // Avoid hydration mismatch
  if (!mounted) return null;

  const sizeClasses = size === "sm"
    ? "w-8 h-8"
    : "w-9 h-9";

  const iconSize = size === "sm" ? 14 : 16;

  return (
    <button
      onClick={toggleSound}
      title={soundEnabled ? "Mute sounds" : "Enable sounds"}
      className={`
        ${sizeClasses} rounded-full flex items-center justify-center
        transition-all duration-200
        ${soundEnabled
          ? "bg-primary/10 text-primary hover:bg-primary/20"
          : "bg-gray-100 text-gray-400 hover:bg-gray-200"
        }
        ${className}
      `}
    >
      {soundEnabled
        ? <Volume2 size={iconSize} />
        : <VolumeX size={iconSize} />
      }
    </button>
  );
}