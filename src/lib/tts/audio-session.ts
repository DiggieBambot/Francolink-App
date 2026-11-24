"use client";

// Coordination between the microphone and Léon's voice.
//
// On a phone, opening the mic is not free for playback. iOS switches its
// audio session to "play-and-record": output moves to voice processing (echo
// cancellation), which is much quieter, and switching category back and forth
// briefly drops the output. Android Chrome does much the same with its
// "communication" mode. Anything that starts playing during that switch loses
// its first syllables and comes out at the wrong volume. Léon's "Mm-hm" used
// to start the instant the student's turn ended, while the mic was still
// closing, which is exactly that.
//
// So the recorder closes the mic the moment a turn ends and reports it here,
// and playback waits for the route to settle before starting a clip.
//
// (navigator.audioSession.type is deliberately left alone: forcing
// "playback" would stick for the rest of the app and can get in the way of
// the live lesson room's own mic capture.)

/** How long the output takes to settle after the mic closes. */
const SETTLE_MS = 300;

let micOpen = false;
let micClosedAt = 0;

/** Call right before getUserMedia. */
export function micOpening() {
  micOpen = true;
}

/** Call as soon as the mic tracks are stopped (or capture failed). */
export function micClosed() {
  if (!micOpen) return;
  micOpen = false;
  micClosedAt = performance.now();
}

/** Resolves once playback can start without landing in a route switch. */
export async function playbackRouteReady(): Promise<void> {
  if (micOpen) return; // Talking over the student (rare): don't stall.
  const wait = micClosedAt + SETTLE_MS - performance.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}
