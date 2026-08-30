import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceRoleClient } from "@supabase/supabase-js";
import { sendWelcomeOnce } from "@/lib/email/transactional";

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
            // Pass Supabase's options through unchanged. Forcing httpOnly here
            // hid the auth cookies from the browser SDK (navbar getUser() → null)
            // and made client-side sign-out unable to clear them. Keep them
            // readable by the client; sign-out goes through /auth/signout which
            // clears them server-side regardless.
            response.cookies.set(name, value, {
              ...options,
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

      // Admin-console Google sign-in: NEVER auto-provision a staff role via
      // OAuth. Only an account that already has ADMIN/COMMUNITY_MANAGER may
      // pass; anyone else is rejected and signed out, same as a bad password
      // on /admin/login. This must run before the generic role-routing below.
      if (searchParams.get("staff") === "1") {
        const role = (profile?.role || "").toUpperCase();
        if (role !== "ADMIN" && role !== "COMMUNITY_MANAGER") {
          await supabase.auth.signOut();
          // Carry the sign-out's cleared cookies (mutated onto `response` by
          // the same cookie handler) instead of losing them in a fresh redirect.
          const deny = NextResponse.redirect(
            `${origin}/admin/login?error=${encodeURIComponent("Access denied. This Google account has no staff access.")}`
          );
          response.headers.getSetCookie().forEach((c) => deny.headers.append("Set-Cookie", c));
          return deny;
        }
        const dest = role === "COMMUNITY_MANAGER" ? "/admin/support" : "/admin";
        response.headers.set("location", `${origin}${dest}`);
        return response;
      }

      // Google OAuth tutor signup: user chose the tutor path but isn't a tutor
      // yet. Students are role "USER" here (not "STUDENT"); upgrade anyone who
      // isn't already a TUTOR/ADMIN. Brand-new Google users may have no row yet,
      // so upsert (create-or-update) rather than update.
      const alreadyPrivileged = profile?.role === "TUTOR" || profile?.role === "ADMIN";
      if (next.startsWith("/tutor") && !alreadyPrivileged) {
        // Privileged writes need the service-role client (RLS would block a
        // self role-change, and a new user has no row for RLS to match).
        const admin = createServiceRoleClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { persistSession: false } }
        );

        // Generate unique invite code.
        //
        // crypto, not Math.random(): the code is a permanent bearer credential
        // (holding it attaches you to this tutor), and V8's PRNG state can be
        // recovered from a handful of observed outputs — so codes minted with
        // Math.random() are derivable from other codes without ever seeing
        // this one. Base32 without I/O/0/1, which get misread when a tutor
        // reads a code aloud or retypes it from a message.
        const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let inviteCode = "";
        for (let attempt = 0; attempt < 10; attempt++) {
          const bytes = randomBytes(10);
          const candidate = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
          const { data: clash } = await admin
            .from("users")
            .select("id")
            .eq("tutor_invite_code", candidate)
            .maybeSingle();
          if (!clash) { inviteCode = candidate; break; }
        }

        const { data: planDetails } = await admin
          .from("tutor_plans")
          .select("student_limit")
          .eq("key", "FREE")
          .maybeSingle();

        await admin.from("users").upsert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0],
          role: "TUTOR",
          tutor_plan: "FREE",
          tutor_invite_code: inviteCode,
          student_limit: planDetails?.student_limit || 5,
          commission_balance: 0,
        });

        response.headers.set("location", `${origin}/tutor`);
      } else if (!searchParams.get("next")) {
        // No explicit next: route by role
        let dest = "/dashboard";
        if (profile?.role === "TUTOR") dest = "/tutor";
        else if (profile?.role === "ADMIN") dest = "/admin";
        response.headers.set("location", `${origin}${dest}`);
      }

      // Welcome email (idempotent; runs after any tutor row is created above so
      // the role-specific copy is correct). No-ops if there's no profile yet.
      await sendWelcomeOnce(user.id);
    }
  } catch {
    // fall back to the default redirect already set
  }

  return response;
}
