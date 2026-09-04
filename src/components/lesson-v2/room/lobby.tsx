"use client";

// The lobby: the minute before class.
//
// Until now there wasn't one. You opened a booked lesson and landed straight
// in the live room with your camera already negotiating — which means the
// first time anyone discovers their microphone is the dock's and not their
// headset's is thirty seconds into a paid lesson, with a tutor watching. The
// two commonest ways a lesson goes wrong are "you're on mute" and "I can't
// hear you", and both are decided before anyone joins.
//
// So: see yourself, pick your devices, WATCH THE METER MOVE, and join when
// you're ready. The meter is the part that matters — it is the only thing on
// this screen that proves a microphone is actually picking you up, and it
// answers the question before it costs lesson time. Everything else here is
// in service of that.
//
// It also gives the schedule somewhere to live. A class that opens ten minutes
// early used to show an empty room; now it shows a countdown and a Join button
// that turns on by itself.

import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff, Video, VideoOff, Loader2, AlertCircle } from "lucide-react";
import { useRoomVideo } from "./video-context";
import { EffectsButton } from "./video-views";
import { cn } from "@/lib/utils";

interface Devices {
  mics: MediaDeviceInfo[];
  cams: MediaDeviceInfo[];
}

/** Live input level, 0..1, sampled from the preview stream. */
function useMicLevel(stream: MediaStream | null, enabled: boolean): number {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    // Nothing to measure. The meter is rendered from `enabled` anyway, so it
    // is already dark — zeroing state here would only cost a second render.
    if (!stream || !enabled) return;
    const track = stream.getAudioTracks()[0];
    if (!track) return;

    // Safari still ships webkitAudioContext.
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;

    const ctx = new Ctor();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const buf = new Uint8Array(analyser.frequencyBinCount);
    let raf = 0;

    const tick = () => {
      analyser.getByteTimeDomainData(buf);
      // RMS around the 128 midpoint, which is silence for 8-bit PCM.
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buf.length);
      // Speech sits well below full scale, so scale it up to make the meter
      // move like a person expects rather than twitching near zero.
      setLevel((prev) => {
        const next = Math.min(1, rms * 3.2);
        // Fast attack, slow release: a meter that drops instantly reads as
        // broken between syllables.
        return next > prev ? next : prev * 0.82 + next * 0.18;
      });
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      source.disconnect();
      void ctx.close();
      setLevel(0);
    };
  }, [stream, enabled]);
  return level;
}

function untilLabel(seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function Lobby() {
  const {
    phase, join, opensAt, startsAt, error,
    startPreview, previewOn, local,
  } = useRoomVideo();

  const [devices, setDevices] = useState<Devices>({ mics: [], cams: [] });
  const [micId, setMicId] = useState<string>("");
  const [camId, setCamId] = useState<string>("");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [denied, setDenied] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Daily hands us the local participant; the preview stream is DERIVED from
  // its tracks rather than mirrored into state. Switching camera or toggling
  // blur replaces the track, and a memo keyed on the tracks themselves picks
  // that up without a second render or a stale copy to keep in step.
  const videoTrack =
    local?.tracks?.video?.state === "playable"
      ? local.tracks.video.persistentTrack ?? null
      : null;

  /**
   * Why there is no picture, in Daily's own words.
   *
   * "None found" plus "try another camera above" was the app guessing, and
   * guessing wrong in two directions at once: it told someone to pick from an
   * empty list, and it blamed the device when the usual cause is a permission
   * the browser is quietly withholding. Daily already knows which of the three
   * it is — enumerateDevices cannot tell you, because Chrome hides cameras
   * entirely when permission is refused, which is exactly why the list looked
   * empty.
   */
  const camBlocked = local?.tracks?.video?.blocked;
  const camReason = !camBlocked
    ? null
    : camBlocked.byPermissions
      ? "Your browser is blocking the camera. Click the camera icon in the address bar, allow it, then reload."
      : camBlocked.byDeviceInUse
        ? "Another app is using your camera — close Zoom, Photo Booth or FaceTime and reload."
        : camBlocked.byDeviceMissing
          ? "No camera is connected to this computer."
          : "Your camera could not be started.";
  const audioTrack =
    local?.tracks?.audio?.state === "playable"
      ? local.tracks.audio.persistentTrack ?? null
      : null;
  const stream = useMemo(() => {
    const tracks = [videoTrack, audioTrack].filter(
      (t): t is MediaStreamTrack => t !== null
    );
    return tracks.length > 0 ? new MediaStream(tracks) : null;
  }, [videoTrack, audioTrack]);

  const level = useMicLevel(stream, micOn);

  // Open the preview, and re-open it when a device is switched.
  //
  // Through DAILY, not getUserMedia. That is what makes the blur toggle below
  // mean anything: the processor runs on the pre-join camera, so the very
  // first frame anyone else receives is already blurred. A lobby on its own
  // getUserMedia stream could only fake it — and blur you can switch on after
  // joining is blur applied after they have already seen the room.
  //
  // It also removes a race the old version papered over: two media stacks both
  // holding the camera, one of which had to let go at exactly the right moment.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await startPreview({ audioDeviceId: micId, videoDeviceId: camId });
        if (cancelled) return;
        setDenied(null);

        // Labels are empty until permission is granted, so enumerate AFTER.
        const all = await navigator.mediaDevices.enumerateDevices();
        setDevices({
          mics: all.filter((d) => d.kind === "audioinput"),
          cams: all.filter((d) => d.kind === "videoinput"),
        });
      } catch (e) {
        if (cancelled) return;
        const name = (e as DOMException)?.name || "";
        setDenied(
          name === "NotAllowedError"
            ? "Your browser blocked the camera and microphone. Allow them in the address bar, then reload."
            : name === "NotFoundError"
              ? "No camera or microphone found. Plug one in and reload."
              : name === "NotReadableError"
                ? "Another app is using your camera. Close it, then reload."
                : "Couldn't open your camera and microphone."
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [micId, camId, startPreview]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  useEffect(() => {
    stream?.getAudioTracks().forEach((t) => (t.enabled = micOn));
  }, [stream, micOn]);
  useEffect(() => {
    stream?.getVideoTracks().forEach((t) => (t.enabled = camOn));
  }, [stream, camOn]);

  // Countdown to the moment joining is allowed.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const opensIn = opensAt
    ? Math.max(0, Math.round((new Date(opensAt).getTime() - now) / 1000))
    : 0;

  // "scheduled" means the server has already refused a token for this room —
  // there is no class on. Joining cannot succeed, so the button must not offer
  // it.
  //
  // This used to be `phase === "scheduled" && opensIn > 0`, which unlocked
  // the button in the one case it most needed to stay shut: a room with NO
  // upcoming booking at all, where opensAt is null and opensIn is therefore
  // zero. The result was a live-looking "Join the class" that called the API,
  // got a 403, and changed nothing on screen — a button that does nothing,
  // sitting under a panel that says "No class booked yet".
  const locked = phase === "scheduled";
  const waiting = locked && opensIn > 0;
  const busy = phase === "joining";

  return (
    <div className="flex h-full w-full items-center justify-center overflow-y-auto bg-slate-900 p-6">
      <div className="grid w-full max-w-3xl gap-6 md:grid-cols-[1.15fr_1fr] md:items-center">
        {/* ------------------------------------------------------- PREVIEW */}
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-950 ring-1 ring-slate-800">
          {/* Mirrored: everyone expects their own preview to behave like a
              mirror. The far side is never mirrored. */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn("h-full w-full -scale-x-100 object-cover", !camOn && "hidden")}
          />
          {!camOn ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-600">
              <VideoOff className="h-8 w-8" />
              <span className="text-xs font-semibold">Camera off</span>
            </div>
          ) : !stream ? (
            // getUserMedia does not reject while a permission prompt is open —
            // it just never settles. Without this the lobby is a black
            // rectangle for as long as someone leaves the prompt untouched,
            // which reads as broken rather than as waiting.
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-xs font-semibold">
                {denied ? "Camera unavailable" : "Allow camera and microphone to see yourself"}
              </span>
            </div>
          ) : null}

          <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/70 to-transparent p-3">
            <button
              type="button"
              onClick={() => setMicOn((v) => !v)}
              aria-pressed={!micOn}
              title={micOn ? "Mute" : "Unmute"}
              className={cn(
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
                micOn ? "bg-slate-700/90 text-white hover:bg-slate-600" : "bg-accent text-white"
              )}
            >
              {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setCamOn((v) => !v)}
              aria-pressed={!camOn}
              title={camOn ? "Turn camera off" : "Turn camera on"}
              className={cn(
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
                camOn ? "bg-slate-700/90 text-white hover:bg-slate-600" : "bg-accent text-white"
              )}
            >
              {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </button>

            {/* Set BEFORE anyone can see you — that is the whole point. The
                in-call menu is the same one, but by then your room has already
                been on someone's screen. */}
            <EffectsButton box="h-9 w-9" icon="h-4 w-4" />

            {/* The meter. Twelve segments rather than a smooth bar: movement
                you can count is more convincing than a bar that glides, and
                "is it working?" is exactly a question about movement. */}
            <div className="flex flex-1 items-center gap-[3px]" aria-hidden>
              {Array.from({ length: 12 }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-3 flex-1 rounded-sm transition-colors duration-75",
                    micOn && level * 12 > i ? "bg-primary-400" : "bg-white/15"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------- CONTROLS */}
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-white">
            {waiting
              ? "Your class hasn't started yet"
              : locked
                ? "No class booked yet"
                : "Ready to join?"}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {waiting && startsAt
              ? `Starts at ${new Date(startsAt).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })} — you can join in ${untilLabel(opensIn)}.`
              : locked
                ? "This room has no upcoming class. Book one and the call turns on ten minutes before it starts."
                : micOn
                  ? "Say something and check the bars move before you go in."
                  : "Your microphone is muted — unmute it to test your sound."}
          </p>

          {denied ? (
            <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-accent-light/10 p-2.5 text-xs text-accent">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {denied}
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              <DevicePicker
                label="Microphone"
                items={devices.mics}
                value={micId}
                onChange={setMicId}
              />
              <DevicePicker
                label="Camera"
                items={devices.cams}
                value={camId}
                onChange={setCamId}
              />
              {/* A black rectangle is ambiguous: camera off, wrong device,
                  permission withheld and device-in-use all look identical.
                  Say which, and only offer "pick another" when there is in
                  fact another to pick. */}
              {previewOn && camOn && !videoTrack ? (
                <p className="flex items-start gap-1.5 text-xs text-secondary-400">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    {camReason ??
                      (devices.cams.length > 1
                        ? "No picture yet — try another camera above."
                        : "No picture from your camera yet.")}
                    {" "}
                    You can still join with sound only.
                  </span>
                </p>
              ) : null}
            </div>
          )}

          {error ? (
            <p className="mt-3 flex items-start gap-1.5 text-xs text-accent">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {error}
            </p>
          ) : null}

          <button
            type="button"
            disabled={locked || busy}
            onClick={() => {
              // No handover: Daily already holds the camera, with these
              // devices and this blur setting. Joining publishes what you have
              // been looking at.
              void join({ audioDeviceId: micId, videoDeviceId: camId });
            }}
            className={cn(
              "mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition",
              locked || busy
                ? "cursor-not-allowed bg-slate-700 text-slate-400"
                : "bg-primary-500 text-white shadow-lg hover:bg-primary-600"
            )}
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Connecting…
              </>
            ) : waiting ? (
              `Opens in ${untilLabel(opensIn)}`
            ) : locked ? (
              "No class booked"
            ) : (
              <>
                <Video className="h-4 w-4" />
                {videoTrack || !camOn ? "Join the class" : "Join without video"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function DevicePicker({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: MediaDeviceInfo[];
  value: string;
  onChange: (id: string) => void;
}) {
  // Always shown, even for a single device.
  //
  // This used to hide itself below two options, on the reasoning that one
  // device is not a choice. But a person looking at a black preview needs to
  // SEE which camera is selected before they can work out that it is the
  // wrong one, or that the browser has handed them a phone's continuity
  // camera that is not awake. An absent control reads as "no camera exists",
  // which is a different and much worse message.
  if (items.length === 0) {
    return (
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>
        <div className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-500">
          None found
        </div>
      </label>
    );
  }
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full truncate rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-primary-400"
      >
        <option value="">Default</option>
        {items.map((d) => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label || "Unnamed device"}
          </option>
        ))}
      </select>
    </label>
  );
}
