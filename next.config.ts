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
