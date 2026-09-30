// src/app/(marketing)/pricing/layout.tsx
//
// The pricing page also exists on the marketing site, which is its canonical home.
// Both hosts used to serve it and both sitemaps used to list it, leaving Google
// to pick an owner. The cross-host canonical below settles it: the app keeps
// serving the page, francolink.net gets the ranking signal.

import type { Metadata } from "next";
import { siteUrl } from "@/lib/site/hosts";
import { getFeaturesConfig } from "@/lib/config/settings";
import { AiTutorProvider } from "@/lib/context/ai-tutor-context";

// The page is a client component, so it gets the AI tutor switch (Admin →
// Settings → AI) from here: with the tutor off, its plan lines and FAQ entry
// are dropped. Re-rendered every few minutes to pick up a flip without a deploy.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { aiTutorEnabled } = await getFeaturesConfig();
  return {
    title: "Pricing | FrancoLink",
    description: `FrancoLink plans: a free tier, Premium for unlimited CEFR lessons${
      aiTutorEnabled ? " and AI practice" : ""
    }, and Premium+ for the full experience. Live tutor lessons are priced by each tutor.`,
    alternates: { canonical: siteUrl("/pricing") },
  };
}

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { aiTutorEnabled } = await getFeaturesConfig();
  return <AiTutorProvider enabled={aiTutorEnabled}>{children}</AiTutorProvider>;
}
