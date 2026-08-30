// src/app/(student)/notifications/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NotificationSettings } from "@/components/notifications/notification-settings";
import { NotificationInbox } from "@/components/notifications/notification-inbox";
import { CalendarSubscribe } from "@/components/calendar/calendar-subscribe";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-primary">
          Notifications
        </h1>
        <p className="text-gray-600 mt-1">
          Manage how and when FrancoLink reaches you
        </p>
      </div>

      <NotificationInbox />

      <NotificationSettings />

      <div className="mt-6">
        <CalendarSubscribe />
      </div>
    </div>
  );
}
