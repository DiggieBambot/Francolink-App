"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
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

      // next-intl's router.replace handles locale switching automatically
      // pathname from next-intl is already without the locale prefix
      router.replace(pathname, { locale: newLocale });
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
                   transition-colors text-sm cursor-pointer"
      >
        <Globe className="w-4 h-4 text-gray-500" />
        <span>{current.flag}</span>
        <span className="hidden sm:inline text-gray-700">
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
                     bg-white rounded-xl shadow-lg
                     border border-gray-100
                     py-1.5 z-50 animate-in fade-in slide-in-from-top-2
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
                           text-sm transition-colors cursor-pointer rounded-lg mx-auto
                           ${
                             isActive
                               ? "bg-primary-50 text-primary font-semibold"
                               : "text-gray-700 hover:bg-gray-50"
                           }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.label}</span>
                {isActive && (
                  <Check className="w-4 h-4 ml-auto text-secondary" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}