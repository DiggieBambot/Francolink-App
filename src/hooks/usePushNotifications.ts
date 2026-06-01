"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

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

  const subscribe = async (notificationTime = "09:00") => {
    setIsLoading(true);
    let step = "init";
    try {
      if (!("serviceWorker" in navigator)) {
        console.error("[push] no service worker support");
        return false;
      }
      if (!("PushManager" in window)) {
        console.error("[push] no PushManager (probably iOS Safari without PWA install)");
        return false;
      }
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.error("[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY missing on client");
        return false;
      }

      step = "register-sw";
      const reg = await navigator.serviceWorker.register("/sw.js");
      step = "sw-ready";
      await navigator.serviceWorker.ready;

      step = "permission";
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        console.warn(`[push] permission=${perm}`);
        return false;
      }

      step = "subscribe";
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      }

      step = "auth-user";
      const supabase = createClient();
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) {
        console.error("[push] no auth user:", userErr?.message);
        return false;
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
        console.error("[push] upsert failed:", upErr.message, upErr);
        return false;
      }

      setIsSubscribed(true);
      return true;
    } catch (err: any) {
      console.error(`[push] failed at step "${step}":`, err?.name, err?.message, err);
      return false;
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
