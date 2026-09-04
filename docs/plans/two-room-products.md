# Two room products: the Classroom and the Study Space

## The idea

A FrancoLink lesson and an independent tutor sharing a worksheet are not the
same product, and we currently ship one room that tries to be both — and
apologises to the second one for not being the first.

Split them:

| | **Classroom** | **Study Space** |
|---|---|---|
| Who | Listed FrancoLink tutors | Any tutor account sharing material |
| Live video / audio | Yes | **No — and no apology for it** |
| Scheduled | Yes, bound to a paid booking | No |
| Timer / hard stop | Yes (25→30, 50→60) | No |
| Material, chat, board, highlights, homework, AI | Yes | Yes |
| Feel | Engoo, in our navy/amber | A quiet shared workspace |

## The boundary already exists — it just has no name

`approval_status = 'approved' AND is_public AND accepts_bookings` on
`tutor_public_profiles` is the definition of "a FrancoLink tutor". It is
already the gate in **two** places, written out longhand in both:

- `src/app/api/booking/create/route.ts:96-98` — who can be booked
- `src/app/api/room/[sessionId]/video-token/route.ts` — who gets video

So the product split needs no new concept and no new column. It needs that
predicate lifted into one function and asked one more time.

**Phase 0 — ✅ DONE.** `src/lib/tutors/listing.ts`: `isListedTutor(tutorId): Promise<boolean>`,
plus `listingFor(tutorId)` returning the row for callers that want the slug.
Replace both inlined copies. Nothing changes behaviourally; everything after
this depends on there being one answer to "is this a FrancoLink tutor?".

## Why this is worth doing (what's wrong today)

A non-listed tutor opens a room and gets the **full classroom** — video panel,
call controls, join button — and then a 403 whose copy reads:

> "Live video is for lessons with FrancoLink tutors. Apply to join and it turns on."

That is a room built around a thing you cannot have, telling you so. Every
independent tutor's every lesson starts with a rejection. And it costs them
real screen: a 360px rail and a 64px control bar given over to a call that
will never connect.

The fix is not to hide the video panel. It is to ship them a room whose shape
assumes no video, where the material is the whole point — because for them it
is.

## Phase 1 — `SpaceShell`: the Study Space  ✅ DONE

New `src/components/lesson-v2/room/space-shell.tsx`, sibling to `RoomShell`.
Same panels, different frame:

- **No** video rail, **no** control bar, **no** timer, **no** End class. There
  is no call to leave and no class to end.
- Material takes the full stage. The rail is chat + people + AI only, and it
  is collapsible, because at 1280px a worksheet wants the width.
- Header: material tabs, then Board / Invite / Materials. Ring and Send
  homework stay (both work without video).
- One upgrade card, in the People panel, stated once and positively:
  "Teach on FrancoLink — get live video, bookings and paid lessons." Not an
  error, not a modal, not on every entry.

`/room/[id]/page.tsx` picks the shell from `isListedTutor(session.tutor_id)`.
**One route, two shells** — deliberately. The room id is already baked into
booking `room_session_id`, calendar feeds, invite links and sent emails;
splitting the URL would break every one of them.

A tutor who gets approved later needs no migration: the predicate is evaluated
per visit, so their existing rooms become classrooms the moment they are
listed.

## Phase 2 — Classroom parity with Engoo  ✅ DONE

Already shipped (commits `be71923`, `a8a1181`, `7c3e4be`):
one control bar · shared material selection · countdown with a server-enforced
hard stop · screen sharing · post-class card · booking-bound schedule gate.

Still missing, in the order they matter:

1. ~~**Lobby.**~~ ✅ Enter before `starts_at` and you get a waiting room: camera and
   mic preview, device pickers, "starts in 4:12", Join enabled at `opensAt`.
   Today you land in the live room with your camera already negotiating.
2. ~~**Post-class flow.**~~ ✅ The finished card is a dead end. Engoo ends with:
   rate the lesson, tutor sends homework, "book your next lesson" with the
   tutor's next free slot. We have all three pieces already — `send-homework`,
   `bookings`, availability — and nothing joins them up.
3. ~~**Tutor annotation on the material.**~~ ✅ Highlights exist; drawing a circle
   round a conjugation table does not.
4. ~~**Raise hand / attention.**~~ ✅ One button, matters in group rooms.
5. ~~**Device trouble recovery.**~~ ✅ "Your tutor can't hear you" — a mic-level
   meter beats a person saying "can you hear me?" four times.

## Phase 3 — the theme pass

The classroom should read as Engoo-shaped and unmistakably ours: navy
`#092845`/`#0069c3`, amber `#f48c17`, red `#dd3333` for the destructive and
the urgent. Mostly done; what remains is the lobby and post-class screens,
which do not exist yet.

## Open questions

1. ~~How many tutors are on each side?~~ **Answered: the Study Space is the
   majority.** Built first accordingly.
2. **Does an independent tutor keep `Ring`?** It pushes a "Join class" alert.
   Without video that means "come to the space" — still useful, but the copy
   has to change.
3. **Group rooms.** `is_group` + `MAX_GROUP_LEARNERS` currently apply to both.
   Does a Study Space need a capacity at all?

## Order

0 → 1 → 2.1 → 2.2 → 3. Phase 0 is an hour and everything depends on it.
