"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, PencilLine, MessageSquareText, Loader2 } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  url: string | null;
  read_at: string | null;
  created_at: string;
}

function iconFor(type: string) {
  if (type === "homework_assigned") return PencilLine;
  if (type === "homework_reviewed") return MessageSquareText;
  return Bell;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function NotificationInbox() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (res.ok) setItems(data.items || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
  }

  async function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: n.read_at || new Date().toISOString() } : n)));
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  const unread = items.filter((n) => !n.read_at).length;

  return (
    <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-gray-900">
          Inbox
          {unread > 0 ? (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">{unread}</span>
          ) : null}
        </h2>
        {unread > 0 ? (
          <button onClick={markAllRead} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">No notifications yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((n) => {
            const Icon = iconFor(n.type);
            const content = (
              <div className={`flex items-start gap-3 py-3 ${n.read_at ? "opacity-70" : ""}`}>
                <span className="mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                  {n.body ? <p className="text-sm text-gray-600">{n.body}</p> : null}
                  <p className="mt-0.5 text-xs text-gray-400">{timeAgo(n.created_at)}</p>
                </div>
                {!n.read_at ? <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" /> : null}
              </div>
            );
            return (
              <li key={n.id}>
                {n.url ? (
                  <Link href={n.url} onClick={() => markRead(n.id)} className="block hover:bg-gray-50">
                    {content}
                  </Link>
                ) : (
                  <button onClick={() => markRead(n.id)} className="block w-full text-left hover:bg-gray-50">
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
