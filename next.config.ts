import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // The workbook PDF lives outside public/ on purpose -- it is a paid product,
  // and anything under public/ is served to anyone who guesses the path. The
  // download route reads it from disk and stamps the buyer's name on it, so
  // the file has to be traced into that function's bundle explicitly.
  outputFileTracingIncludes: {
    "/api/workbook/download": ["./assets/workbook/**"],
  },
  /**
   * Only HSTS was set before this. These three are the ones that cost nothing
   * and cannot break the product:
   *
   *   nosniff        - stops a browser second-guessing a Content-Type
   *   SAMEORIGIN     - stops the site being framed by someone else. It governs
   *                    US being embedded, not us embedding Daily, so the video
   *                    room is unaffected.
   *   Referrer-Policy- sends the origin cross-site instead of the full URL
   *
   * Two headers are deliberately NOT here. A Content-Security-Policy strict
   * enough to be worth having would have to enumerate Stripe, Supabase, Daily,
   * GA and tldraw plus the inline style this layout injects for theming, and a
   * wrong one fails silently in a way that looks like a product bug. And
   * Permissions-Policy would gate camera/microphone: the lesson room delegates
   * both to a cross-origin Daily iframe, so a careless value there breaks live
   * lessons outright. Both need their own change, with the room tested.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  turbopack: {
    root: process.cwd(),
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "biwacllbpdxzdxtmqtpw.supabase.co" },
    ],
  },
};

export default withNextIntl(nextConfig);
