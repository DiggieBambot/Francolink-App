"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Dispatch this anywhere (e.g. when a game or lesson opens) to surface the install prompt at a good moment. */
export const PWA_PROMPT_EVENT = "francolink:pwa-moment";

export function triggerPWAInstallMoment() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PWA_PROMPT_EVENT));
  }
}

/**
 * Phones + tablets (incl. iPad, which reports a desktop Safari UA since iPadOS 13).
 * Desktop browsers never see the prompt.
 */
function isMobileOrTablet(): boolean {
  if (typeof window === "undefined") return false;

  const ua = navigator.userAgent;
  const isIPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  const uaMobile = /Android|iPad|iPhone|iPod|Mobile|Tablet|Silk|Kindle|PlayBook|BB10/i.test(ua);

  // UA-CH is authoritative on Chromium; fall back to UA sniffing elsewhere.
  const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData;
  if (uaData?.mobile === true) return true;

  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const smallViewport = window.matchMedia("(max-width: 1024px)").matches;

  return isIPadOS || uaMobile || (coarsePointer && smallViewport);
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);
  // Device class never changes for the life of the page — derive it once.
  const [isIOS] = useState(
    () =>
      typeof navigator !== "undefined" &&
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !("MSStream" in window),
  );

  useEffect(() => {
    // Phones and tablets only — installing is meaningless on desktop here.
    if (!isMobileOrTablet()) return;

    // Already installed
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    // Dismissed recently
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    // Only once per session, so it can't interrupt twice in one sitting.
    if (sessionStorage.getItem("pwa-install-shown")) return;

    // The student area mounts a dedicated iOS banner (IosInstallPrompt). If the
    // user already dealt with that one, don't ask again from here.
    if (localStorage.getItem("fl_ios_install_dismissed")) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    const reveal = () => {
      if (sessionStorage.getItem("pwa-install-shown")) return;
      sessionStorage.setItem("pwa-install-shown", "1");
      setShowPrompt(true);
    };

    // Engagement moment: a game/lesson opened. Small delay so it lands after the screen renders.
    const momentHandler = () => timers.push(setTimeout(reveal, 1500));
    window.addEventListener(PWA_PROMPT_EVENT, momentHandler);

    // Fallback: user has stuck around a while without hitting an explicit moment.
    const FALLBACK_MS = 90_000;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      timers.push(setTimeout(reveal, FALLBACK_MS));
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS has no beforeinstallprompt — arm the same fallback directly.
    if (isIOS) {
      timers.push(setTimeout(reveal, FALLBACK_MS));
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener(PWA_PROMPT_EVENT, momentHandler);
      timers.forEach(clearTimeout);
    };
  }, [isIOS]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else {
      // No native install sheet available (iOS Safari always, and any browser
      // that doesn't fire beforeinstallprompt). Show manual directions instead
      // of leaving the button doing nothing.
      setShowManualGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowManualGuide(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-[60] backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Prompt */}
      <div className="fixed bottom-0 left-0 right-0 z-[61] p-4 animate-slide-up">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
          {showManualGuide ? (
            // Manual "add to home screen" steps, for browsers with no native sheet
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Add FrancoLink to your Home Screen</h3>
                <button onClick={handleDismiss} className="p-1 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="space-y-4">
                {(isIOS
                  ? [
                      <>
                        Tap the <strong>Share</strong> button{" "}
                        <span className="inline-block">⬆️</span> at the bottom of Safari
                      </>,
                      <>
                        Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>
                      </>,
                      <>
                        Tap <strong>&ldquo;Add&rdquo;</strong> to install FrancoLink
                      </>,
                    ]
                  : [
                      <>
                        Open your browser&apos;s menu <strong>⋮</strong> (top right)
                      </>,
                      <>
                        Tap <strong>&ldquo;Add to Home screen&rdquo;</strong> or{" "}
                        <strong>&ldquo;Install app&rdquo;</strong>
                      </>,
                      <>
                        Confirm with <strong>&ldquo;Add&rdquo;</strong> or{" "}
                        <strong>&ldquo;Install&rdquo;</strong>
                      </>,
                    ]
                ).map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm font-bold text-primary">{i + 1}</span>
                    </div>
                    <p className="text-sm text-gray-700">{step}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={handleDismiss}
                className="w-full mt-5 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors text-sm"
              >
                Got it
              </button>
            </div>
          ) : (
            // Install Prompt
            <div className="p-6">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-sm">
                    <span className="text-white font-extrabold text-lg">FL</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Make the most of FrancoLink
                    </h3>
                    <p className="text-sm text-gray-500">Learn languages on the go</p>
                  </div>
                </div>
                <button onClick={handleDismiss} className="p-1 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <p className="mt-4 mb-5 text-sm text-gray-600">
                Add it to your home screen for a full app experience — your games,
                homework and learning resources, always one tap away.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleDismiss}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors text-sm"
                >
                  Not now
                </button>
                <button
                  onClick={handleInstall}
                  className="flex-1 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Add to Home Screen
                </button>
              </div>

              <p className="mt-3 text-center text-xs text-gray-400">
                Free, takes 2 seconds, no app store needed
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
