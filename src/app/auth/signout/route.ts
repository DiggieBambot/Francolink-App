import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

// Server-side sign-out. This is the reliable path: the browser-side
// supabase.auth.signOut() cannot delete httpOnly auth cookies (the Google
// OAuth callback sets them httpOnly), so a client-only sign-out silently
// leaves the user logged in. Here we clear the session server-side AND
// explicitly expire every Supabase auth cookie on the response, then redirect.
//
// Supports both GET (so a plain <a href> / window.location works) and POST.
async function handle(request: NextRequest) {
  const { origin } = new URL(request.url);
  const response = NextResponse.redirect(`${origin}/login`, { status: 303 });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Revoke the session (best-effort) — this also queues cookie deletions.
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // ignore — we still hard-delete the cookies below
  }

  // Belt-and-suspenders: explicitly expire any remaining sb-* auth cookies,
  // including httpOnly ones the JS client could never touch.
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      response.cookies.set(cookie.name, "", {
        path: "/",
        maxAge: 0,
        expires: new Date(0),
      });
    }
  }

  // Prevent any cache layer from serving an authenticated shell after sign-out.
  response.headers.set("Cache-Control", "no-store, max-age=0");

  return response;
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
