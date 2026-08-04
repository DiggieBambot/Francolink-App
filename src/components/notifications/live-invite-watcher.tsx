"use client";

// Live-class invite watcher — mounted in the student layout.
//
// The instant their tutor opens a classroom, a full-screen popup with a pulsing
// "Join class" button appears. Dismissing collapses it to a still-pulsing pill
// (bottom-left, clear of the AI tutor FAB) so the invite is never lost.
//
// Delivery is Realtime-first: we subscribe to INSERTs on `notifications` for this
// user (RLS confines the stream to their own rows) and re-check the moment one
// lands. The slow poll below is only a safety net for a dropped socket, so the
// invite still shows if Realtime is unavailable.
//
// This is the in-app half of the invite; the Web Push half is sent by
// sendLiveClassInvite() and lands even when the app is closed.

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Video, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LIVE_INVITE_TYPE } from "@/lib/notifications/live-invite-type";

interface Invite {
  id: string;
  roomId: string;
  title: string;
  body: string;
  url: string;
}

/** Safety-net poll — Realtime is the primary channel, this just covers a dead socket. */
const POLL_MS = 60_000;

export function LiveInviteWatcher({ userId }: { userId: string }) {
  const router = useRouter();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [joining, setJoining] = useState(false);
  // Drives the grow-in transition when the popup mounts.
  const [entered, setEntered] = useState(false);
  // Invites the student explicitly closed for good this session.
  const dismissedRef = useRef<Set<string>>(new Set());
  // The invite currently on screen — lets a repeat poll avoid re-opening a
  // popup the student already minimized.
  const shownIdRef = useRef<string | null>(null);

  // `force` bypasses the hidden-tab skip — used for Realtime events, which are
  // worth resolving immediately so the popup is already up when they look back.
  const check = useCallback(async (force = false) => {
    if (!force && typeof document !== "undefined" && document.hidden) return;
    try {
      const res = await fetch("/api/student/live-invite", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { invite: Invite | null };
      const next = data.invite;
      if (!next || dismissedRef.current.has(next.id)) {
        shownIdRef.current = null;
        setInvite(null);
        return;
      }
      // A brand-new invite re-opens the full popup; a repeat of the one they
      // already minimized leaves it minimized.
      if (shownIdRef.current !== next.id) {
        shownIdRef.current = next.id;
        setMinimized(false);
      }
      setInvite(next);
    } catch {
      /* offline — try again on the next tick */
    }
  }, []);

  useEffect(() => {
    check();
    const timer = setInterval(() => check(), POLL_MS);
    // Coming back to the app is the most likely moment for a waiting invite.
    const onVisible = () => { if (!document.hidden) check(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [check]);

  // Realtime: the tutor's invite lands here within milliseconds of the insert.
  // RLS ("notifications_own_read") already scopes the stream to this user; the
  // user_id filter just avoids waking the client for rows it would discard.
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`live-invite:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as { type?: string };
          if (row?.type !== LIVE_INVITE_TYPE) return;
          // Re-read through the API so freshness + room-still-open are enforced
          // server-side in exactly one place.
          void check(true);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, check]);

  // Grow in whenever the popup (re)opens; reset while it's minimized/closed.
  useEffect(() => {
    if (!invite || minimized) {
      setEntered(false);
      return;
    }
    const t = setTimeout(() => setEntered(true), 20);
    return () => clearTimeout(t);
  }, [invite, minimized]);

  const join = () => {
    if (!invite) return;
    setJoining(true);
    // Mark read so the invite doesn't follow them into the room.
    void fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: invite.id }),
    }).catch(() => {});
    router.push(invite.url);
  };

  const dismissForGood = () => {
    if (!invite) return;
    dismissedRef.current.add(invite.id);
    void fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: invite.id }),
    }).catch(() => {});
    setInvite(null);
  };

  if (!invite) return null;

  if (minimized) {
    return (
      <button
        onClick={join}
        disabled={joining}
        className="fixed bottom-24 left-4 lg:bottom-6 lg:left-6 z-[60] inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 animate-pulse hover:animate-none hover:bg-emerald-700 disabled:opacity-60"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
        </span>
        {joining ? "Joining…" : "Live class — join"}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setMinimized(true)}
      />

      <div
        className={`relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl transition-all duration-300 dark:bg-gray-900 ${
          entered ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <button
          onClick={() => setMinimized(true)}
          aria-label="Not now"
          className="absolute right-3 top-3 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Pulsing halo around the video icon */}
        <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
          <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600 shadow-lg shadow-emerald-600/40">
            <Video className="h-9 w-9 text-white" />
          </span>
        </div>

        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-600">
          Live now
        </p>
        <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
          {invite.title}
        </h2>
        {invite.body && (
          <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">{invite.body}</p>
        )}

        {/* The "growing" join button — scales in a slow loop to pull the eye. */}
        <button
          onClick={join}
          disabled={joining}
          className="w-full animate-pulse rounded-2xl bg-emerald-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-emerald-600/30 transition-transform duration-300 hover:animate-none hover:scale-105 hover:bg-emerald-700 disabled:opacity-60"
        >
          {joining ? "Joining…" : "Join class now"}
        </button>

        <div className="mt-3 flex items-center justify-center gap-4 text-xs">
          <button
            onClick={() => setMinimized(true)}
            className="font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Remind me
          </button>
          <button
            onClick={dismissForGood}
            className="font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
