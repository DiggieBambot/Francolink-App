"use client";

// The lesson's video call, owned once and rendered in two places.
//
// The room shows video at two sizes: a big stage while no lesson is open (the
// call IS the lesson at that point), and small tiles in the right rail once
// material is on screen. Those are two views of ONE call — if each owned its
// own Daily instance, switching stages would drop the call, and daily-js
// allows only one call object per page anyway.
//
// So the call lives here, above both, and the views are presentational.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import DailyIframe, {
  type DailyCall,
  type DailyParticipant,
} from "@daily-co/daily-js";

export type VideoPhase =
  | "idle"
  | "joining"
  | "joined"
  | "error"
  /** No DAILY_API_KEY on this deployment. */
  | "unconfigured"
  /** This room's tutor is not a listed FrancoLink tutor. */
  | "unavailable";

interface VideoContextValue {
  phase: VideoPhase;
  error: string | null;
  notice: string | null;
  local: DailyParticipant | null;
  remote: DailyParticipant | null;
  micOn: boolean;
  camOn: boolean;
  join: () => Promise<void>;
  leave: () => Promise<void>;
  toggleMic: () => void;
  toggleCam: () => void;
  /** Seconds since the call connected — drives the lesson timer. */
  elapsed: number;
}

const Ctx = createContext<VideoContextValue | null>(null);

export function useRoomVideo(): VideoContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRoomVideo must be used inside <RoomVideoProvider>");
  return v;
}

/**
 * Turn a browser or Daily error into something the person can act on.
 *
 * The raw text is still logged. What is shown is the sentence that tells them
 * what to DO — a denied camera and an unreachable server are both "couldn't
 * start video" and have nothing else in common.
 */
function friendlyError(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes("payment-method") || m.includes("payment method")) {
    return "Video is blocked on our account. We're on it — carry on with chat and the board.";
  }
  if (m.includes("permission") || m.includes("notallowed") || m.includes("denied")) {
    return "Your browser blocked the camera. Allow it in the address bar, then rejoin.";
  }
  if (m.includes("notfound") || m.includes("device")) {
    return "No camera or microphone found. Plug one in, then rejoin.";
  }
  if (m.includes("notreadable") || m.includes("in use")) {
    return "Your camera is in use by another app or tab. Close it, then rejoin.";
  }
  if (m.includes("duplicate")) {
    return "Video was already running. Rejoin to restart it.";
  }
  if (m.includes("timeout") || m.includes("timed out")) {
    return "Video took too long to connect. Check your network, then rejoin.";
  }
  return raw || "Couldn't start video.";
}

export function RoomVideoProvider({
  sessionId,
  children,
}: {
  sessionId: string;
  children: React.ReactNode;
}) {
  const [phase, setPhase] = useState<VideoPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [local, setLocal] = useState<DailyParticipant | null>(null);
  const [remote, setRemote] = useState<DailyParticipant | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  const callRef = useRef<DailyCall | null>(null);
  const joinedAt = useRef<number | null>(null);

  // The timer counts from when the call connected, not from when the page
  // opened — a tutor who arrives ten minutes early is not ten minutes into
  // the lesson.
  useEffect(() => {
    if (phase !== "joined") {
      joinedAt.current = null;
      setElapsed(0);
      return;
    }
    joinedAt.current = Date.now();
    const t = setInterval(() => {
      if (joinedAt.current) {
        setElapsed(Math.floor((Date.now() - joinedAt.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  const sync = useCallback((call: DailyCall) => {
    const all = call.participants();
    setLocal(all.local ?? null);
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
      // and then every retry throws that instead of the real problem.
      const orphan = DailyIframe.getCallInstance();
      if (orphan) {
        try {
          await orphan.leave();
        } catch {
          /* already gone */
        }
        orphan.destroy();
      }

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
          console.error("[video] daily error", e);
          setError(
            friendlyError(
              (e as { errorMsg?: string } | undefined)?.errorMsg ?? "Video disconnected."
            )
          );
          setPhase("error");
        });

      // Daily can sit in "joining" indefinitely on a bad network. A spinner
      // that never resolves is the worst of the failure modes: nobody knows
      // whether to wait or reload.
      await Promise.race([
        call.join({ url: body.roomUrl, token: body.token }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout: video did not connect")), 25_000)
        ),
      ]);

      setPhase("joined");
      sync(call);
    } catch (e) {
      console.error("[video] join failed", e);
      setError(friendlyError(e instanceof Error ? e.message : String(e)));
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

  const toggleMic = useCallback(() => {
    const call = callRef.current;
    if (!call) return;
    setMicOn((on) => {
      call.setLocalAudio(!on);
      return !on;
    });
  }, []);

  const toggleCam = useCallback(() => {
    const call = callRef.current;
    if (!call) return;
    setCamOn((on) => {
      call.setLocalVideo(!on);
      return !on;
    });
  }, []);

  return (
    <Ctx.Provider
      value={{
        phase, error, notice, local, remote, micOn, camOn,
        join, leave, toggleMic, toggleCam, elapsed,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
