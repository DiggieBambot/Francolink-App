import "./globals.css";
import type { Metadata } from "next";
import { Mulish, Roboto } from "next/font/google";
import { getAppConfig } from "@/lib/config";

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
        {children}
      </body>
    </html>
  );
}