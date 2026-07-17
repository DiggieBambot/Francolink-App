import { PWAInstallPrompt } from "@/components/shared/pwa-install-prompt";
import { ServiceWorkerRegistrar } from "@/components/shared/service-worker-registrar";
import { GoogleAnalytics } from "@/components/shared/google-analytics";
import "./globals.css";
import type { Metadata } from "next";
import { Mulish, Roboto } from "next/font/google";
import { getAppConfig } from "@/lib/config";

// NOTE: no `force-dynamic` here — it forced every page in the app to render
// dynamically on each request. App pages that read cookies opt into dynamic
// automatically; public pages (library, marketing) can now be cached/ISR.
export const dynamicParams = true;
const mulish = Mulish({
  subsets: ["latin"],
  variable: "--font-mulish",
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const config = await getAppConfig();
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://app.francolink.net";

  return {
    // Resolves relative canonical/OG/icon URLs to absolute ones (required for
    // valid Open Graph + Twitter tags). Pages can override per-route.
    metadataBase: new URL(base),
    // Pages set their own full title (codebase convention: "Page | FrancoLink"),
    // so no title.template here — a template would double the brand suffix.
    title: config.meta_title,
    description: config.meta_description,
    icons: {
      icon: config.favicon_url,
      apple: "/apple-touch-icon.png",
    },
    openGraph: {
      type: "website",
      siteName: "Francolink",
      title: config.meta_title,
      description: config.meta_description,
      url: "/",
      images: [config.og_image],
    },
    twitter: {
      card: "summary_large_image",
      title: config.meta_title,
      description: config.meta_description,
      images: [config.og_image],
    },
    // Google Search Console ownership verification (HTML-tag method).
    // Public token — env overrides the committed default if ever needed.
    verification: {
      google:
        process.env.GOOGLE_SITE_VERIFICATION ||
        "q5OAsmmbxgyUdtqXHq3lU8kO1DuEaVi6eJMmX_f5HMI",
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getAppConfig();

  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#1e3a5f" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FrancoLink" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --color-primary: ${config.primary_color};
                --color-secondary: ${config.secondary_color};
                --color-accent: ${config.accent_color};
              }
            `,
          }}
        />
      </head>
      <body className={`${roboto.variable} ${mulish.variable} font-body`}>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || "G-YLH30JTCQT"} />
        <ServiceWorkerRegistrar />
        <PWAInstallPrompt />
        {children}
      </body>
    </html>
  );
}
