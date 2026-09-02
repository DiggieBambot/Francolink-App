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

import { useEffect, useRef } from "react";
import type { DailyParticipant } from "@daily-co/daily-js";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Loader2, AlertCircle, UserRound,
} from "lucide-react";
import { useRoomVideo } from "./video-context";
import { cn } from "@/lib/utils";

/** Attaches a participant's tracks to <video>/<audio> as they come and go. */
function useTracks(
  participant: DailyParticipant | null,
  muted: boolean,
  videoRef: React.RefObject<HTMLVideoElement | null>,
  audioRef: React.RefObject<HTMLAudioElement | null>
) {
  useEffect(() => {
    const v = participant?.tracks?.video;
    const track = v?.state === "playable" ? v.persistentTrack : null;
    if (videoRef.current) {
      videoRef.current.srcObject = track ? new MediaStream([track]) : null;
    }
  }, [participant, videoRef]);

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
}: {
  participant: DailyParticipant | null;
  label: string;
  /** Always true for your own tile — hearing yourself is unusable. */
  muted?: boolean;
  className?: string;
  rounded?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useTracks(participant, Boolean(muted), videoRef, audioRef);

  const camOff = participant?.tracks?.video?.state !== "playable";

  return (
    <div className={cn("relative overflow-hidden bg-slate-800", rounded, className)}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cn("h-full w-full object-cover", camOff && "hidden")}
      />
      {!muted && <audio ref={audioRef} autoPlay playsInline />}

      {camOff && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5">
          <UserRound className="h-6 w-6 text-slate-600" />
          <span className="text-[11px] font-semibold text-slate-400">
            {participant ? "Camera off" : "Waiting…"}
          </span>
        </div>
      )}

      <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
        {label}
      </span>

      {participant && participant.tracks?.audio?.state !== "playable" && (
        <span className="absolute bottom-1 right-1 rounded bg-black/60 p-1">
          <MicOff className="h-3 w-3 text-red-400" />
        </span>
      )}
    </div>
  );
}

/** Mic / camera / leave. Same three controls at both sizes. */
export function VideoControls({ size = "sm" }: { size?: "sm" | "lg" }) {
  const { micOn, camOn, toggleMic, toggleCam, leave } = useRoomVideo();
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

/** Shared not-live states, so the stage and the rail never disagree. */
function Inert({ compact }: { compact: boolean }) {
  const { phase, error, notice, join } = useRoomVideo();

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
  if (phase === "joining") {
    return (
      <span className="inline-flex items-center gap-2 text-xs text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Connecting…
      </span>
    );
  }

  return (
    <div className={cn("w-full", compact ? "" : "max-w-xs")}>
      {error && (
        <p className="mb-2 flex items-start gap-1.5 text-left text-xs text-red-400">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={join}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 font-semibold text-white hover:bg-emerald-700",
          compact ? "px-3 py-2 text-sm" : "px-5 py-3"
        )}
      >
        <Video className={compact ? "h-4 w-4" : "h-5 w-5"} />
        {error ? "Rejoin video" : "Start the call"}
      </button>
    </div>
  );
}

/**
 * The big view. Remote fills the stage, you sit in the corner — the person you
 * are talking to should be the one you are looking at.
 */
export function VideoStage() {
  const { phase, local, remote } = useRoomVideo();

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-slate-900">
      {phase === "joined" ? (
        <>
          <Tile
            participant={remote}
            label="Them"
            rounded="rounded-none"
            className="absolute inset-0"
          />
          {/* Self-view inset, the shape every video product has settled on. */}
          <Tile
            participant={local}
            label="You"
            muted
            className="absolute bottom-20 right-4 z-10 aspect-video w-40 shadow-xl ring-2 ring-slate-900 sm:w-56"
          />
          <div className="absolute inset-x-0 bottom-5 z-20">
            <VideoControls size="lg" />
          </div>
        </>
      ) : (
        <div className="px-6 text-center">
          <Inert compact={false} />
        </div>
      )}
    </div>
  );
}

/** The small view: two tiles above the rail's tabs. */
export function VideoRail() {
  const { phase, local, remote } = useRoomVideo();

  if (phase !== "joined") {
    return (
      <div className="border-b bg-slate-50 px-3 py-2.5 text-center">
        <Inert compact />
      </div>
    );
  }

  return (
    <div className="border-b bg-slate-900 p-2">
      <div className="grid grid-cols-2 gap-2">
        <Tile participant={remote} label="Them" className="aspect-video" />
        <Tile participant={local} label="You" muted className="aspect-video" />
      </div>
      <div className="mt-2">
        <VideoControls />
      </div>
    </div>
  );
}
