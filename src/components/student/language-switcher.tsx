// src/components/student/language-switcher.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, Plus, Check } from "lucide-react";
import { LANGUAGE_INFO, langSlug } from "@/lib/utils/language";

interface UserLanguage {
  language_code: string;
  is_active: boolean;
  placement_taken: boolean;
  placement_level: string | null;
}

interface LanguageSwitcherProps {
  activeLanguage: string; // short code
  userLanguages: UserLanguage[];
  userId: string;
}

export function LanguageSwitcher({ activeLanguage, userLanguages, userId }: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const activeLang = LANGUAGE_INFO[activeLanguage] || LANGUAGE_INFO.fr;

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSwitch = async (langCode: string) => {
    if (langCode === activeLanguage || switching) return;
    setSwitching(true);

    // Deactivate all, activate the new one
    await supabase
      .from("user_languages")
      .update({ is_active: false })
      .eq("user_id", userId);

    await supabase
      .from("user_languages")
      .update({ is_active: true })
      .eq("user_id", userId)
      .eq("language_code", langCode);

    // Also update the users table for backwards compatibility
    await supabase
      .from("users")
      .update({ learning_language: langCode })
      .eq("id", userId);

    setOpen(false);
    setSwitching(false);
    router.refresh();
  };

  const handleAddLanguage = () => {
    setOpen(false);
    router.push("/learn");
  };

  // All possible languages to show in the "add" section
  const existingCodes = new Set(userLanguages.map(ul => ul.language_code));
  const availableToAdd = ["fr", "en", "es", "de"].filter(c => !existingCodes.has(c));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 hover:border-primary/30 hover:bg-primary-50/50 transition-all shadow-sm"
      >
        <span className="text-xl leading-none">{activeLang.flag}</span>
        <span className="text-sm font-semibold text-gray-700 hidden sm:inline">
          {activeLang.name}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            My Languages
          </p>

          {userLanguages.map((ul) => {
            const info = LANGUAGE_INFO[ul.language_code] || LANGUAGE_INFO.fr;
            const isActive = ul.language_code === activeLanguage;

            return (
              <button
                key={ul.language_code}
                onClick={() => handleSwitch(ul.language_code)}
                disabled={switching}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  isActive
                    ? "bg-primary-50 text-primary"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <span className="text-xl">{info.flag}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium block">{info.name}</span>
                  {ul.placement_taken && ul.placement_level && (
                    <span className="text-[11px] text-gray-400">Level {ul.placement_level}</span>
                  )}
                </div>
                {isActive && <Check className="w-4 h-4 text-primary" />}
              </button>
            );
          })}

          {availableToAdd.length > 0 && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={handleAddLanguage}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors text-gray-500"
              >
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-medium">Add a Language</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
