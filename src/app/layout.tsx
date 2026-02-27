import { PWAInstallPrompt } from "@/components/shared/pwa-install-prompt";
import "./globals.css";
import type { Metadata } from "next";
import { Mulish, Roboto } from "next/font/google";
import { getAppConfig } from "@/lib/config";
export const dynamic = 'force-dynamic';
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

  return {
    title: config.meta_title,
    description: config.meta_description,
    icons: {
      icon: config.favicon_url,
      apple: "/apple-touch-icon.png",
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
        <meta name="theme-color" content="#1e3a5f" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FrancoLink" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="theme-color" content="#1e3a5f" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FrancoLink" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
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
        <PWAInstallPrompt />
        {children}
      </body>
    </html>
  );
}
