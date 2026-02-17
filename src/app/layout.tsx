// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getAppConfig } from "@/lib/config";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const config = await getAppConfig();

  return {
    title: config.meta_title,
    description: config.meta_description,
    icons: {
      icon: config.favicon_url,
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
    <html suppressHydrationWarning>
      <head>
        <style>{`
          :root {
            --primary-color: ${config.primary_color};
            --secondary-color: ${config.secondary_color};
            --accent-color: ${config.accent_color};
          }
        `}</style>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}