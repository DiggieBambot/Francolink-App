"use client";

// iOS-only "Add to Home Screen" nudge. On iOS, Web Push (16.4+) only works when
// the PWA is installed to the home screen and opened from there — Safari tabs
// can't subscribe. This banner explains the one-time install step. It shows only
// on iOS Safari that is NOT already running standalone, and is dismissible.

import { useEffect, useState } from "react";
import { Share, X, Plus } from "lucide-react";

const DISMISS_KEY = "fl_ios_install_dismissed";

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ reports as Mac; detect touch Macs too.
  const iPadOS = navigator.platform === "MacIntel" && (navigator as unknown as { maxTouchPoints: number }).maxTouchPoints > 1;
  return iOS || iPadOS;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function IosInstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch { /* ignore */ }
    if (isIos() && !isStandalone()) {
      const t = setTimeout(() => setShow(true), 2500);
      return () => clearTimeout(t);
    }
  }, []);

  if (!show) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ }
    setShow(false);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 lg:left-auto lg:right-6 lg:w-96">
      <div className="relative rounded-2xl border border-gray-100 bg-white p-5 shadow-xl">
        <button onClick={dismiss} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600" aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="mb-1 font-bold text-gray-900">Add FrancoLink to your Home Screen</h3>
            <p className="mb-3 text-sm text-gray-500">
              Install the app to get lesson &amp; streak reminders on iPhone. It only takes a second.
            </p>
            <ol className="space-y-1.5 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <span className="font-semibold text-primary">1.</span>
                Tap the Share icon
                <Share className="h-4 w-4 text-primary" />
                in Safari&apos;s toolbar
              </li>
              <li className="flex items-center gap-2">
                <span className="font-semibold text-primary">2.</span>
                Choose <span className="font-semibold">Add to Home Screen</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="font-semibold text-primary">3.</span>
                Open FrancoLink from your home screen
              </li>
            </ol>
            <button onClick={dismiss} className="mt-3 text-sm font-medium text-primary">
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
