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
  },
  alternates: { canonical: "/" },
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white font-body text-gray-800">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
