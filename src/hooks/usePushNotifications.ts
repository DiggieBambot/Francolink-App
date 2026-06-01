"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export type SubscribeReason =
  | "no_serviceworker"
  | "no_pushmanager"
  | "no_vapid_key"
  | "permission_denied"
  | "permission_default"
  | "subscribe_failed"
  | "no_auth_user"
  | "upsert_failed"
  | "unexpected";

export type SubscribeResult =
  | { ok: true }
  | { ok: false; reason: SubscribeReason; detail: string };

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    if (!("serviceWorker" in navigator)) return;
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    setIsSubscribed(!!sub);
  };

  const subscribe = async (notificationTime = "09:00"): Promise<SubscribeResult> => {
    setIsLoading(true);
    let step = "init";
    try {
      if (!("serviceWorker" in navigator)) {
        return { ok: false, reason: "no_serviceworker", detail: "This browser does not support service workers." };
      }
      if (!("PushManager" in window)) {
        return { ok: false, reason: "no_pushmanager", detail: "This browser does not support web push. On iPhone, you must Add to Home Screen first and open the app from there (requires iOS 16.4 or later)." };
      }
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        return { ok: false, reason: "no_vapid_key", detail: "App is missing its push key." };
      }

      step = "register-sw";
      const reg = await navigator.serviceWorker.register("/sw.js");
      step = "sw-ready";
      await navigator.serviceWorker.ready;

      step = "permission";
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm === "denied") {
        return { ok: false, reason: "permission_denied", detail: "You blocked notifications. Re-enable them in your browser/OS notification settings for this site." };
      }
      if (perm !== "granted") {
        return { ok: false, reason: "permission_default", detail: "You dismissed the notification prompt without choosing. Tap Enable again and tap Allow when iOS asks." };
      }

      step = "subscribe";
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        try {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
          });
        } catch (subErr: any) {
          return {
            ok: false,
            reason: "subscribe_failed",
            detail: `${subErr?.name || "Error"}: ${subErr?.message || "Browser rejected the subscription."}`,
          };
        }
      }

      step = "auth-user";
      const supabase = createClient();
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) {
        return { ok: false, reason: "no_auth_user", detail: "Not signed in (try logging out and back in)." };
      }

      step = "upsert";
      const { error: upErr } = await supabase
        .from("push_subscriptions")
        .upsert({
          user_id: user.id,
          subscription: sub.toJSON(),
          notification_time: notificationTime,
          notify_messages: true,
          notify_reminders: true,
          notify_streak: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      if (upErr) {
        return { ok: false, reason: "upsert_failed", detail: `Database error: ${upErr.message}` };
      }

      setIsSubscribed(true);
      return { ok: true };
    } catch (err: any) {
      return {
        ok: false,
        reason: "unexpected",
        detail: `${err?.name || "Error"} at "${step}": ${err?.message || String(err)}`,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("push_subscriptions").delete().eq("user_id", user.id);
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error("Unsubscribe error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (prefs: {
    notification_time?: string;
    notify_messages?: boolean;
    notify_reminders?: boolean;
    notify_streak?: boolean;
  }) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("push_subscriptions")
      .update({ ...prefs, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
  };

  return { permission, isSubscribed, isLoading, subscribe, unsubscribe, updatePreferences };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
