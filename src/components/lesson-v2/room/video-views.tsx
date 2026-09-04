"use client";

// Two views of one call.
//
//   <VideoStage>  the main area while no lesson is open — the call IS the
//                 lesson at that point, so it gets the room.
//   <VideoRail>   small tiles pinned above the rail's tabs once material is on
//                 screen. Pinned, not a tab: losing sight of your student the
//                 moment you open the whiteboard would defeat teaching live.
//
// Both read the same call from RoomVideoProvider, so switching between them
// never drops the connection.

import { useEffect, useRef, useState } from "react";
import type { DailyParticipant } from "@daily-co/daily-js";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Loader2, AlertCircle, UserRound,
  CalendarClock, ScreenShare, ScreenShareOff, CheckCircle2,
} from "lucide-react";
import { useRoomVideo } from "./video-context";
import { Lobby } from "./lobby";
import { cn } from "@/lib/utils";

/** Attaches a participant's tracks to <video>/<audio> as they come and go. */
function useTracks(
  participant: DailyParticipant | null,
  muted: boolean,
  videoRef: React.RefObject<HTMLVideoElement | null>,
  audioRef: React.RefObject<HTMLAudioElement | null>,
  /** Render what they are SHARING rather than their camera. */
  screen = false
) {
  useEffect(() => {
    const v = screen ? participant?.tracks?.screenVideo : participant?.tracks?.video;
    const track = v?.state === "playable" ? v.persistentTrack : null;
    if (videoRef.current) {
      videoRef.current.srcObject = track ? new MediaStream([track]) : null;
    }
  }, [participant, videoRef, screen]);

  useEffect(() => {
    if (muted) return;
    const a = participant?.tracks?.audio;
    const track = a?.state === "playable" ? a.persistentTrack : null;
    if (audioRef.current) {
      audioRef.current.srcObject = track ? new MediaStream([track]) : null;
    }
  }, [participant, muted, audioRef]);
}

function Tile({
  participant,
  label,
  muted,
  className,
  rounded = "rounded-lg",
  cover = false,
  screen = false,
}: {
  participant: DailyParticipant | null;
  /** Shown only until the person actually arrives — see `name` below. */
  label: string;
  /** Always true for your own tile — hearing yourself is unusable. */
  muted?: boolean;
  className?: string;
  rounded?: string;
  /** Crop to fill instead of letterboxing. Only for the small self-view. */
  cover?: boolean;
  /** Show their shared screen instead of their camera. */
  screen?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useTracks(participant, Boolean(muted), videoRef, audioRef, screen);

  const camOff = screen
    ? participant?.tracks?.screenVideo?.state !== "playable"
    : participant?.tracks?.video?.state !== "playable";

  // The person's own name, which Daily carries from the meeting token. "Them"
  // is a placeholder for the seconds before anyone has joined, not a label to
  // teach beside — a student should see their tutor's name on the tile.
  const name = participant?.user_name?.trim() || label;

  return (
    <div className={cn("relative overflow-hidden bg-slate-900", rounded, className)}>
      {/* object-CONTAIN, not cover. The two sides are almost never the same
          shape — a tutor on a laptop is 16:9 and a student on a phone is 9:16
          — and cover crops the difference away, which on a portrait phone
          means slicing off most of a face. Letterboxing against the dark
          background shows the whole frame at whatever shape it arrives in. */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cn(
          "h-full w-full",
          cover ? "object-cover" : "object-contain",
          camOff && "hidden"
        )}
      />
      {!muted && <audio ref={audioRef} autoPlay playsInline />}

      {camOff && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5">
          <UserRound className="h-6 w-6 text-slate-600" />
          {/* Just the state, never the name. The corner chip below already
              carries the name, and printing it here too rendered it TWICE on
              one tile — which on the small self-view truncated to the useless
              "Francais avec Bambot —", eating the whole tile to say nothing. */}
          <span className="px-2 text-center text-[11px] font-semibold text-slate-400">
            {participant ? "Camera off" : "Waiting…"}
          </span>
        </div>
      )}

      {/* Only once somebody is actually there. With nobody joined the centre
          placeholder already says so, and rendering the fallback here too put
          "Waiting…" on the tile twice. */}
      {participant ? (
        <span className="absolute bottom-1 left-1 max-w-[calc(100%-2rem)] truncate rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          {name}
        </span>
      ) : null}

      {participant && participant.tracks?.audio?.state !== "playable" && (
        <span className="absolute bottom-1 right-1 rounded bg-black/60 p-1">
          <MicOff className="h-3 w-3 text-red-400" />
        </span>
      )}
    </div>
  );
}

/** Mic / camera / share / leave. Same controls at both sizes. */
export function VideoControls({ size = "sm" }: { size?: "sm" | "lg" }) {
  const { micOn, camOn, screenOn, toggleMic, toggleCam, toggleScreen, leave } =
    useRoomVideo();
  const box = size === "lg" ? "h-11 w-11" : "h-8 w-8";
  const icon = size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <div className="flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={toggleMic}
        aria-pressed={!micOn}
        title={micOn ? "Mute" : "Unmute"}
        className={cn(
          "inline-flex items-center justify-center rounded-full transition-colors",
          box,
          micOn ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-red-600 text-white"
        )}
      >
        {micOn ? <Mic className={icon} /> : <MicOff className={icon} />}
      </button>
      <button
        type="button"
        onClick={toggleCam}
        aria-pressed={!camOn}
        title={camOn ? "Turn camera off" : "Turn camera on"}
        className={cn(
          "inline-flex items-center justify-center rounded-full transition-colors",
          box,
          camOn ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-red-600 text-white"
        )}
      >
        {camOn ? <Video className={icon} /> : <VideoOff className={icon} />}
      </button>
      {/* Absent, not disabled, where the browser has no getDisplayMedia —
          iOS Safari. A share button that silently does nothing gets pressed
          repeatedly while the class waits. */}
      {toggleScreen ? (
        <button
          type="button"
          onClick={toggleScreen}
          aria-pressed={screenOn}
          title={screenOn ? "Stop sharing your screen" : "Share your screen"}
          className={cn(
            "hidden items-center justify-center rounded-full transition-colors sm:inline-flex",
            box,
            screenOn
              ? "bg-primary-500 text-white hover:bg-primary-600"
              : "bg-slate-700 text-white hover:bg-slate-600"
          )}
        >
          {screenOn ? (
            <ScreenShareOff className={icon} />
          ) : (
            <ScreenShare className={icon} />
          )}
        </button>
      ) : null}
      <button
        type="button"
        onClick={leave}
        title="Leave video (the lesson stays open)"
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700",
          box
        )}
      >
        <PhoneOff className={icon} />
      </button>
    </div>
  );
}

/**
 * "Starts in 7m 12s" — recomputed every second so a person waiting for class
 * watches it come down rather than wondering whether the page is stale.
 */
function useCountdownTo(iso: string | null): number | null {
  // A ticking clock, not a ticking countdown: the effect only advances "now",
  // and the remaining time is derived during render. Storing the difference in
  // state instead would mean setting state from the effect body on every
  // change of `iso`, which cascades a second render for no gain.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!iso) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [iso]);
  if (!iso) return null;
  return Math.max(0, Math.round((new Date(iso).getTime() - now) / 1000));
}

function untilLabel(seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  if (seconds >= 60) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/** Shared not-live states, so the stage and the rail never disagree. */
function Inert({ compact }: { compact: boolean }) {
  const { phase, error, notice, opensAt, startsAt } = useRoomVideo();
  const untilOpen = useCountdownTo(phase === "scheduled" ? opensAt : null);

  if (phase === "unconfigured") {
    return (
      <p className={cn("text-slate-400", compact ? "text-xs" : "text-sm")}>
        Video isn&apos;t set up yet — carry on with chat and the board.
      </p>
    );
  }
  if (phase === "unavailable") {
    return (
      <p className={cn("text-slate-400", compact ? "text-xs" : "text-sm")}>{notice}</p>
    );
  }
  if (phase === "scheduled") {
    // Nothing is broken and there is nothing to retry — this pair simply has
    // no class on right now. Say when the next one is and get out of the way;
    // the rest of the room stays open around this.
    return (
      <div className={cn("w-full text-center", compact ? "" : "max-w-xs")}>
        <CalendarClock
          className={cn("mx-auto mb-2 text-primary-300", compact ? "h-5 w-5" : "h-7 w-7")}
        />
        <p className={cn("font-semibold text-slate-200", compact ? "text-xs" : "text-sm")}>
          {startsAt
            ? `Next class ${new Date(startsAt).toLocaleString(undefined, {
                weekday: "short",
                hour: "numeric",
                minute: "2-digit",
              })}`
            : "No class booked yet"}
        </p>
        <p className={cn("mt-1 text-slate-400", compact ? "text-[11px]" : "text-xs")}>
          {untilOpen !== null && untilOpen > 0
            ? `Video opens in ${untilLabel(untilOpen)}`
            : notice}
        </p>
      </div>
    );
  }
  if (phase === "ended") {
    // The class hit its hard end. Say so plainly and say what survives — the
    // first question after a call cuts out is always "did I lose my work?".
    return (
      <div className={cn("w-full text-center", compact ? "" : "max-w-sm")}>
        <span
          className={cn(
            "mx-auto mb-3 flex items-center justify-center rounded-full bg-primary-500/15 text-primary-300",
            compact ? "h-8 w-8" : "h-12 w-12"
          )}
        >
          <CheckCircle2 className={compact ? "h-4 w-4" : "h-6 w-6"} />
        </span>
        <p className={cn("font-semibold text-white", compact ? "text-xs" : "text-base")}>
          That&apos;s time — class finished
        </p>
        <p className={cn("mt-1 text-slate-400", compact ? "text-[11px]" : "text-sm")}>
          Your chat, notes and the lesson you worked through all stay in this
          room. Come back to them any time.
        </p>
      </div>
    );
  }
  if (phase === "joining") {
    return (
      <span className="inline-flex items-center gap-2 text-xs text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Connecting…
      </span>
    );
  }

  // Deliberately NO join button here.
  //
  // The control bar at the bottom owns every call action, at every width. This
  // area used to carry its own "Start the call", which meant the room showed
  // two different join buttons at once — and a person who has to decide which
  // of two identical buttons to press has been given a puzzle, not a choice.
  // What belongs here is the EXPLANATION; the action belongs on the bar.
  return (
    <div className={cn("w-full text-center", compact ? "" : "max-w-xs")}>
      {error ? (
        <p className="flex items-start gap-1.5 text-left text-xs text-red-400">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : (
        <>
          <Video
            className={cn(
              "mx-auto mb-2 text-slate-600",
              compact ? "h-5 w-5" : "h-8 w-8"
            )}
          />
          <p className={cn("font-medium text-slate-400", compact ? "text-[11px]" : "text-sm")}>
            Not in the call yet — open <b className="text-slate-300">Call</b> to
            check your camera and join.
          </p>
        </>
      )}
    </div>
  );
}

/**
 * The big view. Remote fills the stage, you sit in the corner — the person you
 * are talking to should be the one you are looking at.
 */
export function VideoStage() {
  const { phase, local, remote, screenOn, screenActive } = useRoomVideo();
  // Somebody is sharing: what they are showing becomes the thing worth
  // looking at, and the faces move to the corner. Sharing a screen and then
  // still being the biggest thing on it is the failure mode of every video
  // tool that treats the share as just another tile.
  const sharer = screenOn ? local : remote;

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-slate-900">
      {phase === "joined" ? (
        <>
          <Tile
            participant={screenActive ? sharer : remote}
            label="Your tutor"
            screen={screenActive}
            rounded="rounded-none"
            className="absolute inset-0"
          />
          {screenActive ? (
            <>
              <span className="absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full bg-primary-500/90 px-3 py-1 text-xs font-semibold text-white shadow-lg backdrop-blur">
                <ScreenShare className="h-3.5 w-3.5" />
                {screenOn ? "You're sharing your screen" : "Screen shared"}
              </span>
              {/* The face of whoever is NOT the share, kept in view — a class
                  is still a conversation while a document is on screen. */}
              <Tile
                participant={screenOn ? remote : local}
                label={screenOn ? "Them" : "You"}
                muted={!screenOn}
                cover
                className="absolute bottom-4 right-[11.5rem] z-10 aspect-video w-32 shadow-xl ring-2 ring-slate-900 sm:w-44"
              />
            </>
          ) : null}
          {/* Self-view inset, the shape every video product has settled on. */}
          <Tile
            participant={local}
            label="You"
            muted
            cover
            className="absolute bottom-4 right-4 z-10 aspect-video w-40 shadow-xl ring-2 ring-slate-900 sm:w-56"
          />
        </>
      ) : phase === "idle" || phase === "scheduled" || phase === "joining" || phase === "error" ? (
        // Before the call, the stage is the lobby: see yourself, pick your
        // devices, watch the meter move. The two commonest ways a lesson goes
        // wrong are "you're on mute" and "I can't hear you", and both are
        // settled here rather than thirty seconds into a paid lesson.
        <Lobby />
      ) : (
        // unconfigured / unavailable / ended — nothing to set up, just say why.
        <div className="px-6 text-center">
          <Inert compact={false} />
        </div>
      )}
    </div>
  );
}

/**
 * The rail view: ONE large remote tile with your own camera inset in its
 * corner.
 *
 * It used to be two tiles side by side. In a 360px column that gives each
 * person about 170px of width, and since the two sides are rarely the same
 * shape, both faces ended up small inside thick letterbox bars — a lot of
 * black for very little person. Every video product converges on
 * remote-large/self-inset for the same reason: you are looking at THEM, and
 * your own camera only has to answer "is my face in frame".
 */
export function VideoRail() {
  const { phase, local, remote } = useRoomVideo();
  // Which feed is the big one. Not a resizable inset: drag handles need a
  // minimum size, persistence and a touch target, and the thing people
  // actually want is "make mine big for a second" — to check their framing,
  // or hold something up to the camera. One tap does that, and one taps back.
  const [selfLarge, setSelfLarge] = useState(false);

  if (phase !== "joined") {
    // Same dark block, same shape, whether or not the call is up. A pale
    // little strip that becomes a 16:9 video well the moment you join makes
    // the rail jump and reads as two different products; the space where the
    // faces will be should look like the space where the faces will be.
    return (
      <div className="border-b bg-slate-900">
        <div className="flex h-32 w-full items-center justify-center px-4 lg:aspect-video lg:h-auto">
          <Inert compact />
        </div>
      </div>
    );
  }

  return (
    <div className="border-b bg-slate-900">
      {/* Fixed height on phones so the strip cannot eat the lesson; 16:9 on
          desktop where the rail has room to give. */}
      <div className="relative h-32 w-full lg:aspect-video lg:h-auto">
        <Tile
          participant={selfLarge ? local : remote}
          label={selfLarge ? "You" : "Waiting…"}
          muted={selfLarge}
          rounded="rounded-none"
          className="absolute inset-0"
        />

        {/* Self-view inset. object-cover here on purpose: this tile only has
            to confirm you are in frame, and a crop is a fair trade for it
            being small. The remote tile never crops. */}
        {/* Sized as a PROPORTION of the video block, not in fixed pixels.
            Fixed sizes meant the inset stayed 96px wide whether the rail was
            360px or a phone was 430px, so it read as a thumbnail rather than
            a camera you could actually check yourself in. A percentage keeps
            it the same visual weight at every width. */}
        <button
          type="button"
          onClick={() => setSelfLarge((v) => !v)}
          title={selfLarge ? "Show them large" : "Show yourself large"}
          className="absolute bottom-2 right-2 z-10 aspect-video w-[34%] max-w-[11rem] overflow-hidden rounded-lg shadow-lg ring-1 ring-slate-700 transition hover:ring-2 hover:ring-white/70 lg:w-[40%]"
        >
          <Tile
            participant={selfLarge ? remote : local}
            label={selfLarge ? "Waiting…" : "You"}
            muted={!selfLarge}
            cover
            rounded="rounded-none"
            className="h-full w-full"
          />
        </button>
      </div>

    </div>
  );
}
