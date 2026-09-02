'use client';

// Join requests the spam scoring turned away on the tutor's behalf.
//
// The point of showing these at all: an auto-decline that leaves no trace is
// indistinguishable from a student who never arrived, so if the scoring is
// wrong about someone real, nobody would ever find out. Collapsed by default
// so it stays out of the way, and one click restores a request in full.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldX, ChevronDown, ChevronRight, Loader2, Undo2 } from 'lucide-react';

interface DeclinedRequest {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
  requested_at: string | null;
}

export function DeclinedRequests({ requests }: { requests: DeclinedRequest[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restored, setRestored] = useState<Set<string>>(new Set());

  const visible = requests.filter((r) => !restored.has(r.id));
  if (visible.length === 0) return null;

  async function restore(studentId: string) {
    setBusy(studentId);
    setError(null);
    try {
      // 'accept' already works on a declined row — it just sets the link
      // active — so restoring needs no separate endpoint.
      const res = await fetch('/api/tutor/students/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, action: 'accept' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong');
      }
      setRestored((prev) => new Set(prev).add(studentId));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-900/20">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-5 py-3 text-left"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        )}
        <ShieldX className="h-5 w-5 text-gray-500" />
        <span className="font-semibold text-gray-900 dark:text-white">
          Automatically declined
        </span>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          {visible.length}
        </span>
        <span className="ml-auto text-xs text-gray-500">
          Suspected spam — not shown to you as requests
        </span>
      </button>

      {open && (
        <div className="border-t border-gray-200 px-5 py-3 dark:border-gray-800">
          <p className="mb-3 text-xs text-gray-500">
            These looked like automated signups, so we turned them away rather than
            asking you about each one. If one of them is a real student, restore it
            and they&apos;ll be connected as normal.
          </p>

          {error && (
            <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {visible.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {r.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (r.name?.[0] || r.email[0] || '?').toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {r.name || 'No name given'}
                  </p>
                  <p className="truncate text-xs text-gray-500">{r.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => restore(r.id)}
                  disabled={busy === r.id}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-white disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  {busy === r.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Undo2 className="h-3.5 w-3.5" />
                  )}
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
