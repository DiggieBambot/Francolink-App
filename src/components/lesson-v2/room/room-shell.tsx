"use client";

// The live-class shell.
//
// What this replaces: a normal scrolling page with SEVEN fixed-position
// overlays floating on it and one hardcoded `lg:pr-[340px]` gutter. Nothing
// knew about anything else, so the breakpoints had drifted apart —
//
//   * the toolbar (z-40) sat under the rail (z-50), so "Send homework" was
//     permanently sliced off;
//   * the rail turned on at 640px but the content gutter at 1024px, so on
//     every width between — iPad portrait is 768px — the rail covered the
//     lesson;
//   * below 640px the rail was w-full, so opening chat hid the lesson
//     entirely, and since video lived inside the rail a phone user could see
//     the material or their tutor's face but never both.
//
// That last one is the rule a live class cannot break, so the shell is built
// around it: THE FACE AND THE MATERIAL STAY SIMULTANEOUSLY VISIBLE AT EVERY
// WIDTH. Everything else here follows from that.
//
// The layout is a grid, not overlays, so responsiveness falls out of the
// structure instead of being maintained by hand at each breakpoint:
//
//   >=1024   [ stage | rail 360px ]      rail holds video + tabs
//    <1024   [ video strip ]             tiles pinned above the stage
//            [ stage      ]              rail becomes a drawer, tabs only
//
// Stage state follows DMM/Engoo: with no material open the CALL is the stage,
// because the call is the lesson at that point. Pick material and it takes
// over, video shrinking to the rail. The stage is an array of panels so
// multi-tab ("Board 1", "Study Links", two materials at once) drops in later
// as "allow more than one entry" rather than a rewrite.

import { useState } from "react";
import { MessageSquare, PenTool, Users, Video as VideoIcon, X, Sparkles } from "lucide-react";
import { useRoomVideo } from "./video-context";
import { VideoRail } from "./video-views";
import { cn } from "@/lib/utils";

export type StageKey = "call" | "lesson" | "board";

export interface StagePanel {
  key: StageKey;
  label: string;
  icon: typeof VideoIcon;
  /** Panels are mounted and hidden, never unmounted — a whiteboard that
      remounts loses its canvas, and a lesson that remounts loses answers. */
  content: React.ReactNode;
  closable?: boolean;
}

export interface RailTab {
  key: string;
  label: string;
  icon: typeof MessageSquare;
  badge?: number;
  content: React.ReactNode;
}

function mmss(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function RoomShell({
  panels,
  activeStage,
  onStageChange,
  onClosePanel,
  actions,
  railTabs,
  peerName,
  onEndClass,
  canEndClass,
}: {
  panels: StagePanel[];
  activeStage: StageKey;
  onStageChange: (k: StageKey) => void;
  onClosePanel?: (k: StageKey) => void;
  /** Room controls — ring, invite, homework, presence. */
  actions: React.ReactNode;
  railTabs: RailTab[];
  peerName: string | null;
  onEndClass?: () => void;
  canEndClass: boolean;
}) {
  const [railOpen, setRailOpen] = useState(false);
  const [tab, setTab] = useState(railTabs[0]?.key ?? "chat");
  const { phase, elapsed } = useRoomVideo();

  const active = railTabs.find((t) => t.key === tab) ?? railTabs[0];
  const unread = railTabs.reduce((n, t) => n + (t.badge ?? 0), 0);

  // Shared by the docked rail and the drawer, so they can never drift.
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
    </>
  );

  return (
    // 100dvh, not 100vh: on iOS Safari the URL bar makes vh taller than the
    // screen, which would push the message composer under the browser chrome.
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-slate-100">
      {/* ------------------------------------------------------------- TOP */}
      <header className="flex h-12 shrink-0 items-stretch gap-1 border-b bg-white pr-2">
        <div className="flex min-w-0 flex-1 items-stretch overflow-x-auto">
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

        <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
      </header>

      {/* ------------------------------------------------------------ BODY */}
      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Below lg the tiles live here, above the material, so the face is
              never behind a drawer. */}
          <div className="shrink-0 lg:hidden">
            <VideoRail />
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden">
            {panels.map((p) => (
              <div
                key={p.key}
                // Hidden, not unmounted — see StagePanel.content.
                className={cn(
                  "absolute inset-0 overflow-y-auto",
                  p.key === activeStage ? "block" : "hidden"
                )}
              >
                {p.content}
              </div>
            ))}
          </div>
        </main>

        {/* ------------------------------------------------------ RAIL (lg) */}
        <aside className="hidden w-[360px] shrink-0 flex-col border-l bg-white lg:flex">
          <VideoRail />

          {/* Who you are with, and how long you have been at it. */}
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="truncate text-sm font-semibold text-slate-800">
              {peerName ?? "Waiting for the other side…"}
            </span>
            <span className="flex items-center gap-2">
              {phase === "joined" ? (
                <span className="tabular-nums text-sm font-semibold text-slate-600">
                  {mmss(elapsed)}
                </span>
              ) : null}
              {canEndClass && onEndClass ? (
                <button
                  type="button"
                  onClick={onEndClass}
                  className="text-xs font-semibold text-rose-600 hover:underline"
                >
                  End class
                </button>
              ) : null}
            </span>
          </div>

          {railBody}
        </aside>
      </div>

      {/* ------------------------------------------------- RAIL (below lg) */}
      {!railOpen ? (
        <button
          type="button"
          onClick={() => setRailOpen(true)}
          className="fixed bottom-4 right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 lg:hidden"
          aria-label="Open chat and tools"
        >
          <MessageSquare className="h-5 w-5" />
          {unread ? (
            <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-[18px]">
              {unread}
            </span>
          ) : null}
        </button>
      ) : (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden"
            onClick={() => setRailOpen(false)}
          />
          {/* A sheet, not a full-screen takeover: it stops at 70% so the
              material stays visible behind it. Hiding the lesson to read one
              chat message is what the old full-width rail did. */}
          <div
            className="fixed inset-x-0 bottom-0 z-50 flex h-[70dvh] flex-col rounded-t-2xl border-t bg-white shadow-2xl lg:hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <Sparkles className="h-3.5 w-3.5" />
                {peerName ?? "Live class"}
              </span>
              <span className="flex items-center gap-3">
                {phase === "joined" ? (
                  <span className="tabular-nums text-sm font-semibold text-slate-600">
                    {mmss(elapsed)}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => setRailOpen(false)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            </div>
            {railBody}
          </div>
        </>
      )}
    </div>
  );
}

export const STAGE_ICONS = { call: VideoIcon, lesson: MessageSquare, board: PenTool, people: Users };
