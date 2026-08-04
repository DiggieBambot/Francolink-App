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
