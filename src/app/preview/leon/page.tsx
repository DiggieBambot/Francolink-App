"use client";

import { notFound } from "next/navigation";
import { useState } from "react";
import { Leon, type LeonMood } from "@/components/ai-tutor/leon";

const MOODS: LeonMood[] = ["idle", "listening", "thinking", "speaking", "correcting", "celebrating"];
const LANGS = [
  { code: "fr", name: "French" },
  { code: "es", name: "Spanish" },
  { code: "en", name: "English" },
];

/** Dev-only sheet of every Leon language × mood. */
export default function LeonPreviewPage() {
  const [lang, setLang] = useState("fr");
  const [mood, setMood] = useState<LeonMood>("idle");
  const [replay, setReplay] = useState(0);
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">Leon — prototype</h1>

        <section className="bg-white rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row items-center gap-8">
          <Leon key={`${mood}-${replay}`} language={lang} mood={mood} size={200} />
          <div className="space-y-4 flex-1">
            <div className="flex flex-wrap gap-2">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`px-3 py-1.5 rounded-lg text-sm ${lang === l.code ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}
                >
                  {l.name}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMood(m);
                    setReplay((r) => r + 1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm capitalize ${mood === m ? "bg-primary text-white" : "bg-gray-100 text-gray-700"}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-6 overflow-x-auto">
          <table className="mx-auto">
            <thead>
              <tr>
                <th />
                {MOODS.map((m) => (
                  <th key={m} className="px-2 pb-2 text-xs font-medium text-gray-500 capitalize">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LANGS.map((l) => (
                <tr key={l.code}>
                  <td className="pr-3 text-sm text-gray-600">{l.name}</td>
                  {MOODS.map((m) => (
                    <td key={m} className="p-2">
                      <Leon language={l.code} mood={m} size={88} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-3">Small sizes (header 36px, thread 32px)</p>
          <div className="flex items-center gap-4">
            {LANGS.map((l) => (
              <div key={l.code} className="flex items-center gap-2">
                <Leon language={l.code} size={36} />
                <Leon language={l.code} size={32} still />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
