"use client";
import { useState, useEffect } from "react";
import { Bell, BellOff, X } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export function PushPrompt() {
  const { permission, isSubscribed, isLoading, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show prompt after 3 seconds if not subscribed and not dismissed
    const timer = setTimeout(() => {
      if (permission === "default" && !isSubscribed) {
        setShow(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [permission, isSubscribed]);

  if (!show || dismissed || isSubscribed || permission === "denied") return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 lg:left-auto lg:right-6 lg:w-96">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5">
        <button
          onClick={() => { setDismissed(true); setShow(false); }}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>

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
                onClick={() => subscribe()}
                disabled={isLoading}
                className="flex-1 bg-primary text-white py-2 px-4 rounded-xl text-sm font-bold hover:bg-primary-800 transition-all disabled:opacity-50"
              >
                {isLoading ? "Enabling..." : "Enable Notifications"}
              </button>
              <button
                onClick={() => { setDismissed(true); setShow(false); }}
                className="px-3 py-2 text-sm text-gray-400 hover:text-gray-600"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
