"use client";

// The Study Space — the room for a tutor who is not (yet) a listed FrancoLink
// tutor, which today is most of them.
//
// Why this exists as its own shell rather than a flag on RoomShell:
//
// Until now everyone got the Classroom. An independent tutor opened a room
// built entirely around a live call — a 360px video rail, a 64px control bar,
// a Join button — pressed Join, and was told:
//
//     "Live video is for lessons with FrancoLink tutors."
//
// So every lesson they ever taught opened with a rejection, and a third of
// their screen was permanently committed to a call that would never connect.
// Hiding the video panel inside RoomShell would have fixed the rejection and
// left the shape: a classroom with a hole where the class goes.
//
// This is not a Classroom with the video removed. It is a room for two people
// working through material together, and the material gets the whole stage.
// Everything that made the old room useful to them — chat, the board,
// highlights, homework, the AI tutor — is here and unchanged. What is gone is
// the apparatus of a live class: no call, so no controls; no schedule, so no
// countdown; nothing to end, so no End class.

import Link from "next/link";
import { useState } from "react";
import { MessageSquare, X, ChevronRight, Sparkles, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RailTab, StageKey, StagePanel } from "./room-shell";

export function SpaceShell({
  panels,
  activeStage,
  onStageChange,
  onClosePanel,
  actions,
  railTabs,
  /** Tutors see the pitch to join FrancoLink; their students should not. */
  showUpgrade,
}: {
  panels: StagePanel[];
  activeStage: StageKey;
  onStageChange: (k: StageKey) => void;
  onClosePanel?: (k: StageKey) => void;
  actions: React.ReactNode;
  railTabs: RailTab[];
  showUpgrade: boolean;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Collapsible above lg, and that is the point of the whole shell: a
  // worksheet or a grammar table wants the width, and there is no video here
  // that has to stay on screen for the room to work.
  const [railOpen, setRailOpen] = useState(true);
  const [tab, setTab] = useState(railTabs[0]?.key ?? "chat");

  const active = railTabs.find((t) => t.key === tab) ?? railTabs[0];
  const unread = railTabs.reduce((n, t) => n + (t.badge ?? 0), 0);

  const railBody = (
    <>
      <div className="flex items-center border-b">
        {railTabs.map((t) => {
          const on = t.key === active?.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-pressed={on}
              className={cn(
                "relative flex flex-1 items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-semibold transition-colors",
                on
                  ? "border-b-2 border-primary-600 text-primary-700"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <t.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{t.label}</span>
              {t.badge ? (
                <span className="rounded-full bg-primary-600 px-1.5 text-[10px] font-bold text-white">
                  {t.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{active?.content}</div>

      {/* Said once, at the bottom, as an offer. The old room made this point
          by refusing to start a call — an offer stated as a failure. */}
      {showUpgrade ? (
        <Link
          href="/tutor/apply"
          className="group flex items-start gap-2.5 border-t bg-primary-50/60 px-3 py-3 transition-colors hover:bg-primary-50"
        >
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-secondary-500" />
          <span className="min-w-0">
            <span className="flex items-center gap-1 text-xs font-bold text-primary-700">
              Teach on FrancoLink
              <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
            <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">
              Live video, bookings and paid lessons — students come to you.
            </span>
          </span>
        </Link>
      ) : null}
    </>
  );

  return (
    // 100dvh, not 100vh: on iOS Safari the URL bar makes vh taller than the
    // screen, which would push the message composer under the browser chrome.
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-slate-100">
      {/* ------------------------------------------------------------- TOP */}
      <header
        className="flex shrink-0 items-stretch gap-1 border-b bg-white pr-2"
        style={{
          height: "calc(3rem + env(safe-area-inset-top))",
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        {/* The tabs never yield to the toolbar — at 375px a `flex-1` tab strip
            against a ~600px toolbar collapses to zero width and there is no
            way back to the material. */}
        <div className="flex shrink-0 items-stretch">
          {panels.map((p) => {
            const on = p.key === activeStage;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => onStageChange(p.key)}
                aria-pressed={on}
                className={cn(
                  "group relative inline-flex shrink-0 items-center gap-2 border-r px-3 text-sm font-semibold transition-colors",
                  on
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                )}
              >
                <p.icon className="h-4 w-4 shrink-0" />
                <span className="max-w-[9rem] truncate">{p.label}</span>
                {p.closable && onClosePanel ? (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Close ${p.label}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onClosePanel(p.key);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        onClosePanel(p.key);
                      }
                    }}
                    className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end overflow-x-auto">
          {actions}
        </div>
      </header>

      {/* ------------------------------------------------------------ BODY */}
      <div className="flex min-h-0 flex-1">
        <main className="relative flex min-w-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1 overflow-hidden">
            {panels.map((p) => (
              <div
                key={p.key}
                // Hidden, not unmounted — a whiteboard that remounts loses its
                // canvas, and a lesson that remounts loses the answers.
                className={cn(
                  "absolute inset-0 overflow-y-auto",
                  p.key === activeStage ? "block" : "hidden"
                )}
              >
                {p.content}
              </div>
            ))}
          </div>

          {/* Give the material the whole width back. */}
          {!railOpen ? (
            <button
              type="button"
              onClick={() => setRailOpen(true)}
              className="absolute right-3 top-3 z-20 hidden items-center gap-1.5 rounded-full border bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur transition hover:text-slate-900 lg:flex"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Chat
              {unread ? (
                <span className="rounded-full bg-primary-600 px-1.5 text-[10px] font-bold text-white">
                  {unread}
                </span>
              ) : null}
            </button>
          ) : null}
        </main>

        {/* ------------------------------------------------------ RAIL (lg) */}
        {railOpen ? (
          <aside className="hidden w-[340px] shrink-0 flex-col border-l bg-white lg:flex">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Study space
              </span>
              <button
                type="button"
                onClick={() => setRailOpen(false)}
                className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Hide panel"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            {railBody}
          </aside>
        ) : null}
      </div>

      {/* ---------------------------------------------- RAIL (below lg) */}
      {/* No control bar here to hang a button on, so the drawer keeps a
          floating trigger — the one place this shell still needs one. */}
      {!drawerOpen ? (
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="fixed right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg transition hover:bg-primary-600 lg:hidden"
          // Clear of the home indicator: viewport-fit=cover means the bottom
          // of the viewport is BEHIND it, not above it.
          style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
          aria-label="Open chat and tools"
        >
          <MessageSquare className="h-5 w-5" />
          {unread ? (
            <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-accent px-1 text-[10px] font-bold leading-[18px]">
              {unread}
            </span>
          ) : null}
        </button>
      ) : (
        // No scrim: the thing behind this is the material, which is still
        // being worked on. Tapping it should just work.
        <div
          className="fixed inset-x-0 bottom-0 z-50 flex h-[62dvh] flex-col rounded-t-2xl border-t bg-white shadow-2xl lg:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Study space
            </span>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {railBody}
        </div>
      )}
    </div>
  );
}
