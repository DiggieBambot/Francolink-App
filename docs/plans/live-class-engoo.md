# Live class: schedule gating, time caps, shared material picker, Engoo-grade UI

## Where we are today (verified in code)

| Thing | Reality |
|---|---|
| Room identity | `getOrCreateLessonSpace(tutorId, studentId)` — ONE permanent `tutor_lesson_sessions` row per pair, `status='active'` forever. `bookings.room_session_id` points at that same shared row for every lesson they ever book. |
| Schedule link | None at runtime. `/room/[id]/page.tsx` gates on membership in `lesson_room_participants` only. A student can open the room any day, any hour, with no booking. |
| Duration | Nothing. `bookings.duration_minutes` (25\|50) is priced and billed but never enforced. Daily room TTL is a flat 4h (`ROOM_TTL_SECONDS`). The in-room timer counts **up** from call connect and does nothing at any threshold. |
| Closing | `cron/close-stale-rooms` sweeps `active` rooms after 8h; `cron/complete-bookings` settles bookings 2h after `ends_at`. Both are janitors, not a class clock. |
| Material picking | `LessonPicker` (local modal, no broadcast on pick — `loadLesson` sets state without `broadcastLessonChange`) and `LessonBrowser`, which is an **iframe of `/library?pick=1`** visible only to whoever opened it. |
| Class chrome | `RoomShell` header = material tabs + actions. Timer + "End class" are buried in the rail's peer row and in the mobile sheet. No countdown, no lesson title, no participant chips, no control bar. |

## Phase 1 — Bind the room to the scheduled class  ✅ DONE

**Decided:** the gate is on **video only**. Outside the window the room still opens — chat history, past material, homework — but there is no call and a banner shows the next class. A room no booking references (independent tutor's classroom, group link room, `student_id === tutor_id` sentinel) keeps today's behaviour exactly, video included.

1. Migration `2026xxxx_room_class_window.sql`
   - `bookings`: index on `(room_session_id, starts_at)`.
   - `tutor_lesson_sessions`: `current_booking_id uuid references bookings(id)`, `hard_ends_at timestamptz`.
2. `src/lib/lessons/class-window.ts` (new, server): `resolveClassWindow(sessionId, now)` →
   `{ kind: 'open' } | { kind: 'scheduled', booking, opensAt, startsAt, hardEndsAt } | { kind: 'closed', nextBooking }`.
   Window = `starts_at - OPEN_EARLY` … `hardEndsAt`. Picks confirmed/completed bookings only.
3. `/room/[id]/page.tsx` passes the window to `LessonRoom`. `closed` → the room renders normally with video replaced by a `<NextClassCard>` (next class time, live countdown, "Book a lesson"). No dashboard redirect.
4. `api/room/[sessionId]/video-token` refuses outside the window with `{ scheduled: true, opensAt }` — the same soft-answer shape it already uses for `unavailable`, so the panel explains rather than errors. **This is the real enforcement; the page is UX.**

## Phase 2 — Hard time cap  ✅ DONE

**Caps:** 25-min class → 30 min. 50-min class → 60 min. `CLASS_CAP_MINUTES = { 25: 30, 50: 60 }`.

- **Decided:** `hardEndsAt = booking.starts_at + cap` — scheduled start, not join time. A 10:00 25-min class ends at 10:30 for everyone, back-to-back slots can never collide, and the deadline exists before anyone joins. A late tutor eats their own delay.
- **Decided:** hard stop, no extension. The 25→30 / 50→60 padding is the grace.
- Written onto the session when the window is resolved, so both sides read one authoritative instant.
- **Daily token `exp` = hardEndsAt** in `meetingToken()`, and `ensureRoom` sets the room's `exp` to `hardEndsAt + 2min` instead of a flat 4h. The call dies server-side even if the browser lies about the clock.
- `video-context.tsx`: add `remaining` alongside `elapsed`, driven by `hardEndsAt` from the server. Emits `warning` at T-5:00 and T-1:00.
- Client at T-0: leave the call, mark the booking `completed`, POST `end-room`, show the post-class card (rate tutor / homework / book again).
- `cron/complete-bookings` also closes the room session when it settles the booking.

## Phase 3 — Shared material selection (kill the iframe)  ✅ DONE

- Delete `lesson-browser.tsx`. The catalogue becomes a real React panel fed by the existing `lessonList` prop plus a new `/api/lessons/catalogue` (categories, covers, level, duration) — same data `/library` renders, no iframe, no cross-origin postMessage.
- Selection becomes a **stage panel** (`StageKey: 'materials'`), not a modal, so it lives in the tab bar next to Call / Lesson / Board.
- **Both sides see it.** New broadcast events on the existing room channel: `materials:open`, `materials:filter`, `materials:hover`, `materials:pick`. Student's stage follows the tutor into the picker and sees the same grid and the same highlighted card — Engoo's behaviour.
- Fix the real bug: `loadLesson()` sets local state without `broadcastLessonChange`, so one picker path silently desyncs the two sides. Route every selection through one `applyLesson(id, title, {broadcast})`.
- Student-initiated picks are *proposals* ("Ana suggests: Ordering coffee — Open / Dismiss") unless the tutor has granted control.

## Phase 4 — Premium lesson UI

- Card grid → cover-led tiles with level ribbon, duration, tag row, hover preview of section titles; skeletons instead of layout jump; level filter chips + category rail; recently-used and "assigned to this student" rows at the top.
- Lesson renderer: proper type scale, generous measure, sectioned scroll-spy, exercise blocks with real states (answered / correct / tutor-highlighted), sticky section header, smooth scroll-sync instead of jump.

## Phase 5 — Engoo-style class template (`RoomShell`)

- **Top bar:** lesson title + level · participant chips with mic state · **countdown pill** (green → amber at 5 min → red at 1 min) · End class (destructive, confirm dialog) — promoted out of the rail, always visible, both roles.
- **Bottom control bar:** mic / cam / screenshare / materials / chat / leave — one row, mobile-safe, replaces the floating FAB.
- Pre-class lobby: device check, "class starts in 4:12", join enabled at `opensAt`.
- Post-class screen replaces the room at T-0 rather than dumping to the dashboard.
- Keep the existing grid contract: face and material simultaneously visible at every width.

## Order of work
1 → 2 (server + cron first, they're the correctness half) → 3 → 5 → 4.


---

## Palette (decided)

The class chrome uses the site's own tokens, never a one-off green:

| State | Token | Hex |
|---|---|---|
| Plenty of time | `bg-primary-50 / text-primary-600` | deep navy `#09477a` |
| 5 minutes left | `bg-secondary-50 / text-secondary-700` | warm orange `#92540e` on `#fef6e6` |
| 1 minute left | `bg-accent-light / text-accent` | red `#dd3333` |
| Join / primary action | `bg-primary-500` | `#0069c3` |

A green timer would be the only green in the room and reads as a bolted-on widget.
