// src/app/robots.ts
//
// Generated /robots.txt. Two hosts share this project and want opposite things
// from crawlers:
//
//   francolink.net      — the front-facing website. Crawl everything.
//   app.francolink.net  — the product. Crawl the public lesson catalogue, keep
//                         the logged-in app, API and auth flows out of the index.

import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { APP_URL, SITE_URL, isMarketingHost } from "@/lib/site/hosts";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host");

  if (isMarketingHost(host)) {
    return {
      rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
      sitemap: `${SITE_URL}/sitemap.xml`,
      host: SITE_URL,
    };
  }

  const BASE = APP_URL;
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
