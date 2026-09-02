"use client";

// Camera and mic for the lesson.
//
// PINNED, not a tab. The rail's other panels are things you switch between —
// chat, whiteboard, people — but a face is not: losing sight of your student
// the moment you open the whiteboard would defeat the point of teaching live.
// So the tiles sit above the tabs and stay there.
//
// Deliberately small and boring. Two tiles, mute, camera, leave. Everything
// clever about this room is the whiteboard and the lesson content; the video
// only has to work.

import { useCallback, useEffect, useRef, useState } from "react";
import DailyIframe, {
  type DailyCall,
  type DailyParticipant,
} from "@daily-co/daily-js";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Phase =
  | "idle"
  | "joining"
  | "joined"
  | "error"
  /** No DAILY_API_KEY on this deployment. */
  | "unconfigured"
  /** This room's tutor is not a listed FrancoLink tutor. */
  | "unavailable";

/**
 * Pull a readable string out of whatever was thrown.
 *
 * daily-js rejects with plain objects, not Errors, so `String(e)` gives
 * "[object Object]" — which is what the room showed, and it hid the only
 * information worth having. Every shape gets dug through before giving up.
 */
function messageOf(e: unknown): string {
  if (!e) return "";
  if (typeof e === "string") return e;
  if (e instanceof Error) return e.message;

  const o = e as Record<string, unknown>;
  for (const k of ["errorMsg", "message", "msg", "error", "reason", "type"]) {
    const v = o[k];
    if (typeof v === "string" && v) return v;
    // Daily nests: { error: { msg: "..." } }
    if (v && typeof v === "object") {
      const inner = messageOf(v);
      if (inner) return inner;
    }
  }
  try {
    const json = JSON.stringify(e);
    if (json && json !== "{}") return json;
  } catch {
    /* circular */
  }
  return "";
}

/**
 * Turn a browser or Daily error into something the person can act on.
 *
 * The raw text is still logged. What is shown is the sentence that tells them
 * what to DO — a denied camera and an unreachable server are both "couldn't
 * start video" and have nothing else in common.
 */
function friendlyError(e: unknown): string {
  const raw = messageOf(e);
  const m = raw.toLowerCase();

  if (m.includes("permission") || m.includes("notallowed") || m.includes("denied")) {
    return "Your browser blocked the camera. Allow it in the address bar, then rejoin.";
  }
  if (m.includes("notfound") || m.includes("devices-not-found")) {
    return "No camera or microphone found. Plug one in, then rejoin.";
  }
  if (m.includes("notreadable") || m.includes("in use") || m.includes("device-in-use")) {
    return "Your camera is in use by another app or tab. Close it, then rejoin.";
  }
  if (m.includes("duplicate")) {
    return "Video was already running. Rejoin to restart it.";
  }
  if (m.includes("timeout") || m.includes("timed out")) {
    return "Video took too long to connect — this is usually a firewall or VPN blocking it. Try another network.";
  }
  if (m.includes("expired") || m.includes("not-allowed") || m.includes("rejected")) {
    return "This room's video session expired. Reload the page to start a new one.";
  }
  // Nothing matched: show the raw text rather than a comforting non-answer.
  return raw || "Couldn't start video.";
}

/** A join that never resolves is worse than one that fails. */
const JOIN_TIMEOUT_MS = 25_000;

function Tile({
  participant,
  call,
  label,
  muted,
}: {
  participant: DailyParticipant | null;
  call: DailyCall | null;
  label: string;
  /** Always true for your own tile — hearing yourself is unusable. */
  muted?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Tracks arrive and disappear as people toggle their camera, so the streams
  // are attached in an effect rather than once at mount.
  useEffect(() => {
    const v = participant?.tracks?.video;
    const track = v?.state === "playable" ? v.persistentTrack : null;
    if (videoRef.current) {
      videoRef.current.srcObject = track ? new MediaStream([track]) : null;
    }
  }, [participant]);

  useEffect(() => {
    if (muted) return;
    const a = participant?.tracks?.audio;
    const track = a?.state === "playable" ? a.persistentTrack : null;
    if (audioRef.current) {
      audioRef.current.srcObject = track ? new MediaStream([track]) : null;
    }
  }, [participant, muted]);

  const camOff = participant?.tracks?.video?.state !== "playable";

  return (
    <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-800">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cn("h-full w-full object-cover", camOff && "hidden")}
      />
      {!muted && <audio ref={audioRef} autoPlay playsInline />}

      {camOff && (
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-xs font-semibold text-slate-400">
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

export function VideoPanel({ sessionId }: { sessionId: string }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [local, setLocal] = useState<DailyParticipant | null>(null);
  const [remote, setRemote] = useState<DailyParticipant | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const callRef = useRef<DailyCall | null>(null);

  const sync = useCallback((call: DailyCall) => {
    const all = call.participants();
    setLocal(all.local ?? null);
    // 1:1 for now: the first remote participant is the other person. A group
    // room would map over these instead.
    const others = Object.values(all).filter((p) => !p.local);
    setRemote(others[0] ?? null);
  }, []);

  const leave = useCallback(async () => {
    const call = callRef.current;
    callRef.current = null;
    setPhase("idle");
    setLocal(null);
    setRemote(null);
    if (call) {
      try {
        await call.leave();
      } catch {
        /* leaving a call that already ended is not an error */
      }
      call.destroy();
    }
  }, []);

  const join = useCallback(async () => {
    if (callRef.current) return;
    setPhase("joining");
    setError(null);

    try {
      const res = await fetch(`/api/room/${sessionId}/video-token`, { method: "POST" });
      const body = await res.json().catch(() => ({}));

      if (res.status === 503 && body.unconfigured) {
        setPhase("unconfigured");
        return;
      }
      if (res.status === 403 && body.unavailable) {
        // Not an error and not retryable — say why and leave the lesson alone.
        setNotice(body.error as string);
        setPhase("unavailable");
        return;
      }
      if (!res.ok || !body.roomUrl || !body.token) {
        throw new Error(body.error || "Couldn't start video.");
      }

      // daily-js allows exactly ONE call object per page and throws
      // "Duplicate DailyIframe instances are not allowed" on the second. A
      // failed join can leave an orphan we no longer hold a reference to —
      // and then every retry throws that instead of the real problem, so the
      // panel is stuck until a full reload. Clear any existing instance first.
      const orphan = DailyIframe.getCallInstance();
      if (orphan) {
        try {
          await orphan.leave();
        } catch {
          /* already gone */
        }
        orphan.destroy();
      }

      // createCallObject, not an iframe: the tiles have to live inside a 340px
      // rail alongside the whiteboard, not take over the page.
      const call = DailyIframe.createCallObject({
        subscribeToTracksAutomatically: true,
      });
      callRef.current = call;

      const update = () => sync(call);
      call
        .on("participant-joined", update)
        .on("participant-updated", update)
        .on("participant-left", update)
        .on("joined-meeting", update)
        .on("error", (e) => {
          // Logged whole, not just the message: when the friendly text is
          // wrong, this object is the only way to find out why.
          console.error("[video] daily error", e);
          setError(friendlyError(e) || "Video disconnected.");
          setPhase("error");
        });

      // daily-js can sit in "joining" indefinitely when UDP is blocked — a
      // corporate firewall, some VPNs, a few mobile networks. Failing with an
      // explanation beats a spinner nobody can interpret.
      await Promise.race([
        call.join({ url: body.roomUrl, token: body.token }),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("timeout: video did not connect")),
            JOIN_TIMEOUT_MS
          )
        ),
      ]);
      setPhase("joined");
      sync(call);
    } catch (e) {
      // The real message matters here. "Couldn't start video" is the same
      // words for a denied camera, a blocked browser and an expired room, and
      // the person who has to act on it is usually the one reading it.
      console.error("[video] join failed", e);
      setError(friendlyError(e));
      setPhase("error");
      const call = callRef.current;
      callRef.current = null;
      try {
        call?.destroy();
      } catch {
        /* nothing left to clean up */
      }
    }
  }, [sessionId, sync]);

  // Leaving the page must release the camera. Without this the light stays on
  // and the next room refuses the device.
  useEffect(() => {
    return () => {
      const call = callRef.current;
      callRef.current = null;
      if (call) {
        call.leave().catch(() => {});
        call.destroy();
      }
    };
  }, []);

  function toggleMic() {
    const call = callRef.current;
    if (!call) return;
    const next = !micOn;
    call.setLocalAudio(next);
    setMicOn(next);
  }

  function toggleCam() {
    const call = callRef.current;
    if (!call) return;
    const next = !camOn;
    call.setLocalVideo(next);
    setCamOn(next);
  }

  // ---------------------------------------------------------------- not live
  if (phase === "unconfigured") {
    return (
      <div className="border-b bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
        Video isn&apos;t set up yet — carry on with chat and the whiteboard.
      </div>
    );
  }

  if (phase === "unavailable") {
    return (
      <div className="border-b bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
        {notice}
      </div>
    );
  }

  if (phase === "idle" || phase === "error") {
    return (
      <div className="border-b bg-slate-50 px-3 py-2.5">
        {error && (
          <p className="mb-2 flex items-start gap-1.5 text-xs text-red-600">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={join}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Video className="h-4 w-4" />
          {error ? "Rejoin video" : "Join with camera"}
        </button>
      </div>
    );
  }

  // ------------------------------------------------------------------- live
  return (
    <div className="border-b bg-slate-900 p-2">
      {phase === "joining" ? (
        <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Connecting…
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Tile participant={remote} call={callRef.current} label="Them" />
          <Tile participant={local} call={callRef.current} label="You" muted />
        </div>
      )}

      <div className="mt-2 flex items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={toggleMic}
          aria-pressed={!micOn}
          title={micOn ? "Mute" : "Unmute"}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors",
            micOn ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-red-600 text-white"
          )}
        >
          {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={toggleCam}
          aria-pressed={!camOn}
          title={camOn ? "Turn camera off" : "Turn camera on"}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors",
            camOn ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-red-600 text-white"
          )}
        >
          {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={leave}
          title="Leave video (the lesson stays open)"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700"
        >
          <PhoneOff className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
