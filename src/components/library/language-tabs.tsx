// Client component: language tab switcher for the lesson library.
"use client";

import Link from "next/link";

interface LanguageTabsProps {
  activeLang: "fr" | "en";
  frCount: number;
  enCount: number;
}

export function LanguageTabs({ activeLang, frCount, enCount }: LanguageTabsProps) {
  const tabs = [
    { lang: "fr" as const, label: "French", flag: "\u{1F1EB}\u{1F1F7}", count: frCount },
    { lang: "en" as const, label: "English", flag: "\u{1F1EC}\u{1F1E7}", count: enCount },
  ];

  return (
    <div className="flex items-center gap-2">
      {tabs.map((tab) => {
        const isActive = tab.lang === activeLang;
        return (
          <Link
            key={tab.lang}
            href={`/library?lang=${tab.lang}`}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
              isActive
                ? "bg-primary text-white shadow-soft"
                : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 hover:text-primary"
            }`}
          >
            <span className="text-lg">{tab.flag}</span>
            <span>{tab.label}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              }`}
            >
              {tab.count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
