// src/app/[locale]/layout.tsx
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { CurrencyProvider } from "@/context/currency-context";
import { detectUserGeo } from "@/lib/geo";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

// Generate static params for all locales
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as "en" | "fr")) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Load messages
  const messages = await getMessages({ locale });

  // Detect geo
  const geo = await detectUserGeo();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <CurrencyProvider detectedCurrency={geo.currency}>
        {/* Update html lang attribute */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.lang="${locale}"`,
          }}
        />
        {children}
      </CurrencyProvider>
    </NextIntlClientProvider>
  );
}