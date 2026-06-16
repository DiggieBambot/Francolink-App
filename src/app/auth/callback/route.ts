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

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      // Google OAuth tutor signup: user chose tutor path but role isn't set yet
      if (next.startsWith("/tutor") && (!profile || profile.role === "STUDENT")) {
        // Generate unique invite code
        let inviteCode = "";
        for (let attempt = 0; attempt < 10; attempt++) {
          const candidate = Math.random().toString(36).slice(2, 10).toUpperCase();
          const { data: clash } = await supabase
            .from("users")
            .select("id")
            .eq("tutor_invite_code", candidate)
            .maybeSingle();
          if (!clash) { inviteCode = candidate; break; }
        }

        const { data: planDetails } = await supabase
          .from("tutor_plans")
          .select("student_limit, session_limit")
          .eq("key", "FREE")
          .single();

        if (profile) {
          await supabase.from("users").update({
            role: "TUTOR",
            tutor_plan: "FREE",
            tutor_invite_code: inviteCode,
            student_limit: planDetails?.student_limit || 5,
            monthly_session_limit: planDetails?.session_limit || 10,
          }).eq("id", user.id);
        }

        response.headers.set("location", `${origin}/tutor`);
      } else if (!searchParams.get("next")) {
        // No explicit next: route by role
        let dest = "/dashboard";
        if (profile?.role === "TUTOR") dest = "/tutor";
        else if (profile?.role === "ADMIN") dest = "/admin";
        response.headers.set("location", `${origin}${dest}`);
      }
    }
  } catch {
    // fall back to the default redirect already set
  }

  return response;
}
