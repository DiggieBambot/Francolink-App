"use client";
import { useState, useEffect } from "react";
import { Bell, BellOff, Clock } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { createClient } from "@/lib/supabase/client";

export function NotificationSettings() {
  const { isSubscribed, isLoading, subscribe, unsubscribe, updatePreferences } = usePushNotifications();
  const [time, setTime] = useState("09:00");
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [notifyReminders, setNotifyReminders] = useState(true);
  const [notifyStreak, setNotifyStreak] = useState(true);
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<"" | "sending" | "sent" | "failed">("");
  const [testDetail, setTestDetail] = useState<string>("");

  const sendTest = async () => {
    setTestStatus("sending");
    setTestDetail("");
    try {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test from FrancoLink",
          body: "If you see this, push is working ✓",
          url: "/dashboard",
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setTestStatus("sent");
        const age = data.subscription_updated_at
          ? humanAgo(new Date(data.subscription_updated_at))
          : "";
        const where = data.gateway_label ? `${data.gateway_label}` : "your device";
        setTestDetail(`Sent to ${where}${age ? ` · subscribed ${age}` : ""}. If it doesn't show, check that device's notification settings and Focus / Do Not Disturb.`);
      } else if (!res.ok) {
        setTestStatus("failed");
        setTestDetail(data?.error || `Server error (${res.status})`);
      } else if (data.reason === "no_subscription") {
        setTestStatus("failed");
        setTestDetail("No subscription yet on this account. Tap Enable above on the device you want to receive notifications.");
      } else if (data.reason === "subscription_expired") {
        setTestStatus("failed");
        setTestDetail("Subscription expired. Disable and re-enable on the receiving device.");
      } else {
        setTestStatus("failed");
        setTestDetail("Unexpected response from server.");
      }
    } catch (e: any) {
      setTestStatus("failed");
      setTestDetail(e?.message || "Network error");
    }
    setTimeout(() => { setTestStatus(""); setTestDetail(""); }, 10000);
  };

  const humanAgo = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m} min ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  useEffect(() => {
    const loadPrefs = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setTime(data.notification_time?.slice(0, 5) || "09:00");
        setNotifyMessages(data.notify_messages ?? true);
        setNotifyReminders(data.notify_reminders ?? true);
        setNotifyStreak(data.notify_streak ?? true);
      }
    };
    loadPrefs();
  }, [isSubscribed]);

  const handleSave = async () => {
    await updatePreferences({
      notification_time: time,
      notify_messages: notifyMessages,
      notify_reminders: notifyReminders,
      notify_streak: notifyStreak,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Push Notifications</h3>
            <p className="text-sm text-gray-500">
              {isSubscribed ? "Notifications enabled" : "Notifications disabled"}
            </p>
          </div>
        </div>
        <button
          onClick={() => isSubscribed ? unsubscribe() : subscribe(time)}
          disabled={isLoading}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            isSubscribed
              ? "bg-red-50 text-red-600 hover:bg-red-100"
              : "bg-primary text-white hover:bg-primary-800"
          }`}
        >
          {isLoading ? "..." : isSubscribed ? "Disable" : "Enable"}
        </button>
      </div>

      {isSubscribed && (
        <>
          {/* Preferred Time */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Clock className="w-4 h-4" />
              Daily reminder time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Toggle options */}
          <div className="space-y-3">
            {[
              { label: "Messages from tutor", desc: "Get notified when your tutor sends a message", value: notifyMessages, setter: setNotifyMessages },
              { label: "Daily lesson reminder", desc: "Reminder at your preferred time", value: notifyReminders, setter: setNotifyReminders },
              { label: "Streak alerts", desc: "Don't let your streak break", value: notifyStreak, setter: setNotifyStreak },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <button
                  onClick={() => item.setter(!item.value)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${item.value ? "bg-primary" : "bg-gray-200"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${item.value ? "translate-x-5" : ""}`} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-800 transition-all"
          >
            {saved ? "✓ Saved!" : "Save Preferences"}
          </button>

          <button
            onClick={sendTest}
            disabled={testStatus === "sending"}
            className="w-full border border-gray-200 text-gray-700 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 transition-all disabled:opacity-60"
          >
            {testStatus === "sending"
              ? "Sending test…"
              : testStatus === "sent"
              ? "✓ Test sent"
              : testStatus === "failed"
              ? "✗ Test failed"
              : "Send test notification"}
          </button>
          {testDetail && (
            <p className={`text-xs ${testStatus === "failed" ? "text-red-600" : "text-gray-600"} leading-snug`}>
              {testDetail}
            </p>
          )}
        </>
      )}
    </div>
  );
}
