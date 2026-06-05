'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Check, X, Loader2, Mail, Clock } from 'lucide-react';

interface PendingRequest {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
  requested_at: string | null;
}

export function PendingRequests({ requests }: { requests: PendingRequest[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Track ids we've acted on so they disappear instantly (optimistic).
  const [done, setDone] = useState<Set<string>>(new Set());

  const visible = requests.filter((r) => !done.has(r.id));
  if (visible.length === 0) return null;

  async function respond(studentId: string, action: 'accept' | 'decline') {
    setBusy(studentId + action);
    setError(null);
    try {
      const res = await fetch('/api/tutor/students/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong');
      }
      setDone((prev) => new Set(prev).add(studentId));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(null);
    }
  }

  const timeAgo = (s: string | null) => {
    if (!s) return '';
    const d = Math.floor((Date.now() - new Date(s).getTime()) / 86400000);
    if (d <= 0) return 'today';
    if (d === 1) return 'yesterday';
    if (d < 7) return `${d} days ago`;
    return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="mb-8 rounded-xl border border-secondary-200 bg-secondary-50/60 dark:border-secondary-800 dark:bg-secondary-900/10">
      <div className="flex items-center gap-2 border-b border-secondary-200 dark:border-secondary-800 px-5 py-3">
        <UserPlus className="h-5 w-5 text-secondary" />
        <h2 className="font-semibold text-gray-900 dark:text-white">
          Wants to join
        </h2>
        <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-white">
          {visible.length}
        </span>
      </div>

      {error && (
        <div className="px-5 pt-3 text-sm text-red-600">{error}</div>
      )}

      <div className="divide-y divide-secondary-200/70 dark:divide-secondary-800/70">
        {visible.map((r) => (
          <div key={r.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
            {/* Avatar */}
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-secondary to-secondary-600 font-semibold text-white">
              {r.avatar_url ? (
                <img src={r.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                (r.name?.charAt(0) || r.email.charAt(0)).toUpperCase()
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-gray-900 dark:text-white">
                {r.name || 'New student'}
              </p>
              <p className="flex items-center gap-1 truncate text-sm text-gray-500 dark:text-gray-400">
                <Mail className="h-3 w-3" /> {r.email}
              </p>
            </div>

            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="h-3 w-3" /> {timeAgo(r.requested_at)}
            </span>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => respond(r.id, 'accept')}
                disabled={busy !== null}
                className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3.5 py-2 text-sm font-semibold text-white hover:bg-secondary-600 disabled:opacity-50"
              >
                {busy === r.id + 'accept' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Accept
              </button>
              <button
                onClick={() => respond(r.id, 'decline')}
                disabled={busy !== null}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {busy === r.id + 'decline' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
