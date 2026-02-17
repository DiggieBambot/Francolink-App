// src/app/[locale]/page.tsx
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { LanguageSwitcher } from "@/components/language-switcher";
import { CurrencySwitcher } from "@/components/currency-switcher";
import Link from "next/link";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function LocaleHomePage({ params }: PageProps) {
  const { locale } = await params;
  
  // Enable static rendering
  setRequestLocale(locale);

  return <HomeContent />;
}

// Separate client component for translations
function HomeContent() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">
            FrancoLink
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/tutors"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {t("nav.tutors")}
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {t("nav.pricing")}
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <CurrencySwitcher />
            <LanguageSwitcher />
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2"
            >
              {t("common.login")}
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              {t("common.signup")}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            {t("landing.hero_title")}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {t("landing.hero_subtitle")}
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {t("landing.cta")}
            </Link>
            <Link
              href="/tutors"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors"
            >
              {t("nav.tutors")}
            </Link>
          </div>
        </div>

        {/* Debug info - remove after confirming */}
        <div className="mt-12 p-4 bg-gray-100 rounded-lg text-center text-sm text-gray-500">
          <p>Debug: If you see French text above, i18n is working!</p>
          <p>Hero title should be: &quot;Maîtrisez le français avec des tuteurs experts&quot;</p>
        </div>

        {/* Features */}
        <div className="mt-24 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              title: t("landing.feature_ai"),
              desc: t("landing.feature_ai_desc"),
              icon: "🤖",
            },
            {
              title: t("landing.feature_live"),
              desc: t("landing.feature_live_desc"),
              icon: "👨‍🏫",
            },
            {
              title: t("landing.feature_gamified"),
              desc: t("landing.feature_gamified_desc"),
              icon: "🎮",
            },
            {
              title: t("landing.feature_track"),
              desc: t("landing.feature_track_desc"),
              icon: "📊",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="text-center p-6 rounded-2xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/50 transition-colors"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">
            {t("landing.how_it_works")}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: t("landing.step_1"),
                desc: t("landing.step_1_desc"),
              },
              {
                step: "2",
                title: t("landing.step_2"),
                desc: t("landing.step_2_desc"),
              },
              {
                step: "3",
                title: t("landing.step_3"),
                desc: t("landing.step_3_desc"),
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-24 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          {t("footer.copyright", { year: new Date().getFullYear() })}
        </div>
      </footer>
    </div>
  );
}