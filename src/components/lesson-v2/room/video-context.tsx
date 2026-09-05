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

/** Off, or how much of the room to lose. */
export type BlurLevel = "off" | "light" | "strong";

/** Daily's own strength scale, 0..1. */
const BLUR_STRENGTH: Record<Exclude<BlurLevel, "off">, number> = {
  light: 0.35,
  strong: 0.9,
};

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
  /**
   * Join the call, optionally with the devices picked in the lobby. Without
   * them Daily takes the browser default, which on a laptop with a dock is
   * routinely the wrong microphone.
   */
  join: (devices?: { audioDeviceId?: string; videoDeviceId?: string }) => Promise<void>;
  leave: () => Promise<void>;
  toggleMic: () => void;
  toggleCam: () => void;
  /** Null when the browser cannot share (iOS Safari), so the UI can hide it. */
  toggleScreen: (() => void) | null;
  /**
   * What is happening to your picture and your sound.
   *
   * Daily offers background-blur, background-image and face-detection as video
   * processors, and noise-cancellation on audio. It has no "appearance" or
   * touch-up filter, so there is none here — the honest set is how much of
   * your room people can see and how clearly they can hear you.
   */
  blur: BlurLevel;
  setBlur: (level: BlurLevel) => void;
  denoise: boolean;
  toggleDenoise: () => void;
  /**
   * Whether this BROWSER can run the processors at all.
   *
   * Neither is universal. Both are on-device models, and Daily reports per
   * browser whether it can run them — older browsers, some mobile ones and
   * anything without the right WASM support simply cannot. Offering a control
   * that quietly refuses is worse than not offering it, so these gate the UI.
   */
  canProcessVideo: boolean;
  canProcessAudio: boolean;
  /** Inputs to choose from, and switching between them WITHOUT leaving. */
  devices: { mics: MediaDeviceInfo[]; cams: MediaDeviceInfo[]; speakers: MediaDeviceInfo[] };
  micId: string;
  camId: string;
  setMicDevice: (id: string) => void;
  setCamDevice: (id: string) => void;
  /** How the connection is holding up, so a bad picture has an explanation. */
  network: "good" | "warning" | "bad" | "unknown";
  /** Any effect on at all — for the button's active state. */
  blurOn: boolean;
  toggleBlur: () => void;
  /**
   * Start the camera WITHOUT joining, so the lobby can show you yourself and
   * apply blur before a single frame reaches anyone else.
   */
  startPreview: (devices?: { audioDeviceId?: string; videoDeviceId?: string }) => Promise<void>;
  stopPreview: () => void;
  /** True once the pre-join camera is running. */
  previewOn: boolean;
  /**
   * Our own live input level, 0..1, while in the call.
   *
   * The lobby proves the microphone works before you join; this is the same
   * proof DURING the class, because "I can't hear you" is a mid-lesson
   * problem and the answer is always either "you are muted" or "your input
   * moved". A meter answers both without anyone saying "can you hear me now".
   */
  localLevel: number;
  /**
   * True when the mic is on but nothing has reached it for a while — the
   * signature of a muted-at-the-OS mic, or an input that has silently
   * switched to a device nobody is talking into.
   */
  micSeemsDead: boolean;
  /** Seconds since the call connected — drives the lesson timer. */
  elapsed: number;
  /**
   * Seconds left before the class is cut, or null on a room with no class
   * deadline (an independent tutor's own classroom).
   */
  remaining: number | null;
  /** When the ROOM closes, ISO — the lesson length plus its grace. */
  hardEndsAt: string | null;
  /** Scheduled start of the lesson in progress, ISO. */
  classStartsAt: string | null;
  /** The lesson's billed length in minutes (25 or 50). */
  durationMinutes: number | null;
  /** Seconds since the lesson's scheduled start — the numerator of "3:25 / 25". */
  intoClass: number;
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
  const [blur, setBlurState] = useState<BlurLevel>("off");
  const [denoise, setDenoise] = useState(false);
  // Asked once. supportedBrowser() is a static read of the user agent and
  // capabilities, so it cannot change between renders — but it touches
  // navigator, so it must not run during SSR.
  const [devices, setDevices] = useState<{
    mics: MediaDeviceInfo[];
    cams: MediaDeviceInfo[];
    speakers: MediaDeviceInfo[];
  }>({ mics: [], cams: [], speakers: [] });
  const [micId, setMicId] = useState("");
  const [camId, setCamId] = useState("");
  const [network, setNetwork] = useState<"good" | "warning" | "bad" | "unknown">("unknown");
  const [caps, setCaps] = useState({ video: false, audio: false });
  useEffect(() => {
    try {
      const b = DailyIframe.supportedBrowser();
      setCaps({ video: b.supportsVideoProcessing, audio: b.supportsAudioProcessing });
    } catch {
      // A browser too old to answer is a browser that cannot do either.
    }
  }, []);
  const [previewOn, setPreviewOn] = useState(false);
  const [screenActive, setScreenActive] = useState(false);
  const [localLevel, setLocalLevel] = useState(0);
  const [micSeemsDead, setMicSeemsDead] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [hardEndsAt, setHardEndsAt] = useState<string | null>(null);
  const [classStartsAt, setClassStartsAt] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [intoClass, setIntoClass] = useState(0);
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

  // Watch our own microphone for the whole call.
  //
  // Daily gives us the local audio track; everything else here is the same
  // analyser the lobby uses. The point is not the meter — it is `micSeemsDead`,
  // which turns a class spent saying "can you hear me?" into a line of text
  // that says what is wrong.
  useEffect(() => {
    const track =
      phase === "joined" && micOn ? local?.tracks?.audio?.persistentTrack : null;
    if (!track) return;

    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;

    const ctx = new Ctor();
    const source = ctx.createMediaStreamSource(new MediaStream([track]));
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const buf = new Uint8Array(analyser.frequencyBinCount);

    let raf = 0;
    let lastHeard = Date.now();
    const tick = () => {
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      const level = Math.min(1, Math.sqrt(sum / buf.length) * 3.2);
      setLocalLevel((prev) => (level > prev ? level : prev * 0.82 + level * 0.18));
      // A threshold, not zero: a live mic in a silent room still reports a
      // little noise, so testing for exactly nothing would never fire.
      if (level > 0.04) lastHeard = Date.now();
      // Twenty seconds. Long enough that listening to your tutor explain
      // something does not accuse you of being broken.
      setMicSeemsDead(Date.now() - lastHeard > 20_000);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      source.disconnect();
      void ctx.close();
      setLocalLevel(0);
      setMicSeemsDead(false);
    };
  }, [phase, micOn, local]);

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
      if (classStartsAt) {
        setIntoClass(
          Math.max(0, Math.round((serverNow - new Date(classStartsAt).getTime()) / 1000))
        );
      }
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
  }, [phase, hardEndsAt, classStartsAt]);

  /**
   * The input list, re-read whenever it can have changed.
   *
   * Labels are empty until permission is granted, so this only says anything
   * useful once the camera is running — which is why it is called from sync()
   * rather than once on mount.
   */
  const refreshDevices = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices({
        mics: all.filter((d) => d.kind === "audioinput"),
        cams: all.filter((d) => d.kind === "videoinput"),
        speakers: all.filter((d) => d.kind === "audiooutput"),
      });
    } catch {
      /* a browser that will not enumerate is a browser with nothing to offer */
    }
  }, []);

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
    // The call object is destroyed below, and the camera and the blur
    // processor go with it. Saying otherwise would leave the lobby offering a
    // blur toggle attached to nothing.
    setPreviewOn(false);
    setBlurState("off");
    setDenoise(false);
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

  /**
   * The single Daily call object.
   *
   * daily-js allows exactly ONE per page and throws "Duplicate DailyIframe
   * instances are not allowed" on the second, so preview and join must share
   * it rather than each making their own. A failed attempt can also leave an
   * orphan we no longer hold a reference to, and then every retry throws that
   * instead of the real problem — hence the getCallInstance sweep.
   */
  const ensureCall = useCallback((): DailyCall => {
    if (callRef.current) return callRef.current;
    const orphan = DailyIframe.getCallInstance();
    if (orphan) {
      try {
        orphan.destroy();
      } catch {
        /* already gone */
      }
    }
    const call = DailyIframe.createCallObject({ subscribeToTracksAutomatically: true });
    callRef.current = call;
    const update = () => sync(call);
    call
      .on("participant-joined", update)
      .on("participant-updated", update)
      .on("participant-left", update)
      .on("joined-meeting", update)
      .on("started-camera", update)
      .on("available-devices-updated", () => void refreshDevices())
      .on("network-quality-change", (e) => {
        const n = (e as { networkState?: string } | undefined)?.networkState;
        setNetwork(
          n === "good" || n === "warning" || n === "bad" ? n : "unknown"
        );
      })
      .on("error", (e) => {
        console.error("[video] daily error", e);
        setError(
          friendlyError(
            (e as { errorMsg?: string } | undefined)?.errorMsg ?? "Video disconnected."
          )
        );
        setPhase("error");
      });
    return call;
  }, [sync, refreshDevices]);

  /**
   * Camera on, nobody watching.
   *
   * This is what makes background blur in the lobby MEAN anything. Blur you
   * can only switch on after joining is blur applied too late — the whole
   * reason to want it is that you do not want your room seen, and by then it
   * has been. Daily's own pre-join camera runs the processor on-device, so
   * the very first frame published at join is already blurred.
   */
  const startPreview = useCallback(
    async (devices?: { audioDeviceId?: string; videoDeviceId?: string }) => {
      const call = ensureCall();
      try {
        await call.startCamera({
          ...(devices?.audioDeviceId ? { audioSource: devices.audioDeviceId } : {}),
          ...(devices?.videoDeviceId ? { videoSource: devices.videoDeviceId } : {}),
        });
        setPreviewOn(true);
        sync(call);
        void refreshDevices();
      } catch (e) {
        console.error("[video] preview failed", e);
        setError(friendlyError(e instanceof Error ? e.message : String(e)));
      }
    },
    [ensureCall, sync, refreshDevices]
  );

  const stopPreview = useCallback(() => {
    setPreviewOn(false);
  }, []);

  const join = useCallback(async (devices?: {
    audioDeviceId?: string;
    videoDeviceId?: string;
  }) => {
    // Guard on the MEETING's state, not on whether a call object exists.
    //
    // `if (callRef.current) return` was correct when join() was the only thing
    // that ever created the call object: a non-null ref meant "already in a
    // call". The lobby's preview now creates it first, so that test was true
    // before anyone had joined anything — and Join the class silently did
    // nothing, every time, for everyone who used the lobby.
    //
    // meetingState() is what actually answers the question, and it answers it
    // from Daily rather than from an inference of ours.
    const state = callRef.current?.meetingState();
    if (state === "joining-meeting" || state === "joined-meeting") return;

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
      setClassStartsAt((body.classStartsAt as string) ?? null);
      setDurationMinutes((body.durationMinutes as number) ?? null);

      // Reuse the lobby's call object where there is one: its camera is
      // already running with the chosen devices and the blur processor
      // already attached, so joining publishes an already-blurred first frame
      // rather than a moment of unblurred room.
      const call = ensureCall();

      // Daily can sit in "joining" indefinitely on a bad network. A spinner
      // that never resolves is the worst of the failure modes: nobody knows
      // whether to wait or reload.
      await Promise.race([
        call.join({
          url: body.roomUrl,
          token: body.token,
          ...(devices?.audioDeviceId ? { audioSource: devices.audioDeviceId } : {}),
          ...(devices?.videoDeviceId ? { videoSource: devices.videoDeviceId } : {}),
        }),
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
      // The call object is deliberately NOT destroyed here. It now owns the
      // lobby's camera too, and tearing it down on a failed join would drop
      // the preview, the chosen devices and the blur — so a retry would start
      // from a black rectangle. Rejoining reuses this same object.
    }
  }, [sessionId, sync, ensureCall]);

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

  /**
   * Blur what is behind you.
   *
   * Tutors teach from kitchens and bedrooms and students join from wherever
   * they are; "let me just tidy up first" is a real reason a lesson starts
   * late. Daily runs the segmentation on-device, so nothing leaves the
   * browser.
   *
   * Failures are swallowed on purpose: the processor needs WebGL and enough
   * CPU, and where it cannot run, the honest outcome is an unblurred picture
   * and a lesson that carries on — not an error thrown in the middle of one.
   */
  const setBlur = useCallback((level: BlurLevel) => {
    const call = callRef.current;
    if (!call) return;
    setBlurState(level);
    void (async () => {
      try {
        await call.updateInputSettings({
          video: {
            processor:
              level === "off"
                ? { type: "none" }
                : { type: "background-blur", config: { strength: BLUR_STRENGTH[level] } },
          },
        });
      } catch (e) {
        console.error("[video] background blur unavailable", e);
        setBlurState("off");
      }
    })();
  }, []);

  /**
   * Noise cancellation.
   *
   * The closest thing to an "enhancement" that actually exists here, and in a
   * language lesson it is worth more than any filter on a face: a student
   * mispronouncing a vowel over a fan, a keyboard, or traffic is a student the
   * tutor cannot correct.
   */
  const toggleDenoise = useCallback(() => {
    const call = callRef.current;
    if (!call) return;
    const next = !denoise;
    setDenoise(next);
    void (async () => {
      try {
        await call.updateInputSettings({
          audio: { processor: { type: next ? "noise-cancellation" : "none" } },
        });
      } catch (e) {
        console.error("[video] noise cancellation unavailable", e);
        setDenoise(false);
      }
    })();
  }, [denoise]);

  const toggleBlur = useCallback(() => {
    setBlur(blur === "off" ? "strong" : "off");
  }, [blur, setBlur]);

  /**
   * Change microphone or camera mid-lesson.
   *
   * Without this the only way to switch inputs is to leave the call, change
   * it in the lobby and come back — during a paid lesson, with the other
   * person watching you disappear. Daily swaps the track in place, so the far
   * side sees a flicker rather than a departure.
   */
  const setMicDevice = useCallback((id: string) => {
    setMicId(id);
    void callRef.current?.setInputDevicesAsync({ audioDeviceId: id || null });
  }, []);

  const setCamDevice = useCallback((id: string) => {
    setCamId(id);
    void callRef.current?.setInputDevicesAsync({ videoDeviceId: id || null });
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
        screenOn, screenActive, localLevel, micSeemsDead,
        join, leave, toggleMic, toggleCam,
        toggleScreen: canShare ? toggleScreen : null,
        blur, setBlur, denoise, toggleDenoise,
        canProcessVideo: caps.video, canProcessAudio: caps.audio,
        devices, micId, camId, setMicDevice, setCamDevice, network,
        blurOn: blur !== "off", toggleBlur,
        startPreview, stopPreview, previewOn,
        elapsed,
        remaining, hardEndsAt, opensAt, startsAt,
        classStartsAt, durationMinutes, intoClass,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
