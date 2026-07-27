# Integration hooks (push · analytics · connections)

Reusable, feature-agnostic interfaces that new modules (homework, games,
streaks) plug into so they get notifications and analytics without rework.
These back PRD §2 (push), §4 (homework hooks), and §5 (streak/games hooks).

## 1. Push a message to a user

```ts
import { sendPush } from "@/lib/notifications/push";

await sendPush(userId, {
  title: "🔥 3-day streak",
  body: "Keep it alive — do a quick lesson today!",
  deeplink: "/dashboard", // path opened on tap; defaults to "/"
  tag: "daily-reminder",  // optional collapse key
});
// → true if dispatched, false if no subscription / push unconfigured / dead sub.
```

- Server-only. Fire-and-forget: never throws. Dead subscriptions (HTTP 404/410)
  are deleted automatically.
- Requires env: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, optional
  `VAPID_EMAIL`.
- Need an in-app inbox row **and** a push? Use `notifyUser()` in
  `@/lib/notifications/create` — it writes a `notifications` row and calls
  `sendPush` for you.

## 2. Emit an analytics event

Client (browser):

```ts
import { trackEvent } from "@/lib/analytics/client";
trackEvent("homework_submitted", { metadata: { lessonId } });
// once-per-browser variant: trackEvent("dashboard_viewed", { once: "dashboard_viewed" })
```

Server (API route / server action):

```ts
import { logActivity } from "@/lib/analytics/activity";
await logActivity(userId, "homework_submitted", { metadata: { lessonId } });
```

- Client events POST to `/api/activity/event` and are rejected unless the kind is
  in `CLIENT_EMITTABLE_KINDS` (see `@/lib/analytics/activity`).
- The activation funnel + first-session drop-off in `/admin/growth` read these
  event kinds. `homework_submitted` is already defined and wired into the funnel
  query — it just needs the homework module to emit it.

## 3. Query tutor ↔ student connections

`tutor_students` (status `active`) is the source of truth; a student can have
many teachers. `referred_by_tutor_id` on `users` is **first-touch commission
attribution only** — do not use it for membership.

```ts
import { getConnectionsFor } from "@/lib/lessons/lesson-space";

const students = await getConnectionsFor(tutorId, "tutor");  // this tutor's students
const teachers = await getConnectionsFor(studentId, "student"); // this student's teachers
// → [{ partnerId, partnerName, partnerEmail }]
```

## Scheduled reminders

`/api/cron/push-reminders` runs hourly (GitHub Actions →
`.github/workflows/push-reminders-cron.yml`, authed with `CRON_SECRET`). Each run
sends to subscribers whose `notification_time` hour matches their current local
hour, honoring `notify_streak` / `notify_reminders`. Test with `?dry=1`.
