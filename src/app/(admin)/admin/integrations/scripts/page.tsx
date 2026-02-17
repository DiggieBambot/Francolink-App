// src/app/(admin)/admin/integrations/scripts/page.tsx

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, Code } from "lucide-react";
import { ScriptsList } from "./scripts-list";

export default async function AdminScriptsPage() {
  const supabase = await createClient();

  const { data: scripts } = await supabase
    .from("script_injections")
    .select("*")
    .order("position")
    .order("order_index");

  const groupedScripts = {
    head: scripts?.filter((s) => s.position === "head") || [],
    body_start: scripts?.filter((s) => s.position === "body_start") || [],
    body_end: scripts?.filter((s) => s.position === "body_end") || [],
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/integrations"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Integrations
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Custom Scripts</h1>
            <p className="text-gray-500 mt-1">
              Add tracking codes, chat widgets, and custom JavaScript
            </p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Code className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-800">Script Injection Points</h3>
            <ul className="text-sm text-blue-700 mt-1 space-y-1">
              <li>
                <strong>Head:</strong> Loads before page content (analytics, meta tags)
              </li>
              <li>
                <strong>Body Start:</strong> Loads at the start of body (critical scripts)
              </li>
              <li>
                <strong>Body End:</strong> Loads after content (chat widgets, deferred scripts)
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Scripts List */}
      <ScriptsList groupedScripts={groupedScripts} />
    </div>
  );
}