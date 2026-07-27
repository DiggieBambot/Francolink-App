"use client";
import { useState, useEffect } from "react";
import { Bell, X, AlertCircle, CheckCircle } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export function PushPrompt({ eligible = false }: { eligible?: boolean }) {
  const { permission, isSubscribed, isLoading, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);
  const [result, setResult] = useState<"success" | "denied" | "error" | null>(null);
  const [errorDetail, setErrorDetail] = useState<string>("");

  // Check if VAPID key is configured — if not, don't show the prompt at all
  const vapidConfigured = !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  // Only ask AFTER a meaningful action — `eligible` is true once the student has
  // earned XP (completed a lesson/game/placement). Never prompt cold on load;
  // an unprompted permission request tanks grant rates and iOS rejects it.
  useEffect(() => {
    if (!vapidConfigured || !eligible) return;
    const timer = setTimeout(() => {
      if (permission === "default" && !isSubscribed) {
        setShow(true);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [permission, isSubscribed, vapidConfigured, eligible]);

  // Auto-hide success after 3s
  useEffect(() => {
    if (result === "success") {
      const t = setTimeout(() => {
        setShow(false);
        setDismissed(true);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [result]);

  if (!show || dismissed || isSubscribed || permission === "denied") return null;
  if (!vapidConfigured) return null;

  const handleSubscribe = async () => {
    const r = await subscribe();
    if (r.ok) {
      setResult("success");
      setErrorDetail("");
      return;
    }
    if (r.reason === "permission_denied" || Notification.permission === "denied") {
      setResult("denied");
      setErrorDetail("");
    } else {
      setResult("error");
      setErrorDetail(r.detail);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShow(false);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 lg:left-auto lg:right-6 lg:w-96">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Success state */}
        {result === "success" && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Notifications enabled!</p>
              <p className="text-sm text-gray-500">We'll remind you about your daily lessons.</p>
            </div>
          </div>
        )}

        {/* Denied state */}
        {result === "denied" && (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Notifications blocked</p>
              <p className="text-sm text-gray-500 mt-0.5">
                To enable them, go to your browser settings and allow notifications for this site.
              </p>
              <button onClick={handleDismiss} className="text-sm text-primary font-medium mt-2">
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Error state */}
        {result === "error" && (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Couldn&apos;t enable notifications</p>
              <p className="text-sm text-gray-700 mt-0.5 leading-snug">
                {errorDetail || "Something went wrong. Please try again later."}
              </p>
              <button onClick={handleDismiss} className="text-sm text-primary font-medium mt-2">
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Default prompt */}
        {!result && (
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Bell className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">Stay on track!</h3>
              <p className="text-sm text-gray-500 mb-4">
                Get reminders for your daily lessons and streak alerts.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleSubscribe}
                  disabled={isLoading}
                  className="flex-1 bg-primary text-white py-2 px-4 rounded-xl text-sm font-bold hover:bg-primary-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enabling...
                    </>
                  ) : (
                    "Enable Notifications"
                  )}
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-2 text-sm text-gray-400 hover:text-gray-600"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}