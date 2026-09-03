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
  | "unavailable"
  /** The room is real, but its class is not on right now. */
  | "scheduled"
  /** The class reached its hard end and the call was cut. */
  | "ended";

interface VideoContextValue {
  phase: VideoPhase;
  error: string | null;
  notice: string | null;
  local: DailyParticipant | null;
  remote: DailyParticipant | null;
  micOn: boolean;
  camOn: boolean;
  /** Whether WE are the one sharing. */
  screenOn: boolean;
  /** Somebody is sharing — ours or theirs. Drives the stage swap. */
  screenActive: boolean;
  join: () => Promise<void>;
  leave: () => Promise<void>;
  toggleMic: () => void;
  toggleCam: () => void;
  /** Null when the browser cannot share (iOS Safari), so the UI can hide it. */
  toggleScreen: (() => void) | null;
  /** Seconds since the call connected — drives the lesson timer. */
  elapsed: number;
  /**
   * Seconds left before the class is cut, or null on a room with no class
   * deadline (an independent tutor's own classroom).
   */
  remaining: number | null;
  /** The deadline itself, ISO, for anything that wants to render a time. */
  hardEndsAt: string | null;
  /** When video unlocks, while phase is "scheduled". */
  opensAt: string | null;
  /** Scheduled start of the next class, while phase is "scheduled". */
  startsAt: string | null;
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

/** What the server already knew about this room's class when the page rendered. */
export interface InitialClassWindow {
  open: boolean;
  opensAt: string | null;
  startsAt: string | null;
}

export function RoomVideoProvider({
  sessionId,
  initialWindow,
  children,
}: {
  sessionId: string;
  /**
   * Resolved server-side so the pre-class state is on screen at first paint.
   * Without it a student would see "Start the call", press it, and only then
   * be told there is no class on — which reads as a rejection rather than as
   * a schedule.
   */
  initialWindow?: InitialClassWindow;
  children: React.ReactNode;
}) {
  const scheduledButClosed = initialWindow ? !initialWindow.open : false;
  const [phase, setPhase] = useState<VideoPhase>(
    scheduledButClosed ? "scheduled" : "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(
    scheduledButClosed
      ? initialWindow?.startsAt
        ? "Video turns on shortly before your next class."
        : "This room has no upcoming class booked."
      : null
  );
  const [local, setLocal] = useState<DailyParticipant | null>(null);
  const [remote, setRemote] = useState<DailyParticipant | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenOn, setScreenOn] = useState(false);
  const [screenActive, setScreenActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [hardEndsAt, setHardEndsAt] = useState<string | null>(null);
  const [opensAt, setOpensAt] = useState<string | null>(initialWindow?.opensAt ?? null);
  const [startsAt, setStartsAt] = useState<string | null>(initialWindow?.startsAt ?? null);

  const callRef = useRef<DailyCall | null>(null);
  const joinedAt = useRef<number | null>(null);
  /**
   * Offset between this browser's clock and the server's, in ms.
   *
   * Both sides of a class must see the same countdown, and a laptop whose
   * clock is five minutes out would otherwise show a five-minute-wrong
   * deadline — or, worse, let a student set their clock back to buy time. The
   * token route sends its own `now` with the deadline; every countdown here is
   * computed against server time reconstructed from that.
   */
  const clockSkew = useRef(0);

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

  // Waiting for class to open.
  //
  // Somebody who arrives early leaves the tab sitting there. Without this the
  // "next class" card would still be on screen at start time and they would
  // have to reload to be let in — the one moment a reload is least welcome.
  useEffect(() => {
    if (phase !== "scheduled" || !opensAt) return;
    const wait = new Date(opensAt).getTime() - Date.now();
    if (wait <= 0) {
      setPhase("idle");
      setNotice(null);
      return;
    }
    // setTimeout saturates past ~24.8 days and would fire immediately; a class
    // booked further out just needs a reload, which is fine.
    if (wait > 2_147_000_000) return;
    const t = setTimeout(() => {
      setPhase("idle");
      setNotice(null);
    }, wait + 1000);
    return () => clearTimeout(t);
  }, [phase, opensAt]);

  // The countdown, and the hard stop.
  //
  // Daily's token expiry is what actually ends the call — that is server-side
  // and cannot be argued with. This exists so the last minutes are ANNOUNCED
  // rather than the picture simply freezing: a class that vanishes without
  // warning reads as a crash, and both people spend the next minute wondering
  // whose wifi died.
  useEffect(() => {
    if (phase !== "joined" || !hardEndsAt) {
      setRemaining(null);
      return;
    }
    const deadline = new Date(hardEndsAt).getTime();
    const tick = () => {
      const serverNow = Date.now() + clockSkew.current;
      const left = Math.max(0, Math.round((deadline - serverNow) / 1000));
      setRemaining(left);
      if (left <= 0) {
        // Leave cleanly ourselves rather than waiting to be dropped, so the
        // camera light goes out and the room can show the post-class state.
        void leaveRef.current?.();
        setPhase("ended");
      }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [phase, hardEndsAt]);

  const sync = useCallback((call: DailyCall) => {
    const all = call.participants();
    setLocal(all.local ?? null);
    const others = Object.values(all).filter((p) => !p.local);
    setRemote(others[0] ?? null);
    // Daily reports a screen share as a second set of tracks on the person
    // sharing, not as an extra participant, so this is the only way to know.
    const everyone = Object.values(all);
    setScreenOn(all.local?.tracks?.screenVideo?.state === "playable");
    setScreenActive(
      everyone.some((p) => p.tracks?.screenVideo?.state === "playable")
    );
  }, []);

  // The countdown effect needs to end the call, but `leave` is defined below
  // it and resets phase to "idle" — which would erase the "ended" state we are
  // setting. A ref keeps the ordering honest without a dependency cycle.
  const leaveRef = useRef<(() => Promise<void>) | null>(null);

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

  useEffect(() => {
    leaveRef.current = leave;
  }, [leave]);

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
      if (res.status === 403 && body.scheduled) {
        // Not an error and not a failure — there is simply no class on. The
        // rest of the room (chat, material, homework) stays open around it.
        setNotice(body.error as string);
        setOpensAt((body.opensAt as string) ?? null);
        setStartsAt((body.startsAt as string) ?? null);
        setPhase("scheduled");
        return;
      }
      if (!res.ok || !body.roomUrl || !body.token) {
        throw new Error(body.error || "Couldn't start video.");
      }

      // Anchor our clock to the server's before anything counts down.
      if (body.serverNow) {
        clockSkew.current = new Date(body.serverNow as string).getTime() - Date.now();
      }
      setHardEndsAt((body.hardEndsAt as string) ?? null);

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

  /**
   * Share the screen, where the browser allows it.
   *
   * iOS Safari has no getDisplayMedia at all, so this resolves to null there
   * and the control is not rendered — a share button that silently does
   * nothing is worse than no share button, because the person keeps pressing
   * it while the class waits.
   */
  const canShare =
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getDisplayMedia === "function";

  const toggleScreen = useCallback(() => {
    const call = callRef.current;
    if (!call) return;
    if (screenOn) {
      call.stopScreenShare();
    } else {
      // The browser's own picker can be cancelled; Daily reports that as an
      // error we do not want surfaced as a failed class.
      try {
        call.startScreenShare();
      } catch {
        /* the person changed their mind at the picker */
      }
    }
  }, [screenOn]);

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
        screenOn, screenActive,
        join, leave, toggleMic, toggleCam,
        toggleScreen: canShare ? toggleScreen : null,
        elapsed,
        remaining, hardEndsAt, opensAt, startsAt,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
