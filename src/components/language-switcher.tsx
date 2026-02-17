// src/components/language-switcher.tsx
"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
] as const;

type LanguageCode = (typeof LANGUAGES)[number]["code"];

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const switchLocale = useCallback(
    (newLocale: LanguageCode) => {
      if (newLocale === locale) {
        setOpen(false);
        return;
      }

      // Parse current path and replace locale
      let newPath = pathname;

      // Check if path starts with a locale
      const pathParts = pathname.split("/").filter(Boolean);
      const firstPart = pathParts[0];
      const isLocalePrefixed = LANGUAGES.some((l) => l.code === firstPart);

      if (isLocalePrefixed) {
        // Replace existing locale
        pathParts[0] = newLocale;
        newPath = "/" + pathParts.join("/");
      } else {
        // Add locale prefix
        newPath = "/" + newLocale + pathname;
      }

      // For default locale (en) with 'as-needed', we might not need prefix
      // But since we're switching TO a locale, always include it
      if (newLocale === "en") {
        // Remove locale prefix for English (default)
        if (isLocalePrefixed) {
          pathParts.shift(); // Remove locale
          newPath = "/" + pathParts.join("/") || "/";
        }
        // else: path already has no locale prefix
      }

      router.push(newPath);
      setOpen(false);
    },
    [locale, pathname, router]
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Select language"
        className="flex items-center gap-2 px-3 py-2 rounded-lg
                   border border-gray-200 hover:bg-gray-50
                   dark:border-gray-700 dark:hover:bg-gray-800
                   transition-colors text-sm cursor-pointer"
      >
        <Globe className="w-4 h-4 text-gray-500" />
        <span>{current.flag}</span>
        <span className="hidden sm:inline text-gray-700 dark:text-gray-300">
          {current.label}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Languages"
          className="absolute right-0 top-full mt-2 w-48
                     bg-white dark:bg-gray-900 rounded-lg shadow-lg
                     border border-gray-200 dark:border-gray-700
                     py-1 z-50 animate-in fade-in slide-in-from-top-2
                     duration-200"
        >
          {LANGUAGES.map((lang) => {
            const isActive = lang.code === locale;
            return (
              <button
                key={lang.code}
                role="option"
                aria-selected={isActive}
                onClick={() => switchLocale(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-2.5
                           text-sm transition-colors cursor-pointer
                           ${
                             isActive
                               ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium"
                               : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                           }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.label}</span>
                {isActive && (
                  <Check className="w-4 h-4 ml-auto text-blue-500" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}