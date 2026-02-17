// src/middleware.ts
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

// Create intl middleware
const intlMiddleware = createIntlMiddleware(routing);

// Only these patterns skip intl entirely
const SKIP_INTL = [
  "/api/",
  "/_next/",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip static/api routes
  if (SKIP_INTL.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 2. Run Supabase auth first (refresh session)
  const authResponse = await updateSession(request);

  // If auth wants redirect, do it
  if (authResponse?.status && authResponse.status >= 300 && authResponse.status < 400) {
    return authResponse;
  }

  // 3. Run intl middleware for ALL routes now
  const intlResponse = intlMiddleware(request);

  // 4. Merge auth cookies
  if (authResponse) {
    const cookies = authResponse.headers.getSetCookie();
    cookies.forEach((cookie) => {
      intlResponse.headers.append("Set-Cookie", cookie);
    });
  }

  return intlResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json)$).*)",
  ],
};