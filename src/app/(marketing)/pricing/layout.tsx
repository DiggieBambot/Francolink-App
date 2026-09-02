// src/app/(marketing)/pricing/layout.tsx
//
// The pricing page also exists on the marketing site, which is its canonical home.
// Both hosts used to serve it and both sitemaps used to list it, leaving Google
// to pick an owner. The cross-host canonical below settles it: the app keeps
// serving the page, francolink.net gets the ranking signal.

import type { Metadata } from "next";
import { siteUrl } from "@/lib/site/hosts";

export const metadata: Metadata = {
  title: "Pricing | FrancoLink",
  description:
    "FrancoLink plans: a free tier, Premium for unlimited CEFR lessons and AI practice, and Premium+ for the full experience. Live tutor lessons are priced by each tutor.",
  alternates: { canonical: siteUrl("/pricing") },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
