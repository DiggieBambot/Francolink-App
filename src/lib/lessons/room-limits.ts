// Shared room limits. Deliberately framework-neutral (no "use client"): the
// room's server component and the client hook both import from here, and a
// const imported out of a client module can resolve to a client reference
// proxy on the server rather than the value itself.

/**
 * Maximum students in one live room. The tutor sits on top of this, so a full
 * group classroom is 6 people on the channel.
 *
 * Mirrored by the capacity trigger in
 * supabase/migrations/20260806_lesson_room_participants.sql — change both together.
 */
export const MAX_GROUP_LEARNERS = 5;
