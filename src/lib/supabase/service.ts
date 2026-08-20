// src/lib/supabase/service.ts
//
// Service-role client, for server code that has already done its own
// authorization and needs to act outside storage/table RLS.
//
// Storage is the main reason this exists: the `assets` bucket has no INSERT
// policy for `authenticated`, so a user-scoped client cannot write to it at
// all. Upload routes authorize the caller themselves (role checks, path
// derived from a resolved target id) and then write with this client.
//
// Never build this from client code — SUPABASE_SERVICE_ROLE_KEY is secret and
// bypasses every policy in the database.

import { createClient } from "@supabase/supabase-js";

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
