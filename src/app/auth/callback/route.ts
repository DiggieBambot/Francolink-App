import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              // Force secure cookie settings for PWA
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 365, // 1 year - keeps user signed in
            });
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Auth callback error:", error.message);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  // If no explicit next was requested, route by role so tutors/admins land in
  // their own area instead of the student dashboard. (Override the Location
  // header on the existing response so the freshly-set session cookies persist.)
  if (!searchParams.get("next")) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        let dest = "/dashboard";
        if (profile?.role === "TUTOR") dest = "/tutor";
        else if (profile?.role === "ADMIN") dest = "/admin";
        response.headers.set("location", `${origin}${dest}`);
      }
    } catch {
      // fall back to the default /dashboard redirect already set
    }
  }

  return response;
}
