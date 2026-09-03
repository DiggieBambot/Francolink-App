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

import { useEffect, useState } from "react";
import { MessageSquare, PenTool, Users, Video as VideoIcon, X, Sparkles, Clock, Library, LogOut } from "lucide-react";
import { useRoomVideo } from "./video-context";
import { VideoRail, VideoControls } from "./video-views";
import { cn } from "@/lib/utils";

export type StageKey = "call" | "lesson" | "board" | "materials";

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

/**
 * How long is left, and how loudly to say so.
 *
 * A class has a hard end — 30 minutes of room for a 25-minute lesson, 60 for a
 * 50 — enforced server-side by the video token. The pill's job is to make that
 * deadline impossible to be surprised by, so it escalates through the brand
 * palette rather than shouting from the start: navy while there is plenty of
 * time, warm orange at five minutes ("start wrapping up"), red at one.
 *
 * The colours are the site's own primary / secondary / accent. A green timer
 * would be the only green in the room and would read as a foreign widget
 * bolted onto the class.
 */
function ClassClock({ remaining, elapsed }: { remaining: number | null; elapsed: number }) {
  // No deadline: an unscheduled room (an independent tutor's own classroom)
  // has nothing to count down to, so it keeps the honest count-UP it had.
  if (remaining === null) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 tabular-nums text-xs font-semibold text-slate-600">
        <Clock className="h-3.5 w-3.5" />
        {mmss(elapsed)}
      </span>
    );
  }

  const urgent = remaining <= 60;
  const soon = remaining <= 300;

  return (
    <span
      // aria-live on the container would read every single tick aloud. The
      // urgent state is announced once, when it becomes true, and that is the
      // only moment a screen-reader user needs told.
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 tabular-nums text-xs font-semibold transition-colors",
        urgent
          ? "bg-accent-light text-accent"
          : soon
            ? "bg-secondary-50 text-secondary-700"
            : "bg-primary-50 text-primary-600"
      )}
      title={
        urgent || soon
          ? "The class ends automatically when this reaches zero."
          : "Time left in this class"
      }
    >
      <Clock className={cn("h-3.5 w-3.5", urgent && "animate-pulse")} />
      {mmss(remaining)}
      <span className="sr-only" role="status">
        {urgent ? "One minute left in this class." : ""}
      </span>
    </span>
  );
}

/**
 * The class control bar.
 *
 * Mic, camera, share and leave used to be drawn twice — once floating over
 * the video stage and once tucked under the rail tiles — so where the mute
 * button lived depended on which stage you happened to be on, and on a phone
 * it depended on whether a drawer was open. The controls a person reaches for
 * without looking cannot move.
 *
 * So there is now exactly ONE bar, at the bottom, at every width, always on
 * screen. That is also what makes the room read like a classroom rather than
 * a document with a webcam in the corner: a fixed frame around the lesson.
 */
function ControlBar({
  peerName,
  railTabs,
  unread,
  onOpenRail,
  onEndClass,
  canEndClass,
}: {
  peerName: string | null;
  railTabs: RailTab[];
  unread: number;
  onOpenRail: () => void;
  onEndClass?: () => void;
  canEndClass: boolean;
}) {
  const { phase, join, elapsed, remaining } = useRoomVideo();

  return (
    <div
      className="relative flex h-16 shrink-0 items-center gap-2 border-t border-slate-800 bg-slate-900 px-3"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* ------------------------------------------------------- IDENTITY */}
      {/* Who you are with, and how long is left. Both used to be in the right
          rail, which is hidden below lg — so on a tablet the class could end
          with no warning visible anywhere — and the clock was ALSO drawn in
          the header and in the mobile sheet. Three clocks for one class. */}
      <div className="flex min-w-0 items-center gap-2">
        {peerName ? (
          <span className="hidden min-w-0 items-center gap-2 sm:flex">
            <span className="h-2 w-2 shrink-0 rounded-full bg-primary-400" />
            <span className="truncate text-sm font-semibold text-slate-100">
              {peerName}
            </span>
          </span>
        ) : null}
        {phase === "joined" ? (
          <ClassClock remaining={remaining} elapsed={elapsed} />
        ) : null}
      </div>

      {/* -------------------------------------------------------- THE CALL */}
      {/* Centred absolutely, not by flex: otherwise the mute button shifts
          sideways as the peer name arrives, or when End class appears for a
          tutor and not for a student. The control you reach for without
          looking must not move. */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="pointer-events-auto">
          {phase === "joined" ? (
            <VideoControls size="lg" />
          ) : phase === "idle" || phase === "error" ? (
            <button
              type="button"
              onClick={join}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-primary-500 px-5 text-sm font-semibold text-white shadow-lg transition hover:bg-primary-600"
            >
              <VideoIcon className="h-4 w-4" />
              {phase === "error" ? "Rejoin" : "Join the call"}
            </button>
          ) : (
            <span className="text-xs font-medium text-slate-400">
              {phase === "scheduled"
                ? "Waiting for class to start"
                : phase === "ended"
                  ? "Class finished"
                  : phase === "joining"
                    ? "Connecting…"
                    : "Video unavailable"}
            </span>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------ TOOLS */}
      <div className="ml-auto flex items-center gap-1.5">
        {/* Above lg the rail is docked and this is nothing but noise. */}
        <button
          type="button"
          onClick={onOpenRail}
          className="relative inline-flex h-10 items-center gap-1.5 rounded-full bg-slate-800 px-3 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 lg:hidden"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">{railTabs[0]?.label ?? "Chat"}</span>
          {unread ? (
            <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-accent px-1 text-[10px] font-bold leading-[18px] text-white">
              {unread}
            </span>
          ) : null}
        </button>

        {/* Destructive, so it is the last thing on the row and never adjacent
            to a control someone reaches for mid-lesson. It used to sit one
            pixel from "Send homework" in a scrolling toolbar. */}
        {canEndClass && onEndClass ? (
          <button
            type="button"
            onClick={onEndClass}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-4 text-xs font-semibold text-white transition hover:brightness-110"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">End class</span>
          </button>
        ) : null}
      </div>
    </div>
  );
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
  // How much of the screen the mobile sheet takes. It starts SHORT on purpose:
  // a sheet tall enough to read a long chat is a sheet that has hidden the
  // lesson, and the lesson is what the class is about. Short by default,
  // taller when someone actually wants to read — their choice, not ours.
  const [sheetTall, setSheetTall] = useState(false);
  const [tab, setTab] = useState(railTabs[0]?.key ?? "chat");
  const { phase } = useRoomVideo();

  // When the clock runs out, bring the call stage forward. Otherwise the
  // class ends while both people are looking at a lesson page, the video
  // simply stops, and nothing anywhere says why.
  useEffect(() => {
    if (phase === "ended") onStageChange("call");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

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
        {/* The tabs never yield. They used to be `min-w-0 flex-1` against a
            `shrink-0` actions row — which is fine at 1440px and catastrophic
            at 375px: the toolbar is ~600px wide, so it took the whole header
            and squeezed the tab strip to ZERO. On a phone there was no way to
            get from the lesson back to the call. The actions scroll instead;
            they are all optional, and the stage tabs are not. */}
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

          {railBody}
        </aside>
      </div>

      {/* ------------------------------------------------------------ BASE */}
      <div className="relative">
        <ControlBar
          peerName={peerName}
          railTabs={railTabs}
          unread={unread}
          onOpenRail={() => setRailOpen(true)}
          onEndClass={onEndClass}
          canEndClass={canEndClass}
        />
      </div>

      {/* ------------------------------------------------- RAIL (below lg) */}
      {railOpen ? (
        <>
          {/* No scrim. A scrim says "the thing behind this is disabled", and
              the thing behind this is the lesson, which is still being taught.
              Tapping the material should just work. */}
          {/* Two heights, toggled by the grabber. Default is the short one so
              the lesson keeps most of the screen — the previous 70dvh sheet,
              stacked under the video strip, left the material a sliver. */}
          <div
            className={cn(
              "fixed inset-x-0 bottom-16 z-50 flex flex-col rounded-t-2xl border-t bg-white shadow-2xl transition-[height] duration-200 lg:hidden",
              sheetTall ? "h-[80dvh]" : "h-[42dvh]"
            )}
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <button
              type="button"
              onClick={() => setSheetTall((v) => !v)}
              className="flex w-full shrink-0 items-center justify-center py-2"
              aria-label={sheetTall ? "Shrink panel" : "Expand panel"}
            >
              <span className="h-1 w-10 rounded-full bg-slate-300" />
            </button>
            <div className="flex items-center justify-between border-b px-3 pb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600">
                <Sparkles className="h-3.5 w-3.5" />
                {active?.label ?? "Room"}
              </span>
              <span className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRailOpen(false);
                    setSheetTall(false);
                  }}
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
      ) : null}
    </div>
  );
}

export const STAGE_ICONS = { call: VideoIcon, lesson: MessageSquare, board: PenTool, people: Users, materials: Library };
