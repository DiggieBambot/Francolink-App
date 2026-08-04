// The `notifications.type` value for a live-class invite.
//
// Lives in its own module so the client-side watcher can import it without
// pulling in live-invite.ts, which is server-only (service-role Supabase client).

export const LIVE_INVITE_TYPE = "live_invite";
