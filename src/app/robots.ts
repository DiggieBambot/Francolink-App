// src/app/robots.ts
//
// Generated /robots.txt. Lets search engines crawl the public marketing +
// lesson-catalogue pages, blocks the logged-in app, API and auth flows, and
// points crawlers at the sitemap.

import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://app.francolink.net";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private / app-only areas — no SEO value, keep them out of the index.
        disallow: [
          "/api/",
          "/auth/",
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/callback",
          "/onboarding",
          "/join",
          "/dashboard",
          "/learn",
          "/profile",
          "/settings",
          "/notifications",
          "/placement-test",
          "/checkout",
          "/student",
          "/messages",
          "/progress",
          "/practice",
          "/lessons",
          "/upgrade-plus",
          "/preview",
          "/room",
          "/space",
          "/become-tutor",
          "/tutor/",
          "/admin",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
