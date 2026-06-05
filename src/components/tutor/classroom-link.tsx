'use client';

import { useEffect, useState } from 'react';
import { Video, Copy, Check, ArrowRight } from 'lucide-react';

export function ClassroomLink({ roomId }: { roomId: string }) {
  // Build the link from the host the tutor is actually on, so it works both on
  // localhost (testing) and on the live domain (after deploy) without depending
  // on a hardcoded NEXT_PUBLIC_APP_URL.
  const [link, setLink] = useState(`/room/${roomId}`);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLink(`${window.location.origin}/room/${roomId}`);
  }, [roomId]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mb-8 rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 to-white p-5 dark:border-primary-800 dark:from-primary-900/20 dark:to-transparent">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Your live classroom</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Start the room, then send this link to a student to bring them in — like a meeting link.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
            <span className="max-w-[220px] truncate text-sm text-gray-600 dark:text-gray-300">{link}</span>
            <button
              onClick={copy}
              className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <a
            href="/space/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Open classroom <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
