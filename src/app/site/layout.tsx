// Front-facing website (francolink.net). Middleware rewrites `/` → `/site`,
// so these pages are physically under /site but served at root URLs.
//
// This layout deliberately does NOT include the PWA install prompt, service
// worker or app chrome from the root layout's app-side components — the
// website is a plain marketing site; the product lives on app.francolink.net.

import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { SITE_URL } from "@/lib/site/hosts";
import { JsonLd } from "@/components/site/json-ld";
import { organizationSchema, websiteSchema, ORG_DESCRIPTION } from "@/lib/site/schema";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "FrancoLink — learn a language with certified tutors",
    template: "%s | FrancoLink",
  },
  // The root layout also declares openGraph, and Next resolves ITS relative
  // url against the APP's metadataBase — which put app.francolink.net into
  // og:url on every marketing page, so shared links pointed at the product
  // instead of the website. Redeclaring it here resolves against SITE_URL.
  // Pages may still override `openGraph.url` (tutor profiles do).
  openGraph: {
    type: "website",
    siteName: "FrancoLink",
    url: "/",
    // The website emitted no og:image at all, and the app default pointed at
    // /og-image.png, which 404'd — so every shared link rendered blank.
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FrancoLink — learn French with certified tutors",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FrancoLink — learn French with certified tutors",
    description: ORG_DESCRIPTION,
    images: ["/og-image.png"],
  },
  alternates: { canonical: "/" },
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white font-body text-gray-800">
      {/* Identity, on every page of the website: who FrancoLink is and what it
          is. Nothing declared this before, so search engines and LLMs had only
          prose to infer the entity from. */}
      <JsonLd schema={[organizationSchema(), websiteSchema()]} />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
