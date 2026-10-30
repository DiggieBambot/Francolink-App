"use client";

// Header bell: unread badge + a dropdown of recent in-app notifications.
// Polls lightly (and on tab focus) so admin replies show up without a reload.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  url: string | null;
  read_at: string | null;
  created_at: string;
}

const POLL_MS = 60_000;

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function NotificationBell({ inboxHref = "/notifications" }: { inboxHref?: string | null }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      // offline or signed out — keep whatever we had
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function markRead(payload: { id: string } | { all: true }) {
    const now = new Date().toISOString();
    setItems((prev) =>
      prev.map((n) => ("all" in payload || n.id === payload.id ? { ...n, read_at: n.read_at || now } : n))
    );
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }

  const unread = items.filter((n) => !n.read_at).length;
  const recent = items.slice(0, 8);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={unread ? `Notifications (${unread} unread)` : "Notifications"}
        aria-expanded={open}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-secondary text-white text-[10px] font-bold leading-[18px] text-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="font-heading font-bold text-gray-900 text-sm">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markRead({ all: true })}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {!loaded ? (
              <div className="flex items-center gap-2 px-4 py-6 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : recent.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">No notifications yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recent.map((n) => {
                  const isOpen = expanded === n.id;
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setExpanded(isOpen ? null : n.id);
                          if (!n.read_at) markRead({ id: n.id });
                        }}
                        className={cn(
                          "flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50",
                          !n.read_at && "bg-primary-50/40"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                          {n.body && (
                            <p
                              className={cn(
                                "text-sm text-gray-600 whitespace-pre-line",
                                !isOpen && "line-clamp-2"
                              )}
                            >
                              {n.body}
                            </p>
                          )}
                          <p className="mt-0.5 text-xs text-gray-400">{timeAgo(n.created_at)}</p>
                        </div>
                        {!n.read_at && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-secondary" />}
                      </button>
                      {isOpen && n.url && (
                        <Link
                          href={n.url}
                          onClick={() => setOpen(false)}
                          className="block px-4 pb-3 -mt-1 text-xs font-semibold text-primary hover:underline"
                        >
                          Open →
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {inboxHref && (
            <Link
              href={inboxHref}
              onClick={() => setOpen(false)}
              className="block border-t border-gray-100 px-4 py-2.5 text-center text-sm font-semibold text-primary hover:bg-gray-50"
            >
              See all
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
