// Who is calling this API route: the web app (session cookies) or the mobile
// app (a Supabase access token in `Authorization: Bearer <jwt>`).
//
// The mobile app signs in with supabase-js and has no cookies, so routes it
// calls resolve the user here instead of through createClient() alone. The
// token is verified by Supabase Auth (getUser round-trips to the auth server),
// never just decoded. Bearer tokens are not sent automatically by browsers, so
// accepting them adds no cross-site request risk to cookie-based routes.
//
// `supabase` acts as that user either way, so row-level security applies to
// every query made with it.

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createCookieClient } from "@/lib/supabase/server";

export interface RequestAuth {
  user: User | null;
  supabase: SupabaseClient;
  /** "bearer" for the mobile app; "cookie" for the website. */
  via: "bearer" | "cookie";
}

export async function getRequestAuth(request: Request): Promise<RequestAuth> {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);

  if (match) {
    const token = match[1].trim();
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );
    const { data, error } = await supabase.auth.getUser(token);
    return { user: error ? null : data.user, supabase, via: "bearer" };
  }

  const supabase = await createCookieClient();
  const { data } = await supabase.auth.getUser();
  return { user: data.user, supabase, via: "cookie" };
}
