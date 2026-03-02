// src/hooks/use-sound-settings.ts
"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "francolink-sound-enabled";

export function useSoundSettings() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setSoundEnabled(stored === "true");
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  const setSound = useCallback((enabled: boolean) => {
    setSoundEnabled(enabled);
    try {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch {}
  }, []);

  return { soundEnabled, toggleSound, setSound, mounted };
}