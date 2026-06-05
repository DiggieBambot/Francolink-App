"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyButton({ text, className = "" }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* ignore */
        }
      }}
      className={`p-2 hover:bg-primary-100 dark:hover:bg-primary-800 rounded-lg transition-colors ${className}`}
      title="Copy link"
    >
      {copied ? (
        <Check className="w-4 h-4 text-secondary-600" />
      ) : (
        <Copy className="w-4 h-4 text-primary dark:text-primary-400" />
      )}
    </button>
  );
}
